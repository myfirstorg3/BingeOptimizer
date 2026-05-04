# 🏆 Tier Lists Documentation

The Tier List feature allows users to rank media into highly visual, customizable tiers. This document covers the exact backend structure and state management logic used to handle drag-and-drop sorting.

## 🛠️ Database Implementation (`tierListController.js`)

Tier Lists rely on two Prisma models: `TierList` and `TierListItem`.

### 1. Initialization (Seeding from a Collection)
When a user creates a new Tier List and selects an existing Collection as the base, the `POST /api/tierlists` endpoint seeds the database:
- It fetches all `mediaId`s from the chosen `CollectionItem` table.
- It bulk-inserts them into `TierListItem` with `tier: 'unranked'` and `position: idx`.

### 2. Saving State (The Bulk Replace Strategy)
Handling drag-and-drop updates row-by-row can lead to complex race conditions and position tracking bugs (e.g., swapping item A at position 2 with item B at position 3). 

Instead, Blastoise uses a **Bulk Replace Strategy** in the `saveTierItems` endpoint (`POST /api/tierlists/:id/items`):

```javascript
// Step 1: Nuke the current state for this Tier List
await prisma.tierListItem.deleteMany({ where: { tierListId: tlId } });

// Step 2: Re-insert the exact new state sent from the React frontend
await prisma.tierListItem.createMany({
  data: items.map((item, idx) => ({
    tierListId: tlId,
    mediaId: item.mediaId,
    tier: item.tier || 'unranked',
    position: item.position ?? idx // Exact array index becomes the new DB position
  }))
});
```
**Why this works:** It offloads the complex sorting logic entirely to the React frontend. The backend acts as a dumb data store that simply persists whatever the frontend says is the current state.

## 🖱️ Frontend State Management

While dragging and dropping, the React frontend maintains the source of truth using a dictionary mapping tiers to arrays of media items.

### The Flow:
1. **Initial Load:** 
   The frontend hits `GET /api/tierlists/:id`. The backend sorts the items via Prisma (`orderBy: { position: 'asc' }`) before returning them.
2. **Dragging:**
   When an item is dragged from `unranked` to `S Tier`:
   - React immediately splices the item out of the `unranked` array and into the `S` array at the dropped index.
   - The UI updates instantly (Optimistic UI).
3. **Saving:**
   When the user clicks "Save", the frontend flattens the dictionary into a single array, iterating through each tier's array and appending a `tier` and `position` property to each item. This array is sent in the payload to `saveTierItems`.

## 💡 Interview Talking Points
- **Bulk Replace vs. Individual Row Updates:** Be prepared to defend the bulk replace strategy. While it seems destructive to delete and recreate rows, it is atomic (if wrapped in a transaction) and drastically simpler than managing linked lists or fractional indexing for sorting. For lists with <500 items, `deleteMany` + `createMany` is extremely fast in SQLite/Postgres.
