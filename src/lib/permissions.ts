// Sistema de permissões baseado em roles

export type Role = "USER" | "ADMIN" | "DELIVERY" | "FINANCIAL" | "MANAGEMENT";

export interface Permissions {
  // Pedidos
  canViewOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;
  canAssignDelivery: boolean;
  
  // Produtos
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  
  // Categorias
  canViewCategories: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  
  // Usuários
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  
  // Entregadores
  canViewDeliveryPersons: boolean;
  canManageDeliveryPersons: boolean;
  canAssignRoutes: boolean;
  
  // Fluxo de Caixa
  canViewCashFlow: boolean;
  canCreateCashFlow: boolean;
  canEditCashFlow: boolean;
  canDeleteCashFlow: boolean;
  
  // Zonas de Entrega
  canViewDeliveryZones: boolean;
  canManageDeliveryZones: boolean;
  
  // Pedidos Não Pagos
  canViewUnpaidOrders: boolean;
  canManageUnpaidOrders: boolean;
}

export function getPermissions(role: Role): Permissions {
  switch (role) {
    case "ADMIN":
      // Administrador tem acesso total
      return {
        canViewOrders: true,
        canEditOrders: true,
        canDeleteOrders: true,
        canAssignDelivery: true,
        canViewProducts: true,
        canCreateProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canViewCategories: true,
        canCreateCategories: true,
        canEditCategories: true,
        canDeleteCategories: true,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewDeliveryPersons: true,
        canManageDeliveryPersons: true,
        canAssignRoutes: true,
        canViewCashFlow: true,
        canCreateCashFlow: true,
        canEditCashFlow: true,
        canDeleteCashFlow: true,
        canViewDeliveryZones: true,
        canManageDeliveryZones: true,
        canViewUnpaidOrders: true,
        canManageUnpaidOrders: true,
      };
      
    case "FINANCIAL":
      // Financeiro: fluxo de caixa + visualização e gestão de pedidos (apenas campos financeiros)
      return {
        canViewOrders: true,
        canEditOrders: true, // Pode editar para marcar como pago, alterar método de pagamento, etc.
        canDeleteOrders: false,
        canAssignDelivery: false, // Não pode atribuir entregadores
        canViewProducts: false,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewCategories: false,
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewDeliveryPersons: false,
        canManageDeliveryPersons: false,
        canAssignRoutes: false,
        canViewCashFlow: true,
        canCreateCashFlow: true,
        canEditCashFlow: true,
        canDeleteCashFlow: true,
        canViewDeliveryZones: false,
        canManageDeliveryZones: false,
        canViewUnpaidOrders: true, // Pode ver pedidos não pagos para cobrar
        canManageUnpaidOrders: true, // Pode marcar como pago
      };
      
    case "MANAGEMENT":
      // Gerência: pode gerenciar entregas, rotas, pedidos, zonas e entregadores (sem produtos, categorias e usuários)
      return {
        canViewOrders: true,
        canEditOrders: true,
        canDeleteOrders: false,
        canAssignDelivery: true,
        canViewProducts: false, // Oculto para gerência
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewCategories: false, // Oculto para gerência
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canViewUsers: false, // Oculto para gerência
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewDeliveryPersons: true,
        canManageDeliveryPersons: true,
        canAssignRoutes: true,
        canViewCashFlow: false,
        canCreateCashFlow: false,
        canEditCashFlow: false,
        canDeleteCashFlow: false,
        canViewDeliveryZones: true,
        canManageDeliveryZones: true,
        canViewUnpaidOrders: true,
        canManageUnpaidOrders: true,
      };
      
    case "DELIVERY":
      // Entregador: apenas visualização própria
      return {
        canViewOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canAssignDelivery: false,
        canViewProducts: false,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewCategories: false,
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewDeliveryPersons: false,
        canManageDeliveryPersons: false,
        canAssignRoutes: false,
        canViewCashFlow: false,
        canCreateCashFlow: false,
        canEditCashFlow: false,
        canDeleteCashFlow: false,
        canViewDeliveryZones: false,
        canManageDeliveryZones: false,
        canViewUnpaidOrders: false,
        canManageUnpaidOrders: false,
      };
      
    default:
      // USER: sem permissões administrativas
      return {
        canViewOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canAssignDelivery: false,
        canViewProducts: false,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewCategories: false,
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewDeliveryPersons: false,
        canManageDeliveryPersons: false,
        canAssignRoutes: false,
        canViewCashFlow: false,
        canCreateCashFlow: false,
        canEditCashFlow: false,
        canDeleteCashFlow: false,
        canViewDeliveryZones: false,
        canManageDeliveryZones: false,
        canViewUnpaidOrders: false,
        canManageUnpaidOrders: false,
      };
  }
}

export function canAccessAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "FINANCIAL" || role === "MANAGEMENT";
}

