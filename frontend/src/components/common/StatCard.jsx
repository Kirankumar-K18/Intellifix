import React from "react";

export function StatCard({
  label,
  value,
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
        minHeight: "135px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "var(--shadow)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 10px 24px rgba(0,0,0,.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      {/* Label */}
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

      {/* Value */}
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

      {/* Sub text */}
      <div
        style={{
          marginTop: 8,
          minHeight: 18,
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        {sub || ""}
      </div>

      {/* Accent line */}
      <div
        style={{
          width: 36,
          height: 3,
          borderRadius: 2,
          background: color,
          marginTop: 12,
        }}
      />
    </div>
  );
}