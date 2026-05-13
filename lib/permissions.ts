export const ROLES = {
  ADMIN: 'ADMIN',
  STORE_MANAGER: 'STORE_MANAGER',
  HR_STAFF: 'HR_STAFF',
  COLABORADOR: 'COLABORADOR',
} as const;

export type Role = keyof typeof ROLES;

interface NavItem {
  title: string;
  url: string;
  icon?: any;
  roles?: Role[];
  items?: NavItem[];
}

export const PERMISSIONS: NavItem[] = [
  { title: "Dashboard",           url: "/dashboard",   roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  { title: "Colaboradores",       url: "/colaboradores", roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  { title: "Documentação",        url: "/documentos",  roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF, ROLES.COLABORADOR] },
  { title: "Pontuação de Equipe", url: "/ponto",       roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  { title: "Penalidades (RAP)",   url: "/penalidades", roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  { title: "Prêmios & Benefícios", url: "/premios",   roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  { title: "Controle de Uniformes", url: "/uniformes", roles: [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.HR_STAFF] },
  {
    title: "Funções & Lojas",
    url: "/config",
    roles: [ROLES.ADMIN, ROLES.HR_STAFF],
    items: [
      { title: "Funções",  url: "/config/funcoes", roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
      { title: "Lojas",    url: "/config/lojas",   roles: [ROLES.ADMIN] },
      { title: "Times",    url: "/config/times",   roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
      { title: "Setores",  url: "/config/setores", roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
    ],
  },
  { title: "Relatórios", url: "/relatorios", roles: [ROLES.ADMIN, ROLES.HR_STAFF] },
];

export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  let userRole = role.toUpperCase();

  if (userRole === 'RH') userRole = ROLES.HR_STAFF;
  if (userRole === 'GERENTE') userRole = ROLES.STORE_MANAGER;
  if (userRole === 'EMPLOYEE') userRole = ROLES.COLABORADOR;
  if (userRole === 'COLABORADOR') userRole = ROLES.COLABORADOR;

  if (userRole === ROLES.ADMIN) return true;

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
    if (
      path.startsWith('/dashboard') || path.startsWith('/colaboradores') ||
      path.startsWith('/documentos') || path.startsWith('/config')
    ) return false;
    return true;
  }

  return route.roles?.includes(userRole as Role) || false;
}
