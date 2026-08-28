import { createUserClient } from "./db.ts";

export interface UserContext {
  userId: string;
  email: string;
  tenantId: string;
  companyId: string;
  role: string;
}

export async function getUserContext(
  authorizationHeader: string | null
): Promise<{
  supabase: ReturnType<typeof createUserClient>;
  user: UserContext;
}> {

  if (!authorizationHeader) {
    throw new Error("Missing Authorization header.");
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  const supabase = createUserClient(token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Invalid or expired token.");
  }

  const claims = user.app_metadata ?? {};

  return {
    supabase,
    user: {
      userId: user.id,
      email: user.email ?? "",
      tenantId: claims.tenant_id ?? "",
      companyId: claims.company_id ?? "",
      role: claims.role ?? "USER",
    },
  };
}