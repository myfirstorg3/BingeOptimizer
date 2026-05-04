# 🗄️ Database Architecture & Normalization

This document explains the database structure of Blastoise, how it is managed, and the normalization principles applied. This is perfect for explaining the backend architecture in an interview.

## 🛠️ Technology Stack
- **Database Engine:** SQLite (Local file-based SQL database, located at `backend/prisma/dev.db`)
- **ORM (Object-Relational Mapper):** Prisma. We define our schema in `prisma/schema.prisma` and Prisma handles migrations and generates the JavaScript client to interact with the database securely.

## 🧩 Core Tables & Relationships

1. **User Management:**
   - `User`: Stores core identity (username, email, password hash).
   - `UserPreference`: 1-to-1 relationship with `User` for settings.
   - `UserFriendship`: Self-referential Many-to-Many table linking Users to other Users.

2. **Media Content:**
   - `Media`: The central source of truth for movies/shows. Cached from OMDB API.
   - `Genre`: Lookup table for categories.
   - `AIReviewSummary`: 1-to-1 with `Media`, stores the Gemini-generated review.

3. **User-Media Interactions (Join Tables):**
   - `UserMediaStatus`: Maps `User` to `Media` (Many-to-Many). Tracks if a user is "watching", "completed", or "unwatched", and their personal rating.
   - `Collection` & `CollectionItem`: A `User` has Many `Collections`. A `Collection` has Many `Media` via the `CollectionItem` join table.
   - `TierList` & `TierListItem`: Similar to collections, but tracks the specific `tier` (S, A, B, C) and `position`.

---

## 📐 Normalization Principles Applied

The database follows standard relational database normalization to reduce redundancy and ensure data integrity.

### First Normal Form (1NF) - Atomic Values
*Rule: Each column must contain atomic (indivisible) values, and each record needs a unique identifier.*
- **How we do it:** Every table in Blastoise uses a `String @id @default(uuid())` as a Primary Key. 
- **The Trade-off (Denormalization for Performance):** In the `Media` table, the `description` column stores a stringified JSON object containing rich metadata (actors, awards, box office). Strictly speaking, JSON columns violate 1NF. However, we do this deliberately as a **caching strategy** because we rarely need to query or filter by "Box Office"; we just need to display it on the frontend. Creating separate tables for Actors and Awards would require expensive SQL JOINs for data we only ever display as text.

### Second Normal Form (2NF) - No Partial Dependencies
*Rule: Must be in 1NF, and all non-key attributes must depend on the ENTIRE primary key.*
- **How we do it:** We use single-column UUID primary keys everywhere, making partial dependencies impossible on the primary key. For our composite unique constraints (e.g., `@@unique([userId, mediaId])` in `UserMediaStatus`), the `watchStatus` depends on *both* the user and the media, not just one.

### Third Normal Form (3NF) - No Transitive Dependencies
*Rule: Must be in 2NF, and non-key attributes must not depend on other non-key attributes.*
- **How we do it:** Information about a Movie (e.g., `posterUrl`, `releaseDate`) is stored strictly in the `Media` table. When a user adds a movie to a Collection, the `CollectionItem` table only stores the `mediaId`. It does *not* duplicate the movie title or poster. If a movie's poster URL changes in the `Media` table, it instantly updates across all user collections and tier lists, preventing update anomalies.

## 🖼️ Where are Images Stored?
- **Media Posters & Backdrops:** We **do not** store image files for movies in the database. The `posterUrl` in the `Media` table simply stores a text URL pointing to an external CDN (like Amazon or OMDB servers).
- **User Avatars:** In the `UserAvatar` table, we store profile pictures as raw `Bytes` (BLOBs) directly in the database. In a massive enterprise system, this would typically be moved to an AWS S3 bucket, but storing as Bytes is perfectly fine for an MVP/local application.
