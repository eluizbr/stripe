import { verifyWebhookSignature } from "./lib/stripe.ts";
import { getSupabaseClient } from "./lib/supabase.ts";
import { StripeCustomer, StripeInvoice } from "./lib/types.ts";

// Enums para tipos de eventos e tabelas
enum StripeEvent {
  INVOICE_CREATED = "invoice.created",
  INVOICE_UPDATED = "invoice.updated",
  CUSTOMER_UPDATED = "customer.updated",
}

enum Table {
  CUSTOMERS = "customers",
  INVOICES = "invoices",
  PRODUCTS = "products",
}

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
  const supabase = getSupabaseClient();

  try {
    // Verificar assinatura
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return createResponse(false, "Cabeçalho Stripe-Signature ausente", 400);
    }

    // Obter e verificar evento
    const event = await verifyWebhookSignature(await request.text(), signature);
    console.log(`Processando evento: ${event.type}`);

    // Processar diferentes tipos de eventos
    if (event.type === StripeEvent.CUSTOMER_UPDATED) {
      await processCustomerEvent(supabase, event.data.object as StripeCustomer);
    } else if (
      [StripeEvent.INVOICE_CREATED, StripeEvent.INVOICE_UPDATED].includes(
        event.type,
      )
    ) {
      await processInvoiceEvent(supabase, event.data.object as StripeInvoice);
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
 * Processa evento de atualização de cliente
 */
async function processCustomerEvent(
  supabase: any,
  customer: StripeCustomer,
): Promise<void> {
  if (!customer.email) throw new Error("Email do cliente não fornecido");

  const { error } = await supabase
    .from(Table.CUSTOMERS)
    .update({
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    })
    .eq("email", customer.email);

  if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
}

/**
 * Processa evento de fatura
 */
async function processInvoiceEvent(
  supabase: any,
  invoice: StripeInvoice,
): Promise<void> {
  // Validar dados essenciais
  const productId = invoice.lines.data[0]?.pricing?.price_details?.product;
  if (!productId) throw new Error("ID do produto não encontrado");
  if (!invoice.customer_email) {
    throw new Error("Email do cliente não encontrado");
  }

  // Buscar dados necessários
  const { data: product, error: productError } = await supabase
    .from(Table.PRODUCTS)
    .select("id")
    .eq("stripe_id", productId)
    .single();

  if (productError || !product) throw new Error("Produto não encontrado");

  const { data: customer, error: customerError } = await supabase
    .from(Table.CUSTOMERS)
    .select("id")
    .eq("email", invoice.customer_email)
    .single();

  if (customerError || !customer) throw new Error("Cliente não encontrado");

  // Atualizar cliente
  await updateCustomer(supabase, customer.id, invoice);

  // Atualizar fatura
  const { error } = await supabase
    .from(Table.INVOICES)
    .upsert({
      stripe_id: invoice.id,
      product_id: product.id,
      status: invoice.status,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      total: invoice.total,
      total_excluding_tax: invoice.total_excluding_tax || invoice.total,
      subtotal_excluding_tax: invoice.subtotal_excluding_tax ||
        invoice.subtotal,
      currency: invoice.currency,
      period_start: toISOString(invoice.period_start),
      period_end: toISOString(invoice.period_end),
      quantity: invoice.lines.data[0]?.quantity || 1,
      created: toISOString(invoice.created),
      customer_id: customer.id,
    }, { onConflict: "stripe_id" });

  if (error) throw new Error(`Falha ao atualizar fatura: ${error.message}`);
}

/**
 * Atualiza os dados do cliente
 */
async function updateCustomer(
  supabase: any,
  customerId: string,
  invoice: StripeInvoice,
): Promise<void> {
  const { error } = await supabase
    .from(Table.CUSTOMERS)
    .update({
      stripe_id: invoice.customer,
      email: invoice.customer_email,
      name: invoice.customer_name,
      phone: invoice.customer_phone,
      address: invoice.customer_address,
    })
    .eq("id", customerId);

  if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
}

// Exporta o handler para o serviço Deno
Deno.serve(handleWebhookRequest);
