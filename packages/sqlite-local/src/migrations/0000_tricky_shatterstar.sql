CREATE TABLE `ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`from_pub_key` text NOT NULL,
	`to_pub_key` text NOT NULL,
	`amount` integer NOT NULL,
	`prev_tx_hash` text,
	`sequence_number` integer NOT NULL,
	`signature` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
