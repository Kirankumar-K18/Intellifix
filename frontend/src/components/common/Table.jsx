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
          }}
        >
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
                    fontSize: 13,
                    fontWeight: 700,
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

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
                  key={index}
                  style={{
                    transition: ".2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(59,130,246,.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontSize: 14,
                      }}
                    >
                      {col.render
                        ? col.render(row)
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