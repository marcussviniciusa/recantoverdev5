import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod {
  type: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'outro';
  amount: number;
  description?: string;
}

export interface IPayment extends Document {
  tableId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  totalAmount: number;
  paymentMethods: IPaymentMethod[];
  status: 'pendente' | 'pago' | 'cancelado';
  paidAmount: number;
  remainingAmount: number;
  changeAmount?: number;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  calculatePaidAmount(): number;
  calculateRemainingAmount(): number;
  addPaymentMethod(type: IPaymentMethod['type'], amount: number, description?: string): void;
  removePaymentMethod(index: number): void;
  markAsPaid(): Promise<IPayment>;
}

const PaymentMethodSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Tipo de pagamento é obrigatório'],
    enum: {
      values: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'outro'],
      message: 'Tipo de pagamento inválido'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0.01, 'Valor deve ser maior que zero']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [100, 'Descrição não pode ter mais de 100 caracteres']
  }
}, { _id: false });

const PaymentSchema = new Schema<IPayment>({
  tableId: {
    type: Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'ID da mesa é obrigatório']
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'ID do pedido é obrigatório']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0.01, 'Valor total deve ser maior que zero']
  },
  paymentMethods: {
    type: [PaymentMethodSchema],
    required: [true, 'Métodos de pagamento são obrigatórios'],
    validate: {
      validator: function(methods: IPaymentMethod[]) {
        return methods && methods.length > 0;
      },
      message: 'Deve ter pelo menos um método de pagamento'
    }
  },
  status: {
    type: String,
    enum: ['pendente', 'pago', 'cancelado'],
    default: 'pendente'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Valor pago não pode ser negativo']
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Valor restante não pode ser negativo']
  },
  changeAmount: {
    type: Number,
    min: [0, 'Valor do troco não pode ser negativo']
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para performance
PaymentSchema.index({ tableId: 1, status: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ createdAt: -1 });

// Middleware pré-save para calcular valores automaticamente
PaymentSchema.pre<IPayment>('save', function(next) {
  // Calcular valor pago total
  this.paidAmount = this.calculatePaidAmount();
  
  // Calcular valor restante
  this.remainingAmount = this.calculateRemainingAmount();
  
  // Calcular troco se o valor pago for maior que o total
  if (this.paidAmount > this.totalAmount) {
    this.changeAmount = Math.round((this.paidAmount - this.totalAmount) * 100) / 100;
  } else {
    this.changeAmount = 0;
  }
  
  // Se o valor pago for igual ou maior que o total, marcar como pago
  if (this.paidAmount >= this.totalAmount && this.status === 'pendente') {
    this.status = 'pago';
    if (!this.paidAt) {
      this.paidAt = new Date();
    }
  }
  
  next();
});

// Método para calcular valor pago total
PaymentSchema.methods.calculatePaidAmount = function(): number {
  return this.paymentMethods.reduce((total: number, method: IPaymentMethod) => {
    return total + (method.amount || 0);
  }, 0);
};

// Método para calcular valor restante
PaymentSchema.methods.calculateRemainingAmount = function(): number {
  const remaining = this.totalAmount - this.calculatePaidAmount();
  return Math.max(0, Math.round(remaining * 100) / 100);
};

// Método para adicionar método de pagamento
PaymentSchema.methods.addPaymentMethod = function(
  type: IPaymentMethod['type'], 
  amount: number, 
  description?: string
): void {
  this.paymentMethods.push({
    type,
    amount: Math.round(amount * 100) / 100,
    description
  });
};

// Método para remover método de pagamento
PaymentSchema.methods.removePaymentMethod = function(index: number): void {
  if (index >= 0 && index < this.paymentMethods.length) {
    this.paymentMethods.splice(index, 1);
  }
};

// Método para marcar como pago
PaymentSchema.methods.markAsPaid = function(): Promise<IPayment> {
  this.status = 'pago';
  this.paidAt = new Date();
  return this.save();
};

// Virtual para status formatado
PaymentSchema.virtual('statusFormatted').get(function() {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'pago': 'Pago',
    'cancelado': 'Cancelado'
  };
  const status = this.status as string;
  return statusMap[status] || status;
});

// Virtual para valor total formatado
PaymentSchema.virtual('totalAmountFormatted').get(function() {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.totalAmount);
});

// Virtual para valor pago formatado
PaymentSchema.virtual('paidAmountFormatted').get(function() {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.paidAmount);
});

// Virtual para valor restante formatado
PaymentSchema.virtual('remainingAmountFormatted').get(function() {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.remainingAmount);
});

// Virtual para valor do troco formatado
PaymentSchema.virtual('changeAmountFormatted').get(function() {
  if (!this.changeAmount) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.changeAmount);
});

// Virtual para métodos de pagamento formatados
PaymentSchema.virtual('paymentMethodsFormatted').get(function() {
  const typeMap: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'pix': 'PIX',
    'outro': 'Outro'
  };
  
  return this.paymentMethods.map((method: IPaymentMethod) => ({
    ...method,
    typeFormatted: typeMap[method.type] || method.type,
    amountFormatted: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(method.amount)
  }));
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema); 