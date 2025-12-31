# TPMJS Feature Roadmap

## User System & Social Features

### 1. User Authentication System
- [ ] Add authentication (OAuth with GitHub/Google)
- [ ] User profile pages (`/user/[username]`)
- [ ] Store user preferences and settings
- [ ] API key management for programmatic access

### 2. User Collections
- [ ] Create named collections of tools (e.g., "My AI Agents", "Data Processing")
- [ ] Public/private collection visibility
- [ ] Share collections via URL
- [ ] Fork/clone collections from other users
- [ ] Collection descriptions and tags

**Database Schema:**
```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  name        String?
  avatarUrl   String?
  collections Collection[]
  ratings     Rating[]
  createdAt   DateTime     @default(now())
}

model Collection {
  id          String           @id @default(cuid())
  name        String
  description String?
  isPublic    Boolean          @default(false)
  userId      String
  user        User             @relation(fields: [userId], references: [id])
  tools       CollectionTool[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model CollectionTool {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id])
  toolId       String
  tool         Tool       @relation(fields: [toolId], references: [id])
  addedAt      DateTime   @default(now())
  notes        String?    // User's notes about why this tool is in the collection

  @@unique([collectionId, toolId])
}
```

### 3. Package Ratings & Reviews
- [ ] 1-5 star rating system
- [ ] Optional text reviews
- [ ] Aggregate rating displayed on tool cards
- [ ] Sort/filter by rating
- [ ] Prevent duplicate ratings (one per user per tool)
- [ ] Verified usage badge (user has actually executed the tool)

**Database Schema:**
```prisma
model Rating {
  id        String   @id @default(cuid())
  score     Int      // 1-5
  review    String?  @db.Text
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  toolId    String
  tool      Tool     @relation(fields: [toolId], references: [id])
  verified  Boolean  @default(false) // True if user has executed the tool
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, toolId])
}
```

### 4. Integrate Collections with SDK Tools

**@tpmjs/search-registry:**
- [ ] Add `collection` parameter to filter tools by collection ID
- [ ] Add `collectionName` parameter to filter by collection name
- [ ] Return collection metadata in search results
- [ ] Support searching within user's own collections

**@tpmjs/registry-execute:**
- [ ] Accept collection ID to scope tool execution
- [ ] Log which collection a tool was executed from (for analytics)
- [ ] Support executing all tools in a collection sequentially

**API Endpoints:**
```
GET  /api/collections                    - List public collections
GET  /api/collections/[id]               - Get collection details
POST /api/collections                    - Create collection (auth required)
PUT  /api/collections/[id]               - Update collection (auth required)
DELETE /api/collections/[id]             - Delete collection (auth required)
POST /api/collections/[id]/tools         - Add tool to collection
DELETE /api/collections/[id]/tools/[toolId] - Remove tool from collection

GET  /api/tools?collection=[id]          - Filter tools by collection
GET  /api/users/[username]/collections   - Get user's public collections
```

---

## Implementation Order

1. **Phase 1: User System** (required for everything else)
   - Authentication with NextAuth.js
   - User model and basic profile

2. **Phase 2: Collections**
   - Collection CRUD
   - Add/remove tools from collections
   - Collection pages

3. **Phase 3: Ratings**
   - Rating submission
   - Display ratings on tool cards
   - Sort by rating

4. **Phase 4: SDK Integration**
   - Update @tpmjs/search-registry
   - Update @tpmjs/registry-execute
   - Collection-aware execution

---

## Benchmark Comparison Page

### Overview
- [ ] Create `/benchmarks` page to compare tool performance
- [ ] Display execution time comparisons across similar tools
- [ ] Show token usage efficiency metrics
- [ ] Compare success rates and reliability

### Features
- [ ] Side-by-side tool comparison UI
- [ ] Historical performance trends (charts)
- [ ] Filter by category to compare relevant tools
- [ ] Export benchmark data as JSON/CSV

### Data Collection
- [ ] Track execution metrics from playground simulations
- [ ] Aggregate anonymous performance data
- [ ] Calculate percentile rankings within categories

---

## Notes

- Consider rate limiting on ratings to prevent abuse
- Collections could have a "featured" flag for editorial picks
- Future: collaborative collections (multiple editors)
- Future: collection analytics (views, forks, tool executions)
