"use client";

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

function MiniRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 70 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#f87171";
  return (
    <svg width="70" height="70" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${progress} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <text x="35" y="39" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="'DM Sans', sans-serif">{score}</text>
    </svg>
  );
}

const nsColors: Record<string, string> = {
  a: "#4ade80", b: "#a3e635", c: "#fbbf24", d: "#fb923c", e: "#f87171",
};

function CompareRow({ label, val1, val2, lowerIsBetter = true }: any) {
  const n1 = parseFloat(val1);
  const n2 = parseFloat(val2);
  const valid = !isNaN(n1) && !isNaN(n2) && n1 !== n2;
  const win1 = valid && (lowerIsBetter ? n1 < n2 : n1 > n2);
  const win2 = valid && (lowerIsBetter ? n2 < n1 : n2 > n1);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center", padding: "10px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{
        textAlign: "right", paddingRight: 12, fontSize: 13,
        fontWeight: 600, fontFamily: "'Geist Mono', monospace",
        color: win1 ? "#4ade80" : "var(--text)",
      }}>{val1}</span>
      <span style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)", minWidth: 70 }}>{label}</span>
      <span style={{
        textAlign: "left", paddingLeft: 12, fontSize: 13,
        fontWeight: 600, fontFamily: "'Geist Mono', monospace",
        color: win2 ? "#4ade80" : "var(--text)",
      }}>{val2}</span>
    </div>
  );
}

export default function CompareView({ product1, product2, onClose }: {
  product1: any; product2: any; onClose: () => void;
}) {
  const score1 = calculateHealthScore(product1.nutrition, product1.nutriscore);
  const score2 = calculateHealthScore(product2.nutrition, product2.nutriscore);
  const winner = score1 > score2 ? product1.name : score2 > score1 ? product2.name : null;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: 16, marginTop: 8,
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Comparison</p>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid var(--border)", color: "var(--text-muted)",
          borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
        }}>Close</button>
      </div>

      {/* Products Side by Side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[product1, product2].map((p, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "var(--surface-2)", borderRadius: 12, padding: 12, textAlign: "center",
          }}>
            {p.image && (
              <img src={p.image} alt={p.name} style={{
                width: 56, height: 56, objectFit: "contain",
                borderRadius: 8, background: "white", padding: 4,
              }} />
            )}
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{p.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "'Geist Mono', monospace",
              padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
              background: `${nsColors[p.nutriscore]}15`,
              color: nsColors[p.nutriscore] || "var(--text-muted)",
              border: `1px solid ${nsColors[p.nutriscore]}30`,
            }}>{p.nutriscore}</span>
            <MiniRing score={i === 0 ? score1 : score2} />
          </div>
        ))}
      </div>

      {/* Winner */}
      <div style={{
        textAlign: "center", padding: "10px", borderRadius: 10,
        background: winner ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
        border: `1px solid ${winner ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}`,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: winner ? "#4ade80" : "#fbbf24" }}>
          {winner ? `${winner} is healthier` : "It's a tie"}
        </p>
      </div>

      {/* Nutrition Table */}
      <div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr",
          marginBottom: 4,
        }}>
          <span style={{ textAlign: "right", paddingRight: 12, fontSize: 10, color: "var(--text-faint)" }}>
            {product1.name.split(" ")[0]}
          </span>
          <span style={{ textAlign: "center", fontSize: 10, color: "var(--text-faint)", minWidth: 70 }}>per 100g</span>
          <span style={{ textAlign: "left", paddingLeft: 12, fontSize: 10, color: "var(--text-faint)" }}>
            {product2.name.split(" ")[0]}
          </span>
        </div>
        <CompareRow label="🔥 Calories" val1={`${product1.nutrition.calories}`} val2={`${product2.nutrition.calories}`} />
        <CompareRow label="🍬 Sugar" val1={`${product1.nutrition.sugar}g`} val2={`${product2.nutrition.sugar}g`} />
        <CompareRow label="🧈 Fat" val1={`${product1.nutrition.fat}g`} val2={`${product2.nutrition.fat}g`} />
        <CompareRow label="💪 Protein" val1={`${product1.nutrition.protein}g`} val2={`${product2.nutrition.protein}g`} lowerIsBetter={false} />
        <CompareRow label="🍞 Carbs" val1={`${product1.nutrition.carbs}g`} val2={`${product2.nutrition.carbs}g`} />
      </div>
    </div>
  );
}