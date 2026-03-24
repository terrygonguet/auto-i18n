CREATE TABLE `translations` (
	`lang` text NOT NULL,
	`category` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`lang`, `category`, `key`)
);
