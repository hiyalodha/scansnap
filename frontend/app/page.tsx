"use client";

import { useState, useEffect } from "react";
import Scanner from "./components/Scanner";
import ProductCard from "./components/ProductCard";
import CompareView from "./components/CompareView";

function calculateHealthScore(nutrition: any, nutriscore: string): number {
  let score = 70;
  const nutriscoreMap: Record<string, number> = { a: 30, b: 15, c: 0, d: -15, e: -30 };
  score += nutriscoreMap[nutriscore] ?? 0;
  const sugar = parseFloat(nutrition.sugar);
  if (!isNaN(sugar)) { if (sugar > 20) score -= 20; else if (sugar > 10) score -= 10; else if (sugar < 5) score += 10; }
  const fat = parseFloat(nutrition.fat);
  if (!isNaN(fat)) { if (fat > 20) score -= 10; else if (fat < 5) score += 5; }
  const protein = parseFloat(nutrition.protein);
  if (!isNaN(protein)) { if (protein > 10) score += 10; else if (protein > 5) score += 5; }
  return Math.min(100, Math.max(0, Math.round(score)));
}

const nsColors: Record<string, string> = {
  a: "#4ade80", b: "#a3e635", c: "#fbbf24", d: "#fb923c", e: "#f87171",
};

export default function Home() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [compareProduct, setCompareProduct] = useState<any>(null);
  const [compareBarcode, setCompareBarcode] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch("https://scansnap-backend.onrender.com/scan-history");
      const data = await res.json();
      setHistory(data.scans || []);
    } catch {}
  };

  useEffect(() => { fetchHistory(); }, []);

  const fetchProduct = async (barcode: string) => {
    setLoading(true);
    setError("");
    setProduct(null);
    setShowCompare(false);
    setCompareProduct(null);
    try {
      const res = await fetch(`https://scansnap-backend.onrender.com/product/${barcode}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProduct(data);
      const healthScore = calculateHealthScore(data.nutrition, data.nutriscore);
      await fetch("https://scansnap-backend.onrender.com/scan-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: data.barcode, name: data.name, brand: data.brand,
          image: data.image, nutriscore: data.nutriscore, health_score: healthScore,
        }),
      });
      fetchHistory();
    } catch { setError("Product not found. Try a food or drink barcode."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── TOP NAVBAR ── */}
      <nav style={{
        width: "100%",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,8,9,0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⬡</div>
          <div>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>
              ScanSnap
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
              Food Intelligence
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20,
            background: "rgba(74,222,128,0.1)", color: "#4ade80",
            border: "1px solid rgba(74,222,128,0.2)",
            fontWeight: 500,
          }}>● Live</span>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ── */}
      <div style={{
        flex: 1, width: "100%", maxWidth: 1200,
        margin: "0 auto", padding: "32px 24px",
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: 24, alignItems: "start",
      }}>

        {/* ── LEFT PANEL — Scanner + History ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Hero Text */}
          <div className="fade-up">
            <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, color: "var(--text)", marginBottom: 8 }}>
              Food intelligence,<br />
              <span style={{ color: "#4ade80" }}>instantly.</span>
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Scan any food barcode to get nutrition data, AI health insights, and a smart health score.
            </p>
          </div>

          {/* Scanner */}
          <div className="fade-up-1" style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <Scanner onScan={fetchProduct} />
          </div>

          {/* Manual Input */}
          <div className="fade-up-2" style={{
            display: "flex", gap: 8,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "8px 8px 8px 16px",
          }}>
            <input
              type="text"
              placeholder="Enter barcode manually..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualBarcode.trim() && fetchProduct(manualBarcode.trim())}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text)", fontSize: 13, fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => manualBarcode.trim() && fetchProduct(manualBarcode.trim())}
              style={{
                background: "var(--text)", color: "var(--bg)", border: "none",
                borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Scan
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="fade-up" style={{
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 12, padding: "12px 16px",
            }}>
              <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
            </div>
          )}

          {/* Recent Scans */}
          {history.length > 0 && (
            <div className="fade-up-3">
              <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Scans</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((scan, i) => (
                  <div key={i} onClick={() => fetchProduct(scan.barcode)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "10px 12px", cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                    }}
                  >
                    {scan.image && (
                      <img src={scan.image} alt={scan.name} style={{
                        width: 36, height: 36, objectFit: "contain",
                        borderRadius: 8, background: "white", padding: 3, flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scan.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{scan.brand}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <span className="mono" style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, textTransform: "uppercase",
                        background: `${nsColors[scan.nutriscore]}20`, color: nsColors[scan.nutriscore] || "var(--text-muted)",
                      }}>{scan.nutriscore}</span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>{scan.health_score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Product Results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!product && !loading && (
            <div className="fade-up" style={{
              height: 400, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              background: "var(--surface)", border: "1px dashed var(--border)",
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 40 }}>📷</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Scan a product</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Results will appear here</p>
            </div>
          )}

          {loading && (
            <div className="fade-up" style={{
              height: 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "var(--green)",
                animation: "pulse-ring 1.2s ease infinite",
              }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Fetching product data...</span>
            </div>
          )}

          {product && (
            <div className="fade-up">
              <ProductCard product={product} />
            </div>
          )}

          {/* Compare */}
          {product && !showCompare && (
            <div className="fade-up" style={{
              display: "flex", gap: 8,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "8px 8px 8px 16px",
            }}>
              <input
                type="text"
                placeholder="Enter 2nd barcode to compare..."
                value={compareBarcode}
                onChange={(e) => setCompareBarcode(e.target.value)}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--text)", fontSize: 13, fontFamily: "inherit",
                }}
              />
              <button
                onClick={async () => {
                  if (!compareBarcode.trim()) return;
                  try {
                    const res = await fetch(`https://scansnap-backend.onrender.com/product/${compareBarcode.trim()}`);
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    setCompareProduct(data);
                    setShowCompare(true);
                  } catch { setError("Second product not found."); }
                }}
                style={{
                  background: "#7c3aed", color: "white", border: "none",
                  borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Compare
              </button>
            </div>
          )}

          {showCompare && compareProduct && (
            <div className="fade-up">
              <CompareView
                product1={product} product2={compareProduct}
                onClose={() => { setShowCompare(false); setCompareProduct(null); setCompareBarcode(""); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}