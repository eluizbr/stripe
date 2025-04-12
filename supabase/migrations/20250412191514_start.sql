create extension if not exists "wrappers" with schema "extensions";


create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "email" text,
    "stripe_id" text,
    "user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."customers" enable row level security;

create table "public"."plans" (
    "id" uuid not null default gen_random_uuid(),
    "stripe_id" text,
    "active" boolean default true,
    "amount" integer default 0,
    "amount_decimal" text default '0'::text,
    "currency" text,
    "interval" text,
    "interval_count" integer default 1,
    "created" timestamp without time zone default now(),
    "updated:" timestamp with time zone default now()
);


alter table "public"."plans" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "stripe_id" text,
    "plan_id" uuid,
    "name" text,
    "active" boolean default true,
    "created" timestamp with time zone default now(),
    "updated" timestamp with time zone default now()
);


alter table "public"."products" enable row level security;

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_stripe_id_key ON public.customers USING btree (stripe_id);

CREATE UNIQUE INDEX plan_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX plan_stripe_id_key ON public.plans USING btree (stripe_id);

CREATE UNIQUE INDEX product_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_plan_id_key ON public.products USING btree (plan_id);

CREATE UNIQUE INDEX products_stripe_id_key ON public.products USING btree (stripe_id);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."plans" add constraint "plan_pkey" PRIMARY KEY using index "plan_pkey";

alter table "public"."products" add constraint "product_pkey" PRIMARY KEY using index "product_pkey";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."customers" add constraint "customers_stripe_id_key" UNIQUE using index "customers_stripe_id_key";

alter table "public"."customers" add constraint "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_user_id_fkey";

alter table "public"."plans" add constraint "plan_stripe_id_key" UNIQUE using index "plan_stripe_id_key";

alter table "public"."products" add constraint "product_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL not valid;

alter table "public"."products" validate constraint "product_plan_id_fkey";

alter table "public"."products" add constraint "products_plan_id_key" UNIQUE using index "products_plan_id_key";

alter table "public"."products" add constraint "products_stripe_id_key" UNIQUE using index "products_stripe_id_key";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."plans" to "anon";

grant insert on table "public"."plans" to "anon";

grant references on table "public"."plans" to "anon";

grant select on table "public"."plans" to "anon";

grant trigger on table "public"."plans" to "anon";

grant truncate on table "public"."plans" to "anon";

grant update on table "public"."plans" to "anon";

grant delete on table "public"."plans" to "authenticated";

grant insert on table "public"."plans" to "authenticated";

grant references on table "public"."plans" to "authenticated";

grant select on table "public"."plans" to "authenticated";

grant trigger on table "public"."plans" to "authenticated";

grant truncate on table "public"."plans" to "authenticated";

grant update on table "public"."plans" to "authenticated";

grant delete on table "public"."plans" to "service_role";

grant insert on table "public"."plans" to "service_role";

grant references on table "public"."plans" to "service_role";

grant select on table "public"."plans" to "service_role";

grant trigger on table "public"."plans" to "service_role";

grant truncate on table "public"."plans" to "service_role";

grant update on table "public"."plans" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";


