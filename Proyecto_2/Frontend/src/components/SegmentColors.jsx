// Colores por segmento — consistentes en todas las vistas
export const SEG_COLORS = [
  { bg: "rgba(88,166,255,0.15)",  border: "#58a6ff", text: "#58a6ff"  },
  { bg: "rgba(63,185,80,0.15)",   border: "#3fb950", text: "#3fb950"  },
  { bg: "rgba(232,168,56,0.15)",  border: "#E8A838", text: "#E8A838"  },
  { bg: "rgba(188,140,255,0.15)", border: "#bc8cff", text: "#bc8cff"  },
  { bg: "rgba(248,81,73,0.15)",   border: "#f85149", text: "#f85149"  },
];

export function segColor(i) {
  return SEG_COLORS[i % SEG_COLORS.length];
}

export function SegBadge({ index, label }) {
  const c = segColor(index);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {label ?? `Segmento ${index + 1}`}
    </span>
  );
}
