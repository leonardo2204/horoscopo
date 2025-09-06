CREATE TABLE `astronomical_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`sun_right_ascension` real,
	`sun_declination` real,
	`sun_constellation` text,
	`moon_phase` text,
	`api_source` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `astronomical_data_date_unique` ON `astronomical_data` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_astronomical_data_date` ON `astronomical_data` (`date`);--> statement-breakpoint
CREATE TABLE `horoscope_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name_pt` text NOT NULL,
	`icon` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `horoscope_categories_name_unique` ON `horoscope_categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_horoscope_categories_name` ON `horoscope_categories` (`name`);--> statement-breakpoint
CREATE TABLE `horoscope_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sign_id` integer NOT NULL,
	`type_id` integer NOT NULL,
	`effective_date` text NOT NULL,
	`preview_text` text NOT NULL,
	`full_text` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`sign_id`) REFERENCES `signs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`type_id`) REFERENCES `horoscope_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_horoscope_content_sign_id` ON `horoscope_content` (`sign_id`);--> statement-breakpoint
CREATE INDEX `idx_horoscope_content_type_id` ON `horoscope_content` (`type_id`);--> statement-breakpoint
CREATE INDEX `idx_horoscope_content_effective_date` ON `horoscope_content` (`effective_date`);--> statement-breakpoint
CREATE INDEX `idx_horoscope_content_is_active` ON `horoscope_content` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_horoscope_content_composite` ON `horoscope_content` (`sign_id`,`type_id`,`effective_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_sign_type_date` ON `horoscope_content` (`sign_id`,`type_id`,`effective_date`);--> statement-breakpoint
CREATE TABLE `horoscope_content_categories` (
	`horoscope_content_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`content_text` text NOT NULL,
	PRIMARY KEY(`horoscope_content_id`, `category_id`),
	FOREIGN KEY (`horoscope_content_id`) REFERENCES `horoscope_content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `horoscope_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_hcc_content_id` ON `horoscope_content_categories` (`horoscope_content_id`);--> statement-breakpoint
CREATE INDEX `idx_hcc_category_id` ON `horoscope_content_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `horoscope_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`display_name_pt` text NOT NULL,
	`cache_duration_hours` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `horoscope_types_type_unique` ON `horoscope_types` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_horoscope_types_type` ON `horoscope_types` (`type`);--> statement-breakpoint
CREATE TABLE `signs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_en` text NOT NULL,
	`name_pt` text NOT NULL,
	`emoji` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`element` text NOT NULL,
	`modality` text NOT NULL,
	`ruling_planet` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signs_name_en_unique` ON `signs` (`name_en`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_signs_name_en` ON `signs` (`name_en`);--> statement-breakpoint
CREATE INDEX `idx_signs_name_pt` ON `signs` (`name_pt`);