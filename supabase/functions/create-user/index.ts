import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient } from "./lib/supabase.ts";

// Inicializa Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
});

// Handler principal
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const userId = body?.record?.id;
    const email = body?.record?.email;

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabaseClient();

    // Verificar cliente existente
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("stripe_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCustomer?.stripe_id) {
      return new Response(
        JSON.stringify({
          message: "Cliente já existe",
          stripe_id: existingCustomer.stripe_id,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Criar cliente no Stripe
    // const stripeCustomer = await stripe.customers.create({
    //   email,
    //   name: body?.record?.name,
    //   metadata: { user_id: userId },
    // });

    // Salvar no Supabase
    const { data, error } = await supabase
      .from("customers")
      .insert({
        email,
        user_id: userId,
        name: body?.record?.name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        message: "Cliente criado com sucesso",
        customer: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
