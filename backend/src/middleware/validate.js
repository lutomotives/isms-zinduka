export function validateBody(zodSchema) {
  return (req, res, next) => {
    const parsed = zodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message
        }))
      });
    }
    req.body = parsed.data;
    return next();
  };
}

