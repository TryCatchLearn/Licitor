PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`condition` text NOT NULL,
	`reserve_price` integer,
	`starting_bid` integer,
	`current_bid` integer,
	`bid_count` integer DEFAULT 0 NOT NULL,
	`start_at` integer,
	`end_at` integer,
	`status` text DEFAULT 'Draft' NOT NULL,
	`location` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`seller_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_listings` (
	`id`,
	`seller_id`,
	`title`,
	`description`,
	`category`,
	`condition`,
	`reserve_price`,
	`starting_bid`,
	`current_bid`,
	`bid_count`,
	`start_at`,
	`end_at`,
	`status`,
	`location`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`seller_id`,
	`title`,
	`description`,
	`category`,
	`condition`,
	`reserve_price`,
	`starting_bid`,
	`current_bid`,
	`bid_count`,
	`start_at`,
	`end_at`,
	`status`,
	`location`,
	`created_at`,
	`updated_at`
FROM `listings`;
--> statement-breakpoint
DROP TABLE `listings`;
--> statement-breakpoint
ALTER TABLE `__new_listings` RENAME TO `listings`;
--> statement-breakpoint
CREATE INDEX `listings_seller_id_idx` ON `listings` (`seller_id`);
--> statement-breakpoint
CREATE INDEX `listings_status_idx` ON `listings` (`status`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
