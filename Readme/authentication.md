# 🔒 Authentication & Security

This document covers how user authentication is handled in Blastoise. Security and session management are extremely common interview topics.

## 🛠️ The Tech Stack
- **Method:** JSON Web Tokens (JWT)
- **Storage:** Frontend LocalStorage / React Context
- **Passwords:** Hashed using `bcrypt`

## 🔄 The Authentication Flow

### 1. Registration
When a user signs up:
1. The frontend sends the `email`, `username`, and `password` to the backend.
2. The backend uses `bcrypt` to generate a salt and hash the password. **We never store plaintext passwords in the database.**
3. The new user is saved to the `User` table.
4. A JWT is generated and sent back to the client.

### 2. Login & Token Generation
When a user logs in:
1. The backend finds the user by email.
2. It uses `bcrypt.compare()` to check if the provided password matches the stored hash.
3. If successful, it creates a JWT. The JWT payload typically contains the `userId` and `username`.
4. The token is signed using a secret key (`JWT_SECRET` in `.env`).

### 3. Making Authenticated Requests
- The frontend stores the token (usually in `localStorage`).
- For any protected route (like adding a movie to a collection), the frontend attaches the token to the HTTP header:
  `Authorization: Bearer <token>`
- The backend has an `authMiddleware.js` function. It intercepts the request, verifies the token's signature using the secret key, and extracts the `userId`.
- It then attaches the user object to the request (`req.user = user`) and calls `next()`, allowing the controller to proceed.

## 💡 Interview Questions & Talking Points

**Q: Why use JWTs instead of traditional session cookies?**
**A:** JWTs are stateless. The backend doesn't need to store a session ID in the database or Redis memory. To verify a user, it just cryptographically verifies the token signature. This makes the backend highly scalable, as any server instance can verify the token without looking up session state.

**Q: What is a security risk of storing JWTs in `localStorage`?**
**A:** Cross-Site Scripting (XSS). If an attacker injects malicious JavaScript into the app, they can read `localStorage` and steal the token. 
*(Note: A more secure, enterprise-level alternative is storing the token in an `httpOnly` cookie, which JavaScript cannot read, preventing XSS theft. For an MVP like Blastoise, `localStorage` is standard practice).*
