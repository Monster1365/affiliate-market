CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."product_source" AS ENUM('api', 'manual');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "banners_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(100) NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(50) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "click_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "click_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"referer" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(300) NOT NULL,
	"image_url" text NOT NULL,
	"price" integer NOT NULL,
	"original_price" integer,
	"discount_rate" integer,
	"is_rocket" boolean DEFAULT false NOT NULL,
	"affiliate_url" text NOT NULL,
	"coupang_product_id" varchar(40),
	"category_id" integer,
	"source" "product_source" DEFAULT 'manual' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_coupang_product_id_unique" UNIQUE("coupang_product_id")
);
--> statement-breakpoint
ALTER TABLE "click_logs" ADD CONSTRAINT "click_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_lower_idx" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "click_logs_product_clicked_idx" ON "click_logs" USING btree ("product_id","clicked_at");--> statement-breakpoint
CREATE INDEX "click_logs_clicked_idx" ON "click_logs" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "products_category_visible_idx" ON "products" USING btree ("category_id","is_visible");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured") WHERE "products"."is_featured" = true;--> statement-breakpoint
CREATE INDEX "products_title_trgm_idx" ON "products" USING gin ("title" gin_trgm_ops);