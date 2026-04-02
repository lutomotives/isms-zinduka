export const SyncEntities = /** @type {const} */ ([
  'users',
  'students',
  'attendance',
  'grades',
  'payments',
  'announcements'
]);

export function isValidEntity(entity) {
  return SyncEntities.includes(entity);
}

/**
 * A lightweight sync envelope.
 * - pull: client asks for all rows updated after `since`
 * - push: client submits locally-mutated rows (already have updated_at set)
 */
export const SyncProtocolVersion = 1;

