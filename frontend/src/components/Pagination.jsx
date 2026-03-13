import React from "react";

const Pagination = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    pages.push(page);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.8rem 1rem",
        borderTop: "1px solid #e2e8f0",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
        Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalItems)}-
        {Math.min(currentPage * pageSize, totalItems)} de {totalItems}
      </span>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <button
          className="btn btn-outline"
          style={{ padding: "0.25rem 0.55rem" }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </button>

        {pages.map((page) => (
          <button
            key={page}
            className={
              page === currentPage ? "btn btn-primary" : "btn btn-outline"
            }
            style={{
              padding: "0.25rem 0.55rem",
              minWidth: 34,
              justifyContent: "center",
            }}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="btn btn-outline"
          style={{ padding: "0.25rem 0.55rem" }}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Pagination;
