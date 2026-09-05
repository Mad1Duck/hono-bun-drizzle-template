CREATE TABLE "idempotency_keys" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"topic" varchar(255) NOT NULL,
	"value" text,
	"processed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
