import React from "react";

export function StatCard({
  label,
  value,
  icon,
  color = "var(--primary)",
  sub,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "22px",
        minHeight: "135px",          // ⭐ Same height for all cards
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      <div>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 8,
            minHeight: 18,          // ⭐ Keeps all cards equal height
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          {sub || ""}
        </div>
      </div>

      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: color,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );
}