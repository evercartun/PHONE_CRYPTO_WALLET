/**
 * middleware/auth.js
 *
 * Simulated JWT authentication middleware.
 * In production: use jsonwebtoken + a real user DB.
 *
 * For this demo, any request with header:
 *   Authorization: Bearer demo-token-<userId>
 * is accepted.
 *
 * If no token is provided, a default demo user is used.
 */

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token      = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    /* Default demo user — remove in production */
    req.userId = "demo-user-1";
    return next();
  }

  /* In production, verify JWT here:
   *   const payload = jwt.verify(token, process.env.JWT_SECRET);
   *   req.userId    = payload.sub;
   */

  if (token.startsWith("demo-token-")) {
    req.userId = token.replace("demo-token-", "user-");
    return next();
  }

  return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
}

module.exports = authMiddleware;
