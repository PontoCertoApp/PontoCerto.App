export const ROLES = {
  ADMIN:           "ADMIN",
  STORE_MANAGER:   "STORE_MANAGER",
  HR_STAFF:        "HR_STAFF",
  COLABORADOR:     "COLABORADOR",
  UPLOAD_OPERATOR: "UPLOAD_OPERATOR",
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
  { title: "Dashboard",           url: "/dashboard",    roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Colaboradores",       url: "/colaboradores", roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Documentação",        url: "/documentos",   roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF", "COLABORADOR"] },
  { title: "Pontuação de Equipe", url: "/ponto",        roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Vagas",               url: "/vagas",        roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Gestão Disciplinar",  url: "/disciplinar",  roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Penalidades (RAP)",   url: "/penalidades",  roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Exames Médicos",      url: "/exames",       roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Prêmios & Benefícios", url: "/premios",    roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  { title: "Controle de Uniformes", url: "/uniformes", roles: ["ADMIN", "STORE_MANAGER", "HR_STAFF"] },
  {
    title: "RH Central",
    url: "/rh",
    roles: ["ADMIN", "HR_STAFF"],
    items: [
      { title: "Apuração de Benefícios", url: "/rh/beneficios",  roles: ["ADMIN", "HR_STAFF"] },
      { title: "Banco de Horas",         url: "/rh/banco-horas", roles: ["ADMIN", "HR_STAFF"] },
      { title: "Envio de Documentos",    url: "/rh/upload",      roles: ["ADMIN", "HR_STAFF", "UPLOAD_OPERATOR"] },
    ],
  },
  {
    title: "Funções & Lojas",
    url: "/config",
    roles: ["ADMIN", "HR_STAFF"],
    items: [
      { title: "Funções",  url: "/config/funcoes", roles: ["ADMIN", "HR_STAFF"] },
      { title: "Lojas",    url: "/config/lojas",   roles: ["ADMIN"] },
      { title: "Times",    url: "/config/times",   roles: ["ADMIN", "HR_STAFF"] },
      { title: "Setores",  url: "/config/setores", roles: ["ADMIN", "HR_STAFF"] },
    ],
  },
  { title: "Relatórios",          url: "/relatorios",   roles: ["ADMIN", "HR_STAFF"] },
  { title: "Administrador Geral", url: "/admin/usuarios", roles: ["ADMIN"] },
];

export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  let userRole = role.toUpperCase();

  // Legacy mappings
  if (userRole === "RH")       userRole = ROLES.HR_STAFF;
  if (userRole === "GERENTE")  userRole = ROLES.STORE_MANAGER;
  if (userRole === "EMPLOYEE") userRole = ROLES.COLABORADOR;

  if (userRole === ROLES.ADMIN) return true;

  // UPLOAD_OPERATOR só acessa /rh/upload
  if (userRole === ROLES.UPLOAD_OPERATOR) {
    return path.startsWith("/rh/upload");
  }

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
      path.startsWith("/dashboard") || path.startsWith("/colaboradores") ||
      path.startsWith("/documentos") || path.startsWith("/config") ||
      path.startsWith("/rh")
    ) return false;
    return true;
  }

  return route.roles?.includes(userRole as Role) || false;
}
