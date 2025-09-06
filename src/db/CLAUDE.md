# Database Schema Reference for Claude

**Memory**: Always check this file before doing any database-related work in the horoscope system.

## Database Overview
- **Type**: SQLite with LibSQL client
- **ORM**: Drizzle ORM
- **File**: `horoscopo.db`
- **Connection**: `DATABASE_URL=file:./horoscopo.db`

## Schema Tables

### 1. `signs` (Master Data - 12 records)
```typescript
{
  id: number (PK, auto-increment)
  nameEn: string (unique) // "Aries", "Taurus", etc.
  namePt: string // "Áries", "Touro", etc.
  emoji: string // "♈", "♉", etc.
  startDate: string // "03-21" (MM-DD)
  endDate: string // "04-19" (MM-DD)
  element: 'fire' | 'earth' | 'air' | 'water'
  modality: 'cardinal' | 'fixed' | 'mutable'
  rulingPlanet: string
  createdAt: string (datetime)
  updatedAt: string (datetime)
}
```
**Indexes**: nameEn (unique), namePt

### 2. `horoscopeTypes` (Lookup - 3 records)
```typescript
{
  id: number (PK, auto-increment)
  type: 'daily' | 'weekly' | 'monthly' (unique)
  displayNamePt: string // "Diário", "Semanal", "Mensal"
  cacheDurationHours: number // 2, 168, 720
}
```
**Indexes**: type (unique)

### 3. `horoscopeContent` (Main Content Table)
```typescript
{
  id: number (PK, auto-increment)
  signId: number (FK → signs.id, CASCADE)
  typeId: number (FK → horoscopeTypes.id, CASCADE)
  effectiveDate: string // "YYYY-MM-DD"
  previewText: string
  fullText: string
  isActive: boolean (default: true)
  createdAt: string (datetime)
  updatedAt: string (datetime)
}
```
**Indexes**: signId, typeId, effectiveDate, isActive, composite(signId, typeId, effectiveDate)  
**Unique**: (signId, typeId, effectiveDate)

### 4. `astronomicalData` (Optional Enhancement)
```typescript
{
  id: number (PK, auto-increment)
  date: string (unique) // "YYYY-MM-DD"
  sunRightAscension: number (nullable)
  sunDeclination: number (nullable)
  sunConstellation: string (nullable)
  moonPhase: string (nullable)
  apiSource: 'astronomyapi' | 'fallback'
  createdAt: string (datetime)
}
```
**Indexes**: date (unique)

### 5. `horoscopeCategories` (Content Categories - 8 records)
```typescript
{
  id: number (PK, auto-increment)
  name: string (unique) // "love", "career", "health", etc.
  displayNamePt: string // "Amor", "Carreira", "Saúde", etc.
  icon: string (nullable) // "💕", "💼", "💚", etc.
}
```
**Indexes**: name (unique)

### 6. `horoscopeContentCategories` (Many-to-Many)
```typescript
{
  horoscopeContentId: number (FK → horoscopeContent.id, CASCADE)
  categoryId: number (FK → horoscopeCategories.id, CASCADE)
  contentText: string
}
```
**Primary Key**: (horoscopeContentId, categoryId)  
**Indexes**: horoscopeContentId, categoryId

## Seeded Reference Data

### Signs (12 records)
- Áries ♈, Touro ♉, Gêmeos ♊, Câncer ♋, Leão ♌, Virgem ♍
- Libra ♎, Escorpião ♏, Sagitário ♐, Capricórnio ♑, Aquário ♒, Peixes ♓

### Horoscope Types (3 records)
- daily (Diário) - 2h cache
- weekly (Semanal) - 168h cache  
- monthly (Mensal) - 720h cache

### Categories (8 records)
- love (Amor) 💕, career (Carreira) 💼, health (Saúde) 💚, finance (Finanças) 💰
- general (Geral) ✨, family (Família) 👨‍👩‍👧‍👦, friendship (Amizade) 🤝, creativity (Criatividade) 🎨

## Important Notes

1. **Migrations**: Always use `drizzle-kit` for schema changes
2. **Foreign Keys**: All FKs have CASCADE delete actions
3. **Indexing**: Comprehensive indexes for performance
4. **Timestamps**: Use SQLite's `datetime('now')` function
5. **Type Safety**: Full TypeScript support via Drizzle
6. **Normalization**: Schema follows 3NF principles

## Common Queries

```typescript
// Get sign by Portuguese name
const sign = await db.select().from(signs).where(eq(signs.namePt, 'Áries'));

// Get today's horoscope for a sign
const horoscope = await db.select()
  .from(horoscopeContent)
  .where(
    and(
      eq(horoscopeContent.signId, signId),
      eq(horoscopeContent.typeId, dailyTypeId),
      eq(horoscopeContent.effectiveDate, today)
    )
  );

// Get horoscope with categories
const horoscopeWithCategories = await db.select()
  .from(horoscopeContent)
  .leftJoin(horoscopeContentCategories, eq(horoscopeContent.id, horoscopeContentCategories.horoscopeContentId))
  .leftJoin(horoscopeCategories, eq(horoscopeContentCategories.categoryId, horoscopeCategories.id));
```