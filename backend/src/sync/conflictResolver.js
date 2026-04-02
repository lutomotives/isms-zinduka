export function resolveLww({ serverRow, clientRow }) {
  const s = serverRow?.updated_at ?? null;
  const c = clientRow?.updated_at ?? null;
  if (!s && c) return { action: 'apply_client' };
  if (s && !c) return { action: 'keep_server' };
  if (s === c) return { action: 'keep_server' };
  if (c > s) return { action: 'apply_client' }; // ISO strings compare lexicographically
  return { action: 'keep_server' };
}

