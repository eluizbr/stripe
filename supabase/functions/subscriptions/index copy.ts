import { verifyWebhookSignature } from "../plans/lib/stripe.ts";
import { getSupabaseClient } from "./lib/supabase.ts";
import { StripeSubscription } from "./lib/types.ts";

// Constantes para tipos de eventos do Stripe
const STRIPE_EVENTS = {
  SUBISCRIPTION_CREATED: "customer.subscription.created",
  SUBISCRIPTION_UPDATED: "customer.subscription.updated",
};

// Constantes para tabelas do Supabase
const TABLES = {
  SUBISCRIPTION: "subscriptions",
  PLANS: "plans",
  CUSTOMERS: "customers",
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
 * Função principal para responder ao webhook
 * @param request Objeto de requisição do webhook
 * @returns Resposta HTTP
 */
async function handleWebhookRequest(request: Request): Promise<Response> {
  const supabase = getSupabaseClient();

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
    );

    if (
      event.type === STRIPE_EVENTS.SUBISCRIPTION_CREATED ||
      event.type === STRIPE_EVENTS.SUBISCRIPTION_UPDATED
    ) {
      const subscritpion = event.data.object as StripeSubscription;

      // Pega ID do plano atrelado a assinatura
      const planId = subscritpion.items.data[0].plan.id;
      // Pega o plano  no supabase
      const { data: plan, error: planError } = await supabase
        .from(TABLES.PLANS)
        .select("id")
        .eq("stripe_id", planId)
        .single();
      if (planError) {
        console.error("Erro ao buscar plano:", planError);
        return createErrorResponse("Erro ao buscar plano", 500);
      }
      if (!plan) {
        console.error("Plano não encontrado");
        return createErrorResponse("Plano não encontrado", 404);
      }
      // Pega ID do cliente atrelado a assinatura
      const customerId = subscritpion.customer;
      // Pega o cliente no supabase
      const { data: customer, error: customerError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select("id")
        .eq("stripe_id", customerId)
        .single();
      if (customerError) {
        console.error("Erro ao buscar cliente:", customerError);
        return createErrorResponse("Erro ao buscar cliente", 500);
      }
      if (!customer) {
        console.error("Cliente não encontrado");
        return createErrorResponse("Cliente não encontrado", 404);
      }
      // Atualiza a assinatura no Supabase

      const { data, error } = await supabase
        .from(TABLES.SUBISCRIPTION)
        .upsert({
          stripe_id: "sub_1RDA6eCIHU4WlgDDT7QpYUCE",
          customer_id: customer.id,
          plan_id: plan.id,
          status: subscritpion.status,
          billing_cycle_anchor: timestampToISOString(
            subscritpion.billing_cycle_anchor,
          ),
          current_period_start: timestampToISOString(
            subscritpion.items.data[0].current_period_start,
          ),
          current_period_end: timestampToISOString(
            subscritpion.items.data[0].current_period_end,
          ),
          cancel_at: timestampToISOString(subscritpion.cancel_at),
          canceled_at: timestampToISOString(subscritpion.cancel_at),
          cancel_at_period_end: subscritpion.cancel_at_period_end,
          created_at: timestampToISOString(subscritpion.created),
        }, { onConflict: "stripe_id" })
        .select()
        .single();

      if (error) {
        console.error(error);
      }

      if (data) {
        console.info(data);
      }
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
