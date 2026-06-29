import React from "react";

/* ---------------- CARD ---------------- */

export function Card({
  children,
  title,
  action,
  style = {},
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        boxShadow: "var(--shadow)",
        transition: "all .25s",
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h3>

          {action}
        </div>
      )}

      {children}
    </div>
  );
}

/* ---------------- SECTION ---------------- */

export function Section({
  title,
  subtitle,
  children,
  style = {},
}) {
  return (
    <section
      style={{
        marginBottom: 28,
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div
          style={{
            marginBottom: 16,
          }}
        >
          {title && (
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {title}
            </h2>
          )}

          {subtitle && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}