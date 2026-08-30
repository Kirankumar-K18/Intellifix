import React from "react";

export function Table({
  columns = [],
  data = [],
  emptyMessage = "No data available",
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        style={{
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 1000,
          }}
        >
          {/* TABLE HEADER */}
          <thead
            style={{
              background: "var(--bg-body)",
            }}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  style={{
                    transition: "background .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(59,130,246,.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "14px 18px",
                        borderBottom:
                          "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        whiteSpace:
                          col.key === "actions"
                            ? "nowrap"
                            : "normal",
                      }}
                    >
                      {col.render
                        ? col.render(
                            row[col.key],
                            row
                          )
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}