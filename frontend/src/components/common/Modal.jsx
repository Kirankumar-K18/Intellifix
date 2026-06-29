import React from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
  width = 500,
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "95%",
          background: "var(--bg-card)",
          borderRadius: 14,
          boxShadow: "0 20px 40px rgba(0,0,0,.25)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 22,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}