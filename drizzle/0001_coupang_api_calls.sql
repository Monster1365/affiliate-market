CREATE TABLE "coupang_api_calls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coupang_api_calls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"endpoint" varchar(40) NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL,
	"success" boolean NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE INDEX "coupang_api_calls_called_idx" ON "coupang_api_calls" USING btree ("called_at");