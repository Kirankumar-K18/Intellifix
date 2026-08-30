import React from "react";

export function EmptyState({
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
        padding: "60px 20px",
        minHeight: 180,
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "var(--text-primary)",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          style={{
            marginTop: 8,
            marginBottom: 20,
            color: "var(--text-secondary)",
            fontSize: 13,
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}

      {action}
    </div>
  );
}