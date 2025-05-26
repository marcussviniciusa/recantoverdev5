// Tipos de usuário
export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'garcom' | 'recepcionista';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de mesa
export interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
  currentCustomers?: number;
  openedAt?: Date;
  closedAt?: Date;
  assignedWaiter?: string; // ID do garçom
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de produto
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number; // em minutos
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de pedido
export interface Order {
  _id: string;
  tableId: string;
  waiterId: string;
  items: OrderItem[];
  status: 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  totalAmount: number;
  observations?: string;
  estimatedTime?: number; // em minutos
  isMarkedByReceptionist?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observations?: string;
}

// Tipos de pagamento
export interface Payment {
  _id: string;
  tableId: string;
  orderId: string;
  totalAmount: number;
  paymentMethods: PaymentMethod[];
  status: 'pendente' | 'pago' | 'cancelado';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  type: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'outro';
  amount: number;
  description?: string;
}

// Tipos para autenticação
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'garcom' | 'recepcionista';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Tipos para Socket.io
export interface SocketEvents {
  // Eventos de pedidos
  newOrder: (order: Order) => void;
  orderStatusUpdated: (orderId: string, status: Order['status']) => void;
  orderMarkedReady: (orderId: string) => void;
  
  // Eventos de mesas
  tableStatusUpdated: (tableId: string, status: Table['status']) => void;
  tableOpened: (table: Table) => void;
  tableClosed: (tableId: string) => void;
  
  // Eventos de notificação
  notification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  
  // Eventos de autenticação
  userJoined: (userId: string, role: string) => void;
  userLeft: (userId: string) => void;
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para configurações
export interface SystemConfig {
  gptIntegrationEnabled: boolean;
  whatsappIntegrationEnabled: boolean;
  maxTablesPerWaiter: number;
  defaultPreparationTime: number;
}

// Tipos para relatórios
export interface SalesReport {
  period: 'daily' | 'weekly' | 'monthly';
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: ProductSales[];
  paymentMethodBreakdown: PaymentMethodSummary[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod['type'];
  count: number;
  totalAmount: number;
}

// Tipos para UI
export interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
} 