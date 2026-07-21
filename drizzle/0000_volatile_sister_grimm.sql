CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`todo_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`priority` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
