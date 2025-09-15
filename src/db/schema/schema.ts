import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './auth-schema';

// Signs table - master data for zodiac signs
export const signs = sqliteTable('signs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nameEn: text('name_en').notNull().unique(),
  namePt: text('name_pt').notNull(),
  emoji: text('emoji').notNull(),
  startDate: text('start_date').notNull(), // MM-DD format
  endDate: text('end_date').notNull(),     // MM-DD format
  element: text('element').notNull().$type<'fire' | 'earth' | 'air' | 'water'>(),
  modality: text('modality').notNull().$type<'cardinal' | 'fixed' | 'mutable'>(),
  rulingPlanet: text('ruling_planet').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('idx_signs_name_en').on(table.nameEn),
  index('idx_signs_name_pt').on(table.namePt),
]);

// Horoscope types lookup table (daily, weekly, monthly)
export const horoscopeTypes = sqliteTable('horoscope_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull().unique().$type<'daily' | 'weekly' | 'monthly'>(),
  displayNamePt: text('display_name_pt').notNull(),
  cacheDurationHours: integer('cache_duration_hours').notNull(),
}, (table) => [
  uniqueIndex('idx_horoscope_types_type').on(table.type),
]);

// Main horoscope content table
export const horoscopeContent = sqliteTable('horoscope_content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  signId: integer('sign_id').notNull().references(() => signs.id, { onDelete: 'cascade' }),
  typeId: integer('type_id').notNull().references(() => horoscopeTypes.id, { onDelete: 'cascade' }),
  effectiveDate: text('effective_date').notNull(), // YYYY-MM-DD format
  previewText: text('preview_text').notNull(),
  fullText: text('full_text').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_horoscope_content_sign_id').on(table.signId),
  index('idx_horoscope_content_type_id').on(table.typeId),
  index('idx_horoscope_content_effective_date').on(table.effectiveDate),
  index('idx_horoscope_content_is_active').on(table.isActive),
  index('idx_horoscope_content_composite').on(table.signId, table.typeId, table.effectiveDate),
  uniqueIndex('unique_sign_type_date').on(table.signId, table.typeId, table.effectiveDate),
]);

// Astronomical data table for API data storage
export const astronomicalData = sqliteTable('astronomical_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD format
  sunRightAscension: real('sun_right_ascension'),
  sunDeclination: real('sun_declination'),
  sunConstellation: text('sun_constellation'),
  moonPhase: text('moon_phase'),
  apiSource: text('api_source').notNull().$type<'astronomyapi' | 'fallback'>(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('idx_astronomical_data_date').on(table.date),
]);

// Horoscope categories (love, career, health, etc.)
export const horoscopeCategories = sqliteTable('horoscope_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  displayNamePt: text('display_name_pt').notNull(),
  icon: text('icon'),
}, (table) => [
  uniqueIndex('idx_horoscope_categories_name').on(table.name),
]);

// Many-to-many relationship between horoscope content and categories
export const horoscopeContentCategories = sqliteTable('horoscope_content_categories', {
  horoscopeContentId: integer('horoscope_content_id').notNull().references(() => horoscopeContent.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => horoscopeCategories.id, { onDelete: 'cascade' }),
  contentText: text('content_text').notNull(),
}, (table) => [
  primaryKey({ columns: [table.horoscopeContentId, table.categoryId] }),
  index('idx_hcc_content_id').on(table.horoscopeContentId),
  index('idx_hcc_category_id').on(table.categoryId),
]);

// Ratings for overall horoscope content
export const horoscopeRatings = sqliteTable('horoscope_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  horoscopeContentId: integer('horoscope_content_id').notNull().references(() => horoscopeContent.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_horoscope_ratings_content_id').on(table.horoscopeContentId),
  index('idx_horoscope_ratings_user_id').on(table.userId),
  uniqueIndex('unique_horoscope_rating_per_user').on(table.horoscopeContentId, table.userId),
]);

// Ratings for specific category content within horoscopes
export const horoscopeCategoryRatings = sqliteTable('horoscope_category_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  horoscopeContentId: integer('horoscope_content_id').notNull().references(() => horoscopeContent.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => horoscopeCategories.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index('idx_hcr_content_id').on(table.horoscopeContentId),
  index('idx_hcr_category_id').on(table.categoryId),
  index('idx_hcr_user_id').on(table.userId),
  uniqueIndex('unique_category_rating_per_user').on(table.horoscopeContentId, table.categoryId, table.userId),
  // Foreign key constraint to ensure the content-category combination exists
  index('idx_hcr_content_category').on(table.horoscopeContentId, table.categoryId),
]);

// Relations
export const signsRelations = relations(signs, ({ many }) => ({
  horoscopeContent: many(horoscopeContent),
}));

export const horoscopeTypesRelations = relations(horoscopeTypes, ({ many }) => ({
  horoscopeContent: many(horoscopeContent),
}));

export const horoscopeContentRelations = relations(horoscopeContent, ({ one, many }) => ({
  sign: one(signs, {
    fields: [horoscopeContent.signId],
    references: [signs.id],
  }),
  type: one(horoscopeTypes, {
    fields: [horoscopeContent.typeId],
    references: [horoscopeTypes.id],
  }),
  categories: many(horoscopeContentCategories),
  ratings: many(horoscopeRatings),
  categoryRatings: many(horoscopeCategoryRatings),
}));

export const horoscopeCategoriesRelations = relations(horoscopeCategories, ({ many }) => ({
  horoscopeContent: many(horoscopeContentCategories),
}));

export const horoscopeContentCategoriesRelations = relations(horoscopeContentCategories, ({ one }) => ({
  horoscopeContent: one(horoscopeContent, {
    fields: [horoscopeContentCategories.horoscopeContentId],
    references: [horoscopeContent.id],
  }),
  category: one(horoscopeCategories, {
    fields: [horoscopeContentCategories.categoryId],
    references: [horoscopeCategories.id],
  }),
}));

export const horoscopeRatingsRelations = relations(horoscopeRatings, ({ one }) => ({
  horoscopeContent: one(horoscopeContent, {
    fields: [horoscopeRatings.horoscopeContentId],
    references: [horoscopeContent.id],
  }),
  user: one(user, {
    fields: [horoscopeRatings.userId],
    references: [user.id],
  }),
}));

export const horoscopeCategoryRatingsRelations = relations(horoscopeCategoryRatings, ({ one }) => ({
  horoscopeContent: one(horoscopeContent, {
    fields: [horoscopeCategoryRatings.horoscopeContentId],
    references: [horoscopeContent.id],
  }),
  category: one(horoscopeCategories, {
    fields: [horoscopeCategoryRatings.categoryId],
    references: [horoscopeCategories.id],
  }),
  user: one(user, {
    fields: [horoscopeCategoryRatings.userId],
    references: [user.id],
  }),
}));

export type Signs = typeof signs.$inferSelect;
export type HoroscopeTypes = typeof horoscopeTypes.$inferSelect;
export type HoroscopeContent = typeof horoscopeContent.$inferSelect;
export type AstronomicalData = typeof astronomicalData.$inferSelect;
export type HoroscopeCategories = typeof horoscopeCategories.$inferSelect;
export type HoroscopeContentCategories = typeof horoscopeContentCategories.$inferSelect;
export type HoroscopeRatings = typeof horoscopeRatings.$inferSelect;
export type HoroscopeCategoryRatings = typeof horoscopeCategoryRatings.$inferSelect;