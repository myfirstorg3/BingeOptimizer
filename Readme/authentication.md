# 🔒 Authentication & Security Documentation

This document covers the exact implementation details of how user authentication is handled in Blastoise.

## 🛠️ The Implementation Flow

### 1. Token Generation (Login/Signup)
When a user logs in, the backend uses `bcrypt.compare()` to verify the hashed password. If successful, it generates a JWT containing the user's `id`.

```javascript
// Example from authController.js
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
```

### 2. The Middleware (`authMiddleware.js`)
Blastoise uses custom Express middleware to protect routes. When the frontend makes an authenticated request, it must include the token in the headers:
`Authorization: Bearer <token>`

The backend exposes two middleware functions:

#### A. Strict Protection (`protect`)
Used for routes that require a logged-in user (e.g., `POST /api/collections`).
```javascript
export const protect = async (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // 1. Extract token
      const token = req.headers.authorization.split(' ')[1];
      
      // 2. Cryptographically verify signature using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Look up user by the decoded ID and attach to the request object
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true } // Exclude passwordHash!
      });

      next(); // Proceed to controller
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
```

#### B. Optional Protection (`optionalProtect`)
Used for routes that change behavior based on login status (e.g., fetching a public profile, which might show extra details if the requesting user is logged in).
It follows the same extraction logic, but if the token is missing or invalid, it simply runs `next()` without setting `req.user`, and does *not* throw a 401 Error.

## 💡 Interview Questions & Talking Points

**Q: Why use JWTs instead of traditional session cookies?**
**A:** JWTs are stateless. The backend doesn't need to query a Redis session store to verify a user. It just performs a fast cryptographic signature check (`jwt.verify()`). This makes horizontal scaling much easier, as any server instance can verify the token.

**Q: In your middleware, you query the database `prisma.user.findUnique` after verifying the JWT. Isn't the point of JWT to avoid database lookups?**
**A:** Yes, strictly speaking, a pure stateless JWT shouldn't require a DB lookup. However, doing a lookup ensures the user still exists in the database (e.g., they haven't been banned or deleted since the token was issued). It's a calculated trade-off between strict statelessness and security/data freshness. We mitigate the performance hit by using Prisma's `select` to only fetch the `id`, `username`, and `email`, avoiding the massive `User` payload.
