import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observations?: string;
}

export interface IOrder extends Document {
  tableId: mongoose.Types.ObjectId;
  waiterId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  totalAmount: number;
  observations?: string;
  estimatedTime?: number; // em minutos
  isMarkedByReceptionist?: boolean;
  createdAt: Date;
  updatedAt: Date;
  calculateTotal(): number;
  updateStatus(newStatus: IOrder['status']): Promise<IOrder>;
  addItem(productId: string, productName: string, quantity: number, unitPrice: number, observations?: string): void;
  removeItem(productId: string): void;
}

const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'ID do produto é obrigatório']
  },
  productName: {
    type: String,
    required: [true, 'Nome do produto é obrigatório'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    min: [1, 'Quantidade deve ser pelo menos 1'],
    max: [100, 'Quantidade máxima é 100']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Preço unitário é obrigatório'],
    min: [0, 'Preço deve ser positivo']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Preço total é obrigatório'],
    min: [0, 'Preço total deve ser positivo']
  },
  observations: {
    type: String,
    trim: true,
    maxlength: [200, 'Observações não podem ter mais de 200 caracteres']
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  tableId: {
    type: Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'ID da mesa é obrigatório']
  },
  waiterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do garçom é obrigatório']
  },
  items: {
    type: [OrderItemSchema],
    required: [true, 'Itens do pedido são obrigatórios'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: 'Pedido deve ter pelo menos um item'
    }
  },
  status: {
    type: String,
    enum: ['preparando', 'pronto', 'entregue', 'cancelado'],
    default: 'preparando'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor total deve ser positivo']
  },
  observations: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  },
  estimatedTime: {
    type: Number,
    min: [1, 'Tempo estimado deve ser pelo menos 1 minuto'],
    max: [300, 'Tempo estimado não pode exceder 300 minutos']
  },
  isMarkedByReceptionist: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para performance
OrderSchema.index({ tableId: 1, status: 1 });
OrderSchema.index({ waiterId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

// Middleware pré-save para calcular o total automaticamente
OrderSchema.pre<IOrder>('save', function(next) {
  // Recalcular o preço total de cada item
  this.items.forEach((item: IOrderItem) => {
    if (typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
      item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
    }
  });
  
  // Calcular o valor total do pedido
  this.totalAmount = this.calculateTotal();
  
  next();
});

// Método para calcular o total do pedido
OrderSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total: number, item: IOrderItem) => {
    return total + (item.totalPrice || 0);
  }, 0);
};

// Método para atualizar o status
OrderSchema.methods.updateStatus = function(newStatus: IOrder['status']): Promise<IOrder> {
  this.status = newStatus;
  
  // Se marcado como pronto pelo recepcionista
  if (newStatus === 'pronto') {
    this.isMarkedByReceptionist = true;
  }
  
  return this.save();
};

// Método para adicionar item
OrderSchema.methods.addItem = function(
  productId: string, 
  productName: string, 
  quantity: number, 
  unitPrice: number, 
  observations?: string
): void {
  const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
  
  this.items.push({
    productId: new mongoose.Types.ObjectId(productId),
    productName,
    quantity,
    unitPrice,
    totalPrice,
    observations
  });
  
  this.totalAmount = this.calculateTotal();
};

// Método para remover item
OrderSchema.methods.removeItem = function(productId: string): void {
  this.items = this.items.filter((item: IOrderItem) => 
    item.productId.toString() !== productId
  );
  this.totalAmount = this.calculateTotal();
};

// Virtual para status formatado
OrderSchema.virtual('statusFormatted').get(function() {
  const statusMap: Record<string, string> = {
    'preparando': 'Preparando',
    'pronto': 'Pronto',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado'
  };
  const status = this.status as string;
  return statusMap[status] || status;
});

// Virtual para valor total formatado
OrderSchema.virtual('totalAmountFormatted').get(function() {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.totalAmount);
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema); 