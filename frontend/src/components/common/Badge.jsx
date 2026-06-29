import React from "react";

/* ---------------- STATUS BADGE ---------------- */

export function Badge({ type }) {
  const styles = {
    pending: {
      bg: "#FEF3C7",
      color: "#B45309",
    },
    in_progress: {
      bg: "#DBEAFE",
      color: "#1D4ED8",
    },
    resolved: {
      bg: "#DCFCE7",
      color: "#15803D",
    },
    rejected: {
      bg: "#FEE2E2",
      color: "#DC2626",
    },
  };

  const badge = styles[type] || {
    bg: "var(--bg-card)",
    color: "var(--text-primary)",
  };

  const text = type
    ? type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Unknown";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "6px 12px",

        borderRadius: 999,

        background: badge.bg,

        color: badge.color,

        fontSize: 12,

        fontWeight: 600,

        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/* ---------------- PRIORITY BADGE ---------------- */

export function PriorityBadge({ priority }) {
  const styles = {
    low: {
      bg: "#DCFCE7",
      color: "#15803D",
    },
    medium: {
      bg: "#FEF3C7",
      color: "#B45309",
    },
    high: {
      bg: "#FEE2E2",
      color: "#DC2626",
    },
    critical: {
      bg: "#7F1D1D",
      color: "#FFFFFF",
    },
  };

  const badge = styles[priority] || {
    bg: "var(--bg-card)",
    color: "var(--text-primary)",
  };

  const text = priority
    ? priority.charAt(0).toUpperCase() + priority.slice(1)
    : "Normal";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "6px 12px",

        borderRadius: 999,

        background: badge.bg,

        color: badge.color,

        fontSize: 12,

        fontWeight: 600,

        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/* ---------------- STAR RATING ---------------- */

export function StarRating({ value = 0 }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= value ? "#F59E0B" : "#D1D5DB",
            fontSize: 16,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}