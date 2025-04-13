import { verifyWebhookSignature } from "./lib/stripe.ts";
import { getSupabaseClient } from "./lib/supabase.ts";
import { StripeCustomer, StripePlan, StripeSubscription } from "./lib/types.ts";

/**
 * Enum para tipos de eventos Stripe suportados
 */
enum StripeEventType {
  SUBSCRIPTION_CREATED = "customer.subscription.created",
  SUBSCRIPTION_UPDATED = "customer.subscription.updated",
  SUBSCRIPTION_DELETED = "customer.subscription.deleted",
}

/**
 * Enum para tabelas do Supabase
 */
enum Table {
  CUSTOMERS = "customers",
  INVOICES = "invoices",
  PRODUCTS = "products",
  PLANS = "plans",
  SUBSCRIPTIONS = "subscriptions",
}

/**
 * Converte timestamp Unix para string ISO
 * @param timestamp - Timestamp em segundos (formato Unix)
 * @returns String ISO ou null se timestamp for undefined/null
 */
const toISOString = (timestamp?: number | null): string | null =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

/**
 * Cria uma resposta HTTP padronizada
 * @param ok - Indica se a operação foi bem-sucedida
 * @param message - Mensagem informativa
 * @param status - Código de status HTTP (default: 200 para ok=true, 500 para ok=false)
 * @returns Objeto Response formatado
 */
const createResponse = (
  ok: boolean,
  message: string,
  status = ok ? 200 : 500,
): Response =>
  new Response(
    JSON.stringify({ ok, message }),
    { status, headers: { "Content-Type": "application/json" } },
  );

/**
 * Busca informações do cliente no Supabase pelo ID do Stripe
 * @param supabase - Cliente Supabase
 * @param customerId - ID do cliente no Stripe
 * @returns Dados do cliente ou null se não encontrado
 * @throws Erro se ocorrer falha na consulta
 */
async function getCustomer(
  supabase: any,
  customerId: string,
): Promise<StripeCustomer | null> {
  // Usando maybeSingle() em vez de single() para permitir que nenhum resultado seja retornado
  const { data, error } = await supabase
    .from(Table.CUSTOMERS)
    .select()
    .eq("stripe_id", customerId)
    .single();

  if (error) {
    // Erro real de banco de dados
    throw new Error(`Falha ao buscar cliente: ${error.message}`);
  }

  // data será null se nenhum cliente for encontrado
  return data;
}

/**
 * Busca informações do plano no Supabase pelo ID do Stripe
 * @param supabase - Cliente Supabase
 * @param planId - ID do plano no Stripe
 * @returns Dados do plano ou null se não encontrado
 * @throws Erro se ocorrer falha na consulta
 */
async function getPlan(
  supabase: any,
  planId: string,
): Promise<StripePlan | null> {
  // Usando maybeSingle() em vez de single() para permitir que nenhum resultado seja retornado
  const { data, error } = await supabase
    .from(Table.PLANS)
    .select()
    .eq("stripe_id", planId)
    .single();

  if (error) {
    throw new Error(`Falha ao buscar plano: ${error.message}`);
  }

  return data;
}

/**
 * Processa eventos de assinatura (criação/atualização)
 * @param supabase - Cliente Supabase
 * @param subscription - Objeto de assinatura do Stripe
 * @throws Erro se ocorrer falha no processamento
 */
async function processSubscriptionEvent(
  supabase: any,
  subscription: StripeSubscription,
): Promise<void> {
  // Buscar dados relacionados
  const customer = await getCustomer(supabase, subscription.customer);
  const plan = await getPlan(supabase, subscription.plan.id);

  // Log para depuração
  console.log(
    `Cliente: ${
      customer ? "encontrado" : "não encontrado"
    }, ID Stripe: ${subscription.customer}`,
  );
  console.log(
    `Plano: ${
      plan ? "encontrado" : "não encontrado"
    }, ID Stripe: ${subscription.plan.id}`,
  );

  // Se cliente ou plano não forem encontrados, registramos o evento mas não processamos
  if (!customer) {
    console.warn(
      `Webhook ignorado: Cliente não encontrado para ID Stripe: ${subscription.customer}`,
    );
    return; // Retorna sem erro para não reprocessar o webhook
  }

  if (!plan) {
    console.warn(
      `Webhook ignorado: Plano não encontrado para ID Stripe: ${subscription.plan.id}`,
    );
    return; // Retorna sem erro para não reprocessar o webhook
  }

  // Inserir ou atualizar a assinatura
  const { error } = await supabase
    .from(Table.SUBSCRIPTIONS)
    .upsert({
      customer_id: customer?.user_id,
      stripe_id: subscription.id,
      plan_id: plan.id,
      default_payment_method: subscription.default_payment_method,
      billing_cycle_anchor: toISOString(subscription.billing_cycle_anchor),
      cancel_at: toISOString(subscription.cancel_at),
      cancel_at_period_end: subscription.cancel_at_period_end,
      ended_at: toISOString(subscription.ended_at),
      cancellation_details: subscription.cancellation_details,
      collection_method: subscription.collection_method,
      currency: subscription.currency,
      description: subscription.description,
      quantity: subscription.quantity, // Corrigido "qauntity" para "quantity"
      status: subscription.status,
      created: toISOString(subscription.created),
    }, { onConflict: "stripe_id" });

  if (error) {
    throw new Error(`Falha ao atualizar assinatura: ${error.message}`);
  }
}

/**
 * Manipulador principal do webhook Stripe
 * @param request - Objeto de requisição HTTP
 * @returns Resposta HTTP
 */
async function handleWebhookRequest(request: Request): Promise<Response> {
  const supabase = getSupabaseClient();
  let eventData: string;

  try {
    // Capturar corpo da requisição antes de processar
    eventData = await request.text();

    // Verificar assinatura do webhook
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return createResponse(false, "Cabeçalho Stripe-Signature ausente", 400);
    }

    // Verificar e analisar o evento
    const event = await verifyWebhookSignature(eventData, signature);

    // Processar com base no tipo de evento
    switch (event.type) {
      case StripeEventType.SUBSCRIPTION_CREATED:
      case StripeEventType.SUBSCRIPTION_UPDATED:
      case StripeEventType.SUBSCRIPTION_DELETED:
        await processSubscriptionEvent(
          supabase,
          event.data.object as StripeSubscription,
        );
        return createResponse(
          true,
          `Evento ${event.type} processado com sucesso`,
        );

      default:
        // Tipo de evento não tratado
        return createResponse(
          true,
          `Evento ${event.type} ignorado (não configurado)`,
        );
    }
  } catch (error) {
    // Log detalhado do erro para diagnóstico
    console.error(
      "Erro ao processar webhook:",
      error instanceof Error ? error.message : String(error),
      error instanceof Error && error.stack ? error.stack : "",
    );

    return createResponse(
      false,
      `Erro ao processar evento: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
      500,
    );
  }
}

// Exporta o handler para o serviço Deno
Deno.serve(handleWebhookRequest);
