export function rbacAllowed(allowedRoles = []) {
  const set = new Set(allowedRoles);
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: 'UNAUTHORIZED' });
    if (!set.has(role)) return res.status(403).json({ error: 'FORBIDDEN' });
    return next();
  };
}

