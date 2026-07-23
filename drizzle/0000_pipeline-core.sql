CREATE TYPE "public"."outcome" AS ENUM('in_progress', 'rejected', 'withdrawn', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('applied', 'screening', 'assignment', 'interview', 'offer');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" text NOT NULL,
	"stage" "stage" DEFAULT 'applied' NOT NULL,
	"outcome" "outcome" DEFAULT 'in_progress' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_closed_iff_ended" CHECK (("applications"."outcome" = 'in_progress') = ("applications"."closed_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stage_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_stage" "stage",
	"to_stage" "stage" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stage_transitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_transitions" ADD CONSTRAINT "stage_transitions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_company_id_idx" ON "applications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stage_transitions_application_id_idx" ON "stage_transitions" USING btree ("application_id");