import { verifyWebhookSignature } from "../plans/lib/stripe.ts";
import { getSupabaseClient } from "./lib/supabase.ts";
import { StripeEvent, StripePlan, StripeProduct } from "./lib/types.ts";

// Constantes para tipos de eventos do Stripe
const STRIPE_EVENTS = {
  PLAN_CREATED: "plan.created",
  PLAN_UPDATED: "plan.updated",
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
};

// Constantes para tabelas do Supabase
const TABLES = {
  PLANS: "plans",
  PRODUCTS: "products",
};

/**
 * Converte timestamp Unix para ISO string
 * @param timestamp Timestamp Unix em segundos
 * @returns ISO string ou null se o timestamp não for válido
 */
function timestampToISOString(
  timestamp: number | null | undefined,
): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Processa eventos de plano (criação ou atualização)
 * @param stripePlan Objeto do plano do Stripe
 * @param supabase Cliente Supabase
 */
async function handlePlanEvent(
  stripePlan: StripePlan,
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<void> {
  try {
    const { error, data } = await supabase
      .from(TABLES.PLANS)
      .upsert(
        {
          stripe_id: stripePlan.id,
          active: stripePlan.active,
          amount: stripePlan.amount,
          amount_decimal: stripePlan.amount_decimal,
          currency: stripePlan.currency,
          interval: stripePlan.interval,
          interval_count: stripePlan.interval_count,
          created: timestampToISOString(stripePlan.created),
        },
        { onConflict: "stripe_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Erro ao processar evento de plano:", error);
    } else {
      console.log("Plano atualizado com sucesso:", data.id);
    }
  } catch (error) {
    console.error("Exceção ao processar evento de plano:", error);
  }
}

/**
 * Processa eventos de produto (criação ou atualização)
 * @param stripeProduct Objeto do produto do Stripe
 * @param supabase Cliente Supabase
 */
async function handleProductEvent(
  stripeProduct: StripeProduct,
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<void> {
  try {
    const { data: plan, error: planError } = await supabase
      .from(TABLES.PLANS)
      .select("*")
      .eq("stripe_id", stripeProduct.default_price)
      .single();

    if (planError) {
      console.error("Erro ao buscar plano para o produto:", planError);
      return;
    }

    if (plan) {
      const { error, data } = await supabase
        .from(TABLES.PRODUCTS)
        .upsert(
          {
            stripe_id: stripeProduct.id,
            plan_id: plan.id,
            name: stripeProduct.name,
            active: stripeProduct.active,
            created: timestampToISOString(stripeProduct.created),
          },
          { onConflict: "stripe_id" },
        )
        .select()
        .single();

      if (error) {
        console.error("Erro ao processar evento de produto:", error);
      } else {
        console.log("Produto atualizado com sucesso:", data.id);
      }
    }
  } catch (error) {
    console.error("Exceção ao processar evento de produto:", error);
  }
}

/**
 * Função principal para responder ao webhook
 * @param request Objeto de requisição do webhook
 * @returns Resposta HTTP
 */
async function handleWebhookRequest(request: Request): Promise<Response> {
  try {
    // Verificar cabeçalho de assinatura
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return createErrorResponse("Cabeçalho Stripe-Signature ausente", 400);
    }

    // Obter o corpo da requisição
    const body = await request.text();

    // Verificar assinatura e obter o evento
    const event = await verifyWebhookSignature(
      body,
      signature,
    ) as unknown as StripeEvent;

    // Obter cliente Supabase
    const supabase = getSupabaseClient();

    // Processar os diferentes tipos de eventos
    if (
      event.type === STRIPE_EVENTS.PLAN_CREATED ||
      event.type === STRIPE_EVENTS.PLAN_UPDATED
    ) {
      // Converter com segurança usando unknown como intermediário
      await handlePlanEvent(
        event.data.object as unknown as StripePlan,
        supabase,
      );
    } else if (
      event.type === STRIPE_EVENTS.PRODUCT_CREATED ||
      event.type === STRIPE_EVENTS.PRODUCT_UPDATED
    ) {
      // Converter com segurança usando unknown como intermediário
      await handleProductEvent(
        event.data.object as unknown as StripeProduct,
        supabase,
      );
    } else {
      console.log(`Evento não tratado: ${event.type}`);
    }

    // Retornar sucesso
    return createSuccessResponse("Evento processado com sucesso");
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    return createErrorResponse("Erro ao processar o evento", 500);
  }
}

/**
 * Cria uma resposta de sucesso
 * @param message Mensagem de sucesso
 * @returns Objeto Response
 */
function createSuccessResponse(message: string): Response {
  return new Response(
    JSON.stringify({ ok: true, message }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Cria uma resposta de erro
 * @param message Mensagem de erro
 * @param status Código de status HTTP
 * @returns Objeto Response
 */
function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ ok: false, message }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

// Exporta o handler principal para o serviço Deno
Deno.serve(handleWebhookRequest);
