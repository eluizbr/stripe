import { verifyWebhookSignature } from "../plans/lib/stripe.ts";
import { StripeSubscription } from "./lib/types.ts";

// Constantes para tipos de eventos do Stripe
const STRIPE_EVENTS = {
  SUBISCRIPTION_CREATED: "subscription.created",
  SUBISCRIPTION_UPDATED: "subscription.updated",
};

// Constantes para tabelas do Supabase
const TABLES = {
  SUBISCRIPTION: "subscriptions",
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

      console.log(subscritpion);
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
