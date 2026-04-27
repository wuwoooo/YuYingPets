import { buildPaginationItems } from '../hooks/usePagination';

type TablePaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pageItems = buildPaginationItems(totalPages, currentPage);

  return (
    <div className="pagination">
      <div className="pagination-summary">
        第 {start}-{end} 条 / 共 {totalItems} 条
      </div>
      <label className="pagination-page-size">
        <span>每页</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[10, 20, 50].map((option) => (
            <option key={option} value={option}>
              {option} 条
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="pg pg-nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        上一页
      </button>
      {pageItems.map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className={`pg${item === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="pg dots">
            ...
          </span>
        ),
      )}
      <button type="button" className="pg pg-nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        下一页
      </button>
    </div>
  );
}
