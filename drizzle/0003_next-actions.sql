CREATE TYPE "public"."next_action_kind" AS ENUM('interview', 'assignment_due', 'follow_up', 'other');--> statement-breakpoint
CREATE TABLE "next_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"title" text NOT NULL,
	"kind" "next_action_kind" DEFAULT 'other' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "next_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "next_actions" ADD CONSTRAINT "next_actions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "next_actions_application_id_idx" ON "next_actions" USING btree ("application_id");