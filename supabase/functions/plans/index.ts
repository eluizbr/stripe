import { verifyWebhookSignature } from "../plans/lib/stripe.ts";
import { getSupabaseClient } from "./lib/supabase.ts";
import type { StripePlan, StripeProduct } from "./lib/types.ts";

// Definição da interface para o evento do webhook
interface WebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// Constantes para tipos de eventos
const STRIPE_EVENT = {
  PLAN_CREATED: "plan.created",
  PLAN_UPDATED: "plan.updated",
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
};

// Constantes para tabelas
const TABLE = {
  PLANS: "plans",
  PRODUCTS: "products",
};

// Funções utilitárias
const toISOString = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

const createResponse = (
  ok: boolean,
  message: string,
  status = ok ? 200 : 500,
) =>
  new Response(
    JSON.stringify({ ok, message }),
    { status, headers: { "Content-Type": "application/json" } },
  );

/**
 * Função principal para responder ao webhook
 */
async function handleWebhookRequest(request: Request): Promise<Response> {
  try {
    // Verificar assinatura
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return createResponse(false, "Cabeçalho Stripe-Signature ausente", 400);
    }

    // Verificar evento
    const body = await request.text();
    const event = await verifyWebhookSignature(
      body,
      signature,
    ) as unknown as WebhookEvent;
    console.log(`Processando evento: ${event.type}`);

    // Obter cliente Supabase
    const supabase = getSupabaseClient();

    // Processar eventos por tipo
    if (
      event.type === STRIPE_EVENT.PLAN_CREATED ||
      event.type === STRIPE_EVENT.PLAN_UPDATED
    ) {
      await processPlanEvent(
        supabase,
        event.data.object as unknown as StripePlan,
      );
    } else if (
      event.type === STRIPE_EVENT.PRODUCT_CREATED ||
      event.type === STRIPE_EVENT.PRODUCT_UPDATED
    ) {
      await processProductEvent(
        supabase,
        event.data.object as unknown as StripeProduct,
      );
    } else {
      console.log(`Evento não tratado: ${event.type}`);
    }

    return createResponse(true, "Evento processado com sucesso");
  } catch (error) {
    console.error(
      "Erro:",
      error instanceof Error ? error.message : String(error),
    );
    return createResponse(false, "Erro ao processar o evento");
  }
}

/**
 * Processa eventos de plano
 */
async function processPlanEvent(
  supabase: any,
  plan: StripePlan,
): Promise<void> {
  const { error, data } = await supabase
    .from(TABLE.PLANS)
    .upsert(
      {
        stripe_id: plan.id,
        active: plan.active,
        amount: plan.amount,
        amount_decimal: plan.amount_decimal,
        currency: plan.currency,
        interval: plan.interval,
        interval_count: plan.interval_count,
        created: toISOString(plan.created),
      },
      { onConflict: "stripe_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao processar plano: ${error.message}`);
  }

  console.log(`Plano atualizado com sucesso: ${data.id}`);
}

/**
 * Processa eventos de produto
 */
async function processProductEvent(
  supabase: any,
  product: StripeProduct,
): Promise<void> {
  // Buscar plano relacionado ao produto
  const { data: plan, error: planError } = await supabase
    .from(TABLE.PLANS)
    .select("*")
    .eq("stripe_id", product.default_price)
    .single();

  if (planError || !plan) {
    throw new Error(
      `Plano não encontrado para o produto: ${
        planError?.message || "Plano inexistente"
      }`,
    );
  }

  // Atualizar produto
  const { error, data } = await supabase
    .from(TABLE.PRODUCTS)
    .upsert(
      {
        stripe_id: product.id,
        plan_id: plan.id,
        name: product.name,
        active: product.active,
        created: toISOString(product.created),
      },
      { onConflict: "stripe_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao processar produto: ${error.message}`);
  }

  console.log(`Produto atualizado com sucesso: ${data.id}`);
}

// Exporta o handler para o serviço Deno
Deno.serve(handleWebhookRequest);
