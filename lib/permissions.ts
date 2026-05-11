/**
 * Roles definition
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  STORE_MANAGER: 'STORE_MANAGER',
  HR_STAFF: 'HR_STAFF',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Role = keyof typeof ROLES;

/**
 * Menu Item definition matching sidebar structure
 */
interface NavItem {
  title: string;
  url: string;
  icon?: any;
  roles?: Role[];
  items?: NavItem[];
}

/**
 * Access control configuration
 * Based on requirements:
 * 
 * ADMIN: All modules
 * STORE_MANAGER: View team (store only), Documents, Registrations. DENIED: Config, Funções, Lojas.
 * HR_STAFF: HR Docs/Mgmt, Registrations, other RH modules. DENIED: Config (System).
 * EMPLOYEE: Own Upload/Docs, Own Registration. DENIED: Everything else.
 */
export const PERMISSIONS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Colaboradores",
    url: "/colaboradores",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Documentação",
    url: "/documentos",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF, ROLES.EMPLOYEE],
  },
  {
    title: "Pontuação de Equipe",
    url: "/ponto",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Penalidades (RAP)",
    url: "/penalidades",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Prêmios & Benefícios",
    url: "/premios",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Controle de Uniformes",
    url: "/uniformes",
    roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF],
  },
  {
    title: "Funções & Lojas",
    url: "/config",
    roles: [ROLES.ADMIN, ROLES.HR_STAFF],
    items: [
      { title: "Funções", url: "/config/funcoes", roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
      { title: "Lojas", url: "/config/lojas", roles: [ROLES.ADMIN] }, // Only Admin for Lojas as requested "Admin de lojas"
      { title: "Setores", url: "/config/setores", roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
    ],
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    roles: [ROLES.ADMIN, ROLES.HR_STAFF],
  },
];

/**
 * Checks if a user has access to a specific path
 */
export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const userRole = role.toUpperCase() as Role;
  
  // Admin bypass
  if (userRole === ROLES.ADMIN) return true;

  // Search for the route in the permissions tree
  const findRoute = (items: NavItem[]): NavItem | undefined => {
    for (const item of items) {
      if (path.startsWith(item.url)) {
        if (item.items) {
          const sub = findRoute(item.items);
          if (sub) return sub;
        }
        return item;
      }
    }
    return undefined;
  };

  const route = findRoute(PERMISSIONS);
  
  if (!route) {
    // If route is not in PERMISSIONS, it might be a public route or a base route
    // Default to false for dashboard routes if not explicitly listed
    if (path.startsWith('/dashboard') || 
        path.startsWith('/colaboradores') || 
        path.startsWith('/documentos') ||
        path.startsWith('/config')) {
      return false;
    }
    return true; 
  }

  return route.roles?.includes(userRole) || false;
}
