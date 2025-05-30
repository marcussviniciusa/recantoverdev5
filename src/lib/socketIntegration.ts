// Funções para integrar APIs com Socket.IO e emitir notificações automaticamente

interface OrderData {
  _id: string;
  tableId: { _id: string; number: number };
  waiterId: { _id: string; username: string };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  status: string;
  totalAmount: number;
}

interface TableData {
  _id: string;
  number: number;
  capacity: number;
  status: string;
  assignedWaiter?: string;
}

interface PaymentData {
  _id: string;
  orderId: {
    _id: string;
    tableId: { number: number };
  };
  totalAmount: number;
}

interface UserData {
  _id: string;
  username: string;
  role: string;
  email: string;
}

// Emitir notificação de novo pedido
export const emitOrderCreated = (orderData: OrderData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('order_created', orderData);
  }
};

// Emitir notificação de atualização de status do pedido
export const emitOrderStatusUpdated = (orderData: OrderData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('order_status_updated', orderData);
  }
};

// Emitir notificação de mesa ocupada
export const emitTableOccupied = (tableData: TableData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('table_occupied', tableData);
  }
};

// Emitir notificação de mesa liberada
export const emitTableFreed = (tableData: TableData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('table_freed', tableData);
  }
};

// Emitir notificação de pagamento registrado
export const emitPaymentRegistered = (paymentData: PaymentData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('payment_registered', paymentData);
  }
};

// Emitir notificação de novo usuário criado
export const emitUserCreated = (userData: UserData) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('user_created', userData);
  }
};

// Emitir broadcast do sistema
export const emitSystemBroadcast = (message: string) => {
  if (typeof window !== 'undefined' && (window as any).socketEmitter) {
    (window as any).socketEmitter('system_broadcast', message);
  }
};

// Hook para facilitar o uso das integrações
export const useSocketIntegration = () => {
  return {
    emitOrderCreated,
    emitOrderStatusUpdated,
    emitTableOccupied,
    emitTableFreed,
    emitPaymentRegistered,
    emitUserCreated,
    emitSystemBroadcast
  };
}; 