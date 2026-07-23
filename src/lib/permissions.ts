// ─── Role → Permission Map ────────────────────────────────────────────────────
//
// This is the single source of truth for what each adminType can do.
// The frontend uses these to filter the sidebar and guard routes.
// The backend enforces the same rules server-side.

export type AdminType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CONTENT_ADMIN"
  | "PRODUCT_ADMIN";

export type Permission =
  | "MANAGE_SYSTEM"
  | "MANAGE_ADMINS"
  | "MANAGE_USERS"
  | "MANAGE_CONTENT"
  | "MANAGE_PRODUCTS";

export const ROLE_PERMISSIONS: Record<AdminType, Permission[]> = {
  SUPER_ADMIN: [
    "MANAGE_SYSTEM",
    "MANAGE_ADMINS",
    "MANAGE_USERS",
    "MANAGE_CONTENT",
    "MANAGE_PRODUCTS",
  ],
  ADMIN: ["MANAGE_USERS", "MANAGE_CONTENT", "MANAGE_PRODUCTS"],
  CONTENT_ADMIN: ["MANAGE_CONTENT"],
  PRODUCT_ADMIN: ["MANAGE_PRODUCTS"],
};

// ─── Route → Required Permissions ────────────────────────────────────────────
//
// A route is accessible if the user has AT LEAST ONE of the listed permissions.
// Routes not listed here are public / accessible to all authenticated admins.

export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  "/media":              ["MANAGE_CONTENT", "MANAGE_PRODUCTS"],
  "/categories":         ["MANAGE_CONTENT"],
  "/bible-stories":      ["MANAGE_CONTENT"],
  "/prayers":            ["MANAGE_CONTENT"],
  "/videos":             ["MANAGE_CONTENT"],
  "/products":           ["MANAGE_PRODUCTS"],
  "/product-categories": ["MANAGE_PRODUCTS"],
  "/orders":             ["MANAGE_PRODUCTS"],
  "/customers":          ["MANAGE_USERS", "MANAGE_PRODUCTS"],
  "/settings":           ["MANAGE_SYSTEM"],
  "/admin-management":   ["MANAGE_ADMINS"],
  "/app-users":          ["MANAGE_USERS", "MANAGE_SYSTEM"],
  "/support":            ["MANAGE_SYSTEM", "MANAGE_ADMINS", "MANAGE_PRODUCTS"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the permission set for a given adminType string (handles unknown/null gracefully). */
export function getPermissions(adminType: string | null | undefined): Permission[] {
  if (!adminType) return [];
  return ROLE_PERMISSIONS[adminType as AdminType] ?? [];
}

/** Returns true if the user has at least one of the required permissions. */
export function hasPermission(
  adminType: string | null | undefined,
  required: Permission[]
): boolean {
  if (!required.length) return true; // no restriction
  const userPerms = getPermissions(adminType);
  return required.some((p) => userPerms.includes(p));
}

/** Returns true if the user can access a given pathname. */
export function canAccessRoute(
  adminType: string | null | undefined,
  pathname: string
): boolean {
  // Dashboard is always accessible to any authenticated admin
  if (pathname === "/dashboard") return true;

  // Find the most specific matching route prefix
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS).filter((route) =>
    pathname.startsWith(route)
  );

  if (matchingRoutes.length === 0) {
    // No permission restriction defined → accessible to all authenticated admins
    return true;
  }

  // Use the longest (most specific) matching prefix
  const bestMatch = matchingRoutes.sort((a, b) => b.length - a.length)[0];
  return hasPermission(adminType, ROUTE_PERMISSIONS[bestMatch]);
}
