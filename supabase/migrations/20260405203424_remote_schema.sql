drop extension if exists "pg_net";


  create table "public"."digimon" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "species_id" text not null,
    "name" text not null,
    "level" integer default 1,
    "exp" integer default 0,
    "exp_needed" integer default 100,
    "abi" integer default 0,
    "personality" text default 'lively'::text,
    "bonus_stats" jsonb default '{"HP": 0, "SP": 0, "ATK": 0, "DEF": 0, "INT": 0, "SPD": 0}'::jsonb,
    "discovered" text[] default '{}'::text[],
    "in_farm" boolean default false,
    "is_x_form" boolean default false,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."digimon" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "username" text,
    "bits" integer default 350,
    "saved_stats" integer default 0,
    "streak" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "category" text default 'Work'::text,
    "priority" text default 'Medium'::text,
    "difficulty" text default 'Medium'::text,
    "type" text default 'once'::text,
    "notes" text default ''::text,
    "done" boolean default false,
    "streak" integer default 0,
    "days_of_week" text[] default '{}'::text[],
    "last_completed_date" date,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."tasks" enable row level security;

CREATE UNIQUE INDEX digimon_pkey ON public.digimon USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

alter table "public"."digimon" add constraint "digimon_pkey" PRIMARY KEY using index "digimon_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."digimon" add constraint "digimon_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."digimon" validate constraint "digimon_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."tasks" add constraint "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$function$
;

grant delete on table "public"."digimon" to "anon";

grant insert on table "public"."digimon" to "anon";

grant references on table "public"."digimon" to "anon";

grant select on table "public"."digimon" to "anon";

grant trigger on table "public"."digimon" to "anon";

grant truncate on table "public"."digimon" to "anon";

grant update on table "public"."digimon" to "anon";

grant delete on table "public"."digimon" to "authenticated";

grant insert on table "public"."digimon" to "authenticated";

grant references on table "public"."digimon" to "authenticated";

grant select on table "public"."digimon" to "authenticated";

grant trigger on table "public"."digimon" to "authenticated";

grant truncate on table "public"."digimon" to "authenticated";

grant update on table "public"."digimon" to "authenticated";

grant delete on table "public"."digimon" to "service_role";

grant insert on table "public"."digimon" to "service_role";

grant references on table "public"."digimon" to "service_role";

grant select on table "public"."digimon" to "service_role";

grant trigger on table "public"."digimon" to "service_role";

grant truncate on table "public"."digimon" to "service_role";

grant update on table "public"."digimon" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";


  create policy "Users read own digimon"
  on "public"."digimon"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users read own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users read own tasks"
  on "public"."tasks"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


