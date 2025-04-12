// Setup type definitions for built-in Supabase Runtime APIs
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient } from "./lib/supabase.ts";

// Tipos para melhorar a segurança do código
interface UserRecord {
  id: string;
  email: string;
  name?: string;
}

interface WebhookPayload {
  record: UserRecord;
  type: string;
  table: string;
}

// Constantes e configuração
const STRIPE_API_KEY = Deno.env.get("STRIPE_API_KEY");
if (!STRIPE_API_KEY) {
  throw new Error("STRIPE_API_KEY environment variable is required");
}

// Inicializa o cliente Stripe
const stripe = new Stripe(STRIPE_API_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Webhook handler para criar um cliente Stripe quando um novo usuário é registrado
 * Espera um payload do Supabase com informações do usuário
 */
Deno.serve(async (req) => {
  // Verificar método HTTP
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  try {
    // Extrair e validar o corpo da requisição
    const body = await req.json() as WebhookPayload;

    if (!body?.record?.id || !body?.record?.email) {
      return jsonResponse({
        error: "Dados de usuário inválidos ou incompletos",
      }, 400);
    }

    const { id: userId, email, name = "" } = body.record;

    // Obter cliente Supabase
    const supabase = getSupabaseClient();

    // Verificar se o cliente já existe para evitar duplicação
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("stripe_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCustomer?.stripe_id) {
      return jsonResponse({
        message: "Cliente Stripe já existe para este usuário",
        stripe_id: existingCustomer.stripe_id,
      });
    }

    // Criar cliente no Stripe
    const stripeCustomer = await stripe.customers.create({
      name,
      email,
      metadata: {
        user_id: userId,
      },
    });

    // Salvar referência no Supabase
    const { data, error } = await supabase
      .from("customers")
      .insert({
        email,
        user_id: userId,
        stripe_id: stripeCustomer.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Em caso de erro no Supabase, devemos limpar o cliente Stripe
      console.error("Erro ao inserir dados no Supabase:", error);
      await stripe.customers.del(stripeCustomer.id);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({
      message: "Cliente Stripe criado com sucesso",
      customer: data,
    });
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Erro desconhecido";

    return jsonResponse({
      error: "Erro interno do servidor",
      details: errorMessage,
    }, 500);
  }
});

/**
 * Função auxiliar para criar respostas JSON consistentes
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
