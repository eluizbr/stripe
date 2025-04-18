create extension if not exists "wrappers" with schema "extensions";


create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "email" text,
    "stripe_id" text,
    "user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "address" jsonb,
    "phone" text
);


alter table "public"."customers" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "stripe_id" text,
    "product_id" uuid default gen_random_uuid(),
    "status" text,
    "amount_due" integer,
    "amount_paid" integer,
    "total" bigint,
    "total_excluding_tax" bigint,
    "subtotal_excluding_tax" integer,
    "currency" text,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "quantity" integer default 0,
    "created" timestamp with time zone,
    "updated" timestamp with time zone,
    "customer_id" uuid,
    "subscription_id" text
);


alter table "public"."invoices" enable row level security;

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

create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "stripe_id" text,
    "plan_id" uuid,
    "default_payment_method" text,
    "billing_cycle_anchor" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "canceled_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "cancellation_details" jsonb,
    "collection_method" text,
    "currency" text,
    "description" text,
    "quantity" integer default 0,
    "status" text,
    "created" timestamp with time zone default now(),
    "updated" timestamp with time zone default now()
);


alter table "public"."subscriptions" enable row level security;

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_stripe_id_key ON public.customers USING btree (stripe_id);

CREATE UNIQUE INDEX customers_user_id_key ON public.customers USING btree (user_id);

CREATE UNIQUE INDEX invoice_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX invoice_stripe_id_key ON public.invoices USING btree (stripe_id);

CREATE UNIQUE INDEX plan_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX plan_stripe_id_key ON public.plans USING btree (stripe_id);

CREATE UNIQUE INDEX product_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_plan_id_key ON public.products USING btree (plan_id);

CREATE UNIQUE INDEX products_stripe_id_key ON public.products USING btree (stripe_id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX subscriptions_stripe_id_key ON public.subscriptions USING btree (stripe_id);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."invoices" add constraint "invoice_pkey" PRIMARY KEY using index "invoice_pkey";

alter table "public"."plans" add constraint "plan_pkey" PRIMARY KEY using index "plan_pkey";

alter table "public"."products" add constraint "product_pkey" PRIMARY KEY using index "product_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."customers" add constraint "customers_stripe_id_key" UNIQUE using index "customers_stripe_id_key";

alter table "public"."customers" add constraint "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_user_id_fkey";

alter table "public"."customers" add constraint "customers_user_id_key" UNIQUE using index "customers_user_id_key";

alter table "public"."invoices" add constraint "invoice_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoice_product_id_fkey";

alter table "public"."invoices" add constraint "invoice_stripe_id_key" UNIQUE using index "invoice_stripe_id_key";

alter table "public"."invoices" add constraint "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_customer_id_fkey";

alter table "public"."invoices" add constraint "invoices_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES subscriptions(stripe_id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_subscription_id_fkey";

alter table "public"."plans" add constraint "plan_stripe_id_key" UNIQUE using index "plan_stripe_id_key";

alter table "public"."products" add constraint "product_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL not valid;

alter table "public"."products" validate constraint "product_plan_id_fkey";

alter table "public"."products" add constraint "products_plan_id_key" UNIQUE using index "products_plan_id_key";

alter table "public"."products" add constraint "products_stripe_id_key" UNIQUE using index "products_stripe_id_key";

alter table "public"."subscriptions" add constraint "subscriptions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE SET NULL not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_customer_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_plan_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_stripe_id_key" UNIQUE using index "subscriptions_stripe_id_key";

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

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

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

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."customers"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable insert for users based on user_id"
on "public"."customers"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Enable update for users based on email"
on "public"."customers"
as permissive
for update
to public
using (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email))
with check (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email));


create policy "Enable users to view their own data only"
on "public"."customers"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Enable users to view their own data only"
on "public"."invoices"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = customer_id));


create policy "Enable users to view their own data only"
on "public"."subscriptions"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = customer_id));



