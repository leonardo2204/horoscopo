CREATE TABLE `horoscope_category_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`horoscope_content_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`horoscope_content_id`) REFERENCES `horoscope_content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `horoscope_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_hcr_content_id` ON `horoscope_category_ratings` (`horoscope_content_id`);--> statement-breakpoint
CREATE INDEX `idx_hcr_category_id` ON `horoscope_category_ratings` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_hcr_user_id` ON `horoscope_category_ratings` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_category_rating_per_user` ON `horoscope_category_ratings` (`horoscope_content_id`,`category_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_hcr_content_category` ON `horoscope_category_ratings` (`horoscope_content_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `horoscope_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`horoscope_content_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`horoscope_content_id`) REFERENCES `horoscope_content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_horoscope_ratings_content_id` ON `horoscope_ratings` (`horoscope_content_id`);--> statement-breakpoint
CREATE INDEX `idx_horoscope_ratings_user_id` ON `horoscope_ratings` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_horoscope_rating_per_user` ON `horoscope_ratings` (`horoscope_content_id`,`user_id`);