// lib/stripe.ts
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";

let stripeInstance: Stripe | null = null;

/**
 * Retorna uma instância Stripe, criando-a se necessário
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const apiKey = Deno.env.get("STRIPE_API_KEY");

    if (!apiKey) {
      throw new Error("Variável de ambiente STRIPE_API_KEY não configurada");
    }

    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2025-03-31",
    });
  }

  return stripeInstance;
}

/**
 * Retorna o segredo do webhook
 */
export function getWebhookSecret(): string {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!secret) {
    throw new Error(
      "Variável de ambiente STRIPE_WEBHOOK_SIGNING_SECRET não configurada",
    );
  }

  return secret;
}

/**
 * Verifica a assinatura de um webhook e retorna o evento
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  try {
    return await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.log("Erro ao verificar assinatura do webhook", error);
    throw error;
  }
}
