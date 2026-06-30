import React from "react";
import { useNavigate } from "react-router-dom";

/* ---------------- BUTTON ---------------- */

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  style = {},
  ...props
}) {
  const variants = {
    primary: {
      background: "var(--primary)",
      color: "#fff",
      border: "none",
    },

    secondary: {
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      border: "1px solid var(--border)",
    },

    danger: {
      background: "#DC2626",
      color: "#fff",
      border: "none",
    },

    success: {
      background: "#16A34A",
      color: "#fff",
      border: "none",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        height: 42,
        padding: "0 18px",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: 14,
        transition: "0.2s",
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- ICON BUTTON ---------------- */

export function IconButton({
  icon,
  onClick,
  title,
  style = {},
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: ".2s",
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

/* ---------------- BACK BUTTON ---------------- */

export function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--text-primary)",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 600,
        padding: 0,
      }}
    >
      ← Back
    </button>
  );
}