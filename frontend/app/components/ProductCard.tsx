"use client";
import { useState } from "react";

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

function HealthRing({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const progress = (score / 100) * circ;
  const color = score >= 70 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#f87171";
  const label = score >= 70 ? "Healthy" : score >= 45 ? "Moderate" : "Unhealthy";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${progress} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" fontFamily="'DM Sans', sans-serif">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="#71717a" fontSize="10" fontFamily="'DM Sans', sans-serif">/ 100</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

function NutrientRow({ emoji, label, value, unit, max, color }: any) {
  const pct = Math.min(100, (parseFloat(value) / max) * 100) || 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{emoji} {label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color, borderRadius: 999,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

function AIInsightCard({ product }: { product: any }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      setInsight(data.insight);
    } catch { setInsight("Could not load AI insight."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "16px", marginTop: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: insight ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13 }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "0.02em" }}>AI Insight</span>
        </div>
        {!insight && (
          <button onClick={fetchInsight} disabled={loading} style={{
            background: "var(--surface-2)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: 8, padding: "5px 12px",
            fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
          }}>
            {loading ? "Analyzing..." : "Analyze →"}
          </button>
        )}
      </div>
      {insight && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{insight}</p>
      )}
      {!insight && !loading && (
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>
          Get an AI-powered health summary for this product
        </p>
      )}
    </div>
  );
}

const nutriscoreColors: Record<string, string> = {
  a: "#4ade80", b: "#a3e635", c: "#fbbf24", d: "#fb923c", e: "#f87171",
};

export default function ProductCard({ product }: { product: any }) {
  const score = calculateHealthScore(product.nutrition, product.nutriscore);
  const nsColor = nutriscoreColors[product.nutriscore] || "#71717a";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>

      {/* Product Header */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 16, display: "flex", gap: 14, alignItems: "center",
      }}>
        {product.image && (
          <img src={product.image} alt={product.name} style={{
            width: 64, height: 64, objectFit: "contain", borderRadius: 10,
            background: "white", padding: 6, flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{product.name}</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{product.brand}</p>
          {product.nutriscore !== "N/A" && (
            <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5,
              background: `${nsColor}15`, border: `1px solid ${nsColor}30`,
              borderRadius: 6, padding: "3px 8px",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: nsColor, fontFamily: "'Geist Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Nutriscore {product.nutriscore.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Health Score */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 20, display: "flex", justifyContent: "center",
      }}>
        <HealthRing score={score} />
      </div>

      {/* AI Insight */}
      <AIInsightCard product={product} />

      {/* Nutrition */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 14,
      }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nutrition per 100g</p>
        <NutrientRow emoji="🔥" label="Calories" value={product.nutrition.calories} unit=" kcal" max={500} color="#f97316" />
        <NutrientRow emoji="🍬" label="Sugar" value={product.nutrition.sugar} unit="g" max={50} color="#ec4899" />
        <NutrientRow emoji="🧈" label="Fat" value={product.nutrition.fat} unit="g" max={50} color="#eab308" />
        <NutrientRow emoji="💪" label="Protein" value={product.nutrition.protein} unit="g" max={50} color="#4ade80" />
        <NutrientRow emoji="🍞" label="Carbs" value={product.nutrition.carbs} unit="g" max={100} color="#818cf8" />
      </div>

      {/* Ingredients */}
      {product.ingredients !== "Not available" && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 16,
        }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Ingredients</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{product.ingredients}</p>
        </div>
      )}
    </div>
  );
}