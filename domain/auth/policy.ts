import type { UserMe, UserRole } from "@/domain/auth/types";

export function hasRole(me: UserMe | null | undefined, role: UserRole) {
  return Boolean(me?.roles?.includes(role));
}

export function canAccessStore(
  me: UserMe | null | undefined,
  storeId: string | number
) {
  if (!me) return false;
  return me.accessible_store_ids?.includes(storeId) ?? false;
}


