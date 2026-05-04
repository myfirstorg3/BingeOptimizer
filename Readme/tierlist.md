# 🏆 Tier Lists

The Tier List feature allows users to rank movies and TV shows from their collections into highly visual, customizable tiers (S, A, B, C, D).

## 🛠️ How it Works

### Database Structure
The feature relies on two main tables:
1. `TierList`: Represents the list itself (e.g., "My Favorite Sci-Fi Movies"). It belongs to a `User` and optionally links to a base `Collection`.
2. `TierListItem`: The join table. It connects a `TierList` to a `Media` item. 
   - Crucially, it stores two extra fields: `tier` (String, e.g., "S", "A") and `position` (Integer, tracking the order within that tier).

### The UI / Drag & Drop
The frontend utilizes a Drag and Drop interface (typically implemented via libraries like `react-beautiful-dnd` or `@hello-pangea/dnd`, or custom mouse-event logic).

When a user drags a movie from the "Unranked" pool into the "S Tier":
1. **Optimistic UI Update:** React immediately updates the local state, moving the image to the new tier so the application feels instant.
2. **API Call:** A `PATCH` request is sent to the backend with the `mediaId` and the new `tier`.
3. **Database Update:** The backend updates the `TierListItem` row with the new tier string.

## 💡 Interview Talking Points

- **Managing State:** Discuss how complex state is managed in React. You have an array of tiers, and each tier contains an array of items. Dragging an item involves removing it from the source array and inserting it into the destination array at the specific index.
- **Position Tracking:** Ask the interviewer how they would handle ordering. If a user rearranges items within the "S Tier", we update the `position` integer in the database. When fetching the tier list, the backend sorts the `TierListItem` array by `position ASC` before sending it to the frontend.
- **Visuals:** The tier lists use a distinct, vibrant color mapping (S: Red/Pink, A: Orange, B: Yellow, C: Green, D: Purple) to create a premium, gamified aesthetic.
