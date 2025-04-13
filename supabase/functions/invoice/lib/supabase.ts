// lib/supabase.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Retorna um cliente Supabase inicializado com as credenciais do ambiente
 * @throws {Error} Se as variáveis de ambiente não estiverem configuradas
 */
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
  }

  return createClient(supabaseUrl, supabaseKey);
}
