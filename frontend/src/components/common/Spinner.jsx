import React from "react";

export function Spinner({
  size = 42,
  text = "Loading..."
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
        gap: 14,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: "4px solid var(--border)",
          borderTop: "4px solid var(--primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />

      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        {text}
      </span>
    </div>
  );
}