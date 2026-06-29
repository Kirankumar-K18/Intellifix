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
        padding: 20,
        boxShadow: "var(--shadow)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 10px 25px rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {value}
          </div>

          {sub && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              {sub}
            </div>
          )}
        </div>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: color,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            fontSize: 26,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}