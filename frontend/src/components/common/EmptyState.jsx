import React from "react";

export function EmptyState({
  icon = "📭",
  title = "Nothing here",
  subtitle = "No data available",
  action = null,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          fontSize: 52,
          marginBottom: 16,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: 0,
          color: "var(--text-primary)",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 8,
          marginBottom: 24,
          color: "var(--text-secondary)",
          fontSize: 14,
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>

      {action}
    </div>
  );
}