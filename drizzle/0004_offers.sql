CREATE TYPE "public"."contract_type" AS ENUM('permanent', 'contract', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('office', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"annual_salary" integer,
	"contract_type" "contract_type",
	"work_mode" "work_mode",
	"crunch" boolean,
	"extras" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;