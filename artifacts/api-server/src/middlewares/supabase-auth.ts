import { type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

export async function supabaseAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  const client = getSupabase();

  if (!client) {
    logger.warn("Supabase client not initialized — missing SUPABASE_URL or key");
    next();
    return;
  }

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      next();
      return;
    }
    (req as any).userId = data.user.id;
    (req as any).userEmail = data.user.email;
  } catch (err) {
    logger.error({ err }, "Supabase auth error");
  }

  next();
}
