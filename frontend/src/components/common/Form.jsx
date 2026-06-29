import React from "react";

/* ---------------- INPUT ---------------- */

export function Input({
  label,
  error,
  style = {},
  ...props
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {label}
        </label>
      )}

      <input
        {...props}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          border: "1px solid var(--border)",
          borderRadius: 10,
          outline: "none",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: 14,
          transition: ".2s",
          ...style,
        }}
      />

      {error && (
        <small
          style={{
            color: "#DC2626",
            marginTop: 6,
            display: "block",
          }}
        >
          {error}
        </small>
      )}
    </div>
  );
}

/* ---------------- SELECT ---------------- */

export function Select({
  label,
  children,
  error,
  style = {},
  ...props
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {label}
        </label>
      )}

      <select
        {...props}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          outline: "none",
          fontSize: 14,
          ...style,
        }}
      >
        {children}
      </select>

      {error && (
        <small
          style={{
            color: "#DC2626",
            display: "block",
            marginTop: 6,
          }}
        >
          {error}
        </small>
      )}
    </div>
  );
}

/* ---------------- TEXTAREA ---------------- */

export function Textarea({
  label,
  error,
  style = {},
  ...props
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {label}
        </label>
      )}

      <textarea
        {...props}
        style={{
          width: "100%",
          minHeight: 120,
          padding: 14,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          outline: "none",
          resize: "vertical",
          fontSize: 14,
          ...style,
        }}
      />

      {error && (
        <small
          style={{
            color: "#DC2626",
            display: "block",
            marginTop: 6,
          }}
        >
          {error}
        </small>
      )}
    </div>
  );
}