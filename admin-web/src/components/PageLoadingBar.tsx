/** 页面顶部 indeterminate 加载条 */
export function PageLoadingBar() {
  return (
    <div className="page-loading-bar" role="progressbar" aria-label="数据加载中">
      <div className="page-loading-bar-track">
        <div className="page-loading-bar-fill" />
      </div>
    </div>
  );
}

type PageLoadingBodyProps = {
  label?: string;
};

/** 数据区占位：加载完成前替代 KPI / 图表等内容，避免显示 0 或空态 */
export function PageLoadingBody({ label = '数据加载中...' }: PageLoadingBodyProps) {
  return (
    <div className="page-loading-body" role="status" aria-live="polite">
      <div className="page-loading-body-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
