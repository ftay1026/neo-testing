create table "public"."prompt_comparisons" (
    "id" uuid not null default uuid_generate_v4(),
    "prompt_a_id" uuid not null,
    "prompt_b_id" uuid not null,
    "model_a" text not null,
    "model_b" text not null,
    "temperature" numeric not null,
    "max_tokens" integer not null,
    "user_prompt" text not null,
    "response_a" text not null,
    "response_b" text not null,
    "vote_result" text,
    "notes" text,
    "user_id" uuid not null default auth.uid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."prompt_comparisons" enable row level security;

create table "public"."prompts" (
    "id" uuid not null default uuid_generate_v4(),
    "type" text not null default 'system'::text,
    "name" text not null default (now())::text,
    "prompt" text not null,
    "user_id" uuid not null default auth.uid(),
    "used" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."prompts" enable row level security;

CREATE UNIQUE INDEX prompt_comparisons_pkey ON public.prompt_comparisons USING btree (id);

CREATE INDEX prompt_comparisons_user_id_idx ON public.prompt_comparisons USING btree (user_id);

CREATE UNIQUE INDEX prompts_pkey ON public.prompts USING btree (id);

CREATE INDEX prompts_type_used_idx ON public.prompts USING btree (type, used);

CREATE INDEX prompts_user_id_idx ON public.prompts USING btree (user_id);

alter table "public"."prompt_comparisons" add constraint "prompt_comparisons_pkey" PRIMARY KEY using index "prompt_comparisons_pkey";

alter table "public"."prompts" add constraint "prompts_pkey" PRIMARY KEY using index "prompts_pkey";

alter table "public"."prompt_comparisons" add constraint "prompt_comparisons_prompt_a_id_fkey" FOREIGN KEY (prompt_a_id) REFERENCES prompts(id) ON DELETE CASCADE not valid;

alter table "public"."prompt_comparisons" validate constraint "prompt_comparisons_prompt_a_id_fkey";

alter table "public"."prompt_comparisons" add constraint "prompt_comparisons_prompt_b_id_fkey" FOREIGN KEY (prompt_b_id) REFERENCES prompts(id) ON DELETE CASCADE not valid;

alter table "public"."prompt_comparisons" validate constraint "prompt_comparisons_prompt_b_id_fkey";

alter table "public"."prompt_comparisons" add constraint "prompt_comparisons_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."prompt_comparisons" validate constraint "prompt_comparisons_user_id_fkey";

alter table "public"."prompt_comparisons" add constraint "prompt_comparisons_vote_result_check" CHECK ((vote_result = ANY (ARRAY['a'::text, 'b'::text, 'tie'::text]))) not valid;

alter table "public"."prompt_comparisons" validate constraint "prompt_comparisons_vote_result_check";

alter table "public"."prompts" add constraint "prompts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."prompts" validate constraint "prompts_user_id_fkey";

grant delete on table "public"."prompt_comparisons" to "anon";

grant insert on table "public"."prompt_comparisons" to "anon";

grant references on table "public"."prompt_comparisons" to "anon";

grant select on table "public"."prompt_comparisons" to "anon";

grant trigger on table "public"."prompt_comparisons" to "anon";

grant truncate on table "public"."prompt_comparisons" to "anon";

grant update on table "public"."prompt_comparisons" to "anon";

grant delete on table "public"."prompt_comparisons" to "authenticated";

grant insert on table "public"."prompt_comparisons" to "authenticated";

grant references on table "public"."prompt_comparisons" to "authenticated";

grant select on table "public"."prompt_comparisons" to "authenticated";

grant trigger on table "public"."prompt_comparisons" to "authenticated";

grant truncate on table "public"."prompt_comparisons" to "authenticated";

grant update on table "public"."prompt_comparisons" to "authenticated";

grant delete on table "public"."prompt_comparisons" to "service_role";

grant insert on table "public"."prompt_comparisons" to "service_role";

grant references on table "public"."prompt_comparisons" to "service_role";

grant select on table "public"."prompt_comparisons" to "service_role";

grant trigger on table "public"."prompt_comparisons" to "service_role";

grant truncate on table "public"."prompt_comparisons" to "service_role";

grant update on table "public"."prompt_comparisons" to "service_role";

grant delete on table "public"."prompts" to "anon";

grant insert on table "public"."prompts" to "anon";

grant references on table "public"."prompts" to "anon";

grant select on table "public"."prompts" to "anon";

grant trigger on table "public"."prompts" to "anon";

grant truncate on table "public"."prompts" to "anon";

grant update on table "public"."prompts" to "anon";

grant delete on table "public"."prompts" to "authenticated";

grant insert on table "public"."prompts" to "authenticated";

grant references on table "public"."prompts" to "authenticated";

grant select on table "public"."prompts" to "authenticated";

grant trigger on table "public"."prompts" to "authenticated";

grant truncate on table "public"."prompts" to "authenticated";

grant update on table "public"."prompts" to "authenticated";

grant delete on table "public"."prompts" to "service_role";

grant insert on table "public"."prompts" to "service_role";

grant references on table "public"."prompts" to "service_role";

grant select on table "public"."prompts" to "service_role";

grant trigger on table "public"."prompts" to "service_role";

grant truncate on table "public"."prompts" to "service_role";

grant update on table "public"."prompts" to "service_role";

create policy "Users can insert their own comparisons"
on "public"."prompt_comparisons"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can view their own comparisons"
on "public"."prompt_comparisons"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own prompts"
on "public"."prompts"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own prompts"
on "public"."prompts"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own prompts"
on "public"."prompts"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own prompts"
on "public"."prompts"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));



