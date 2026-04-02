export function normalizePagination({ limit, offset } = {}) {
  const lim = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const off = Number.isFinite(Number(offset)) ? Number(offset) : 0;

  return {
    limit: Math.max(1, Math.min(200, Math.trunc(lim))),
    offset: Math.max(0, Math.trunc(off))
  };
}
