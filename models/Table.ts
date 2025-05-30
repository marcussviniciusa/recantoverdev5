import mongoose, { Schema, Document } from 'mongoose';

export interface ITable extends Document {
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
  currentCustomers?: number;
  identification?: string;
  openedAt?: Date;
  closedAt?: Date;
  assignedWaiter?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>({
  number: {
    type: Number,
    required: [true, 'Número da mesa é obrigatório'],
    unique: true,
    min: [1, 'Número da mesa deve ser maior que 0']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacidade da mesa é obrigatória'],
    min: [1, 'Capacidade deve ser pelo menos 1'],
    max: [20, 'Capacidade máxima é 20 pessoas']
  },
  status: {
    type: String,
    enum: ['disponivel', 'ocupada', 'reservada', 'manutencao'],
    default: 'disponivel'
  },
  currentCustomers: {
    type: Number,
    min: [0, 'Número de clientes não pode ser negativo'],
    validate: {
      validator: function(this: ITable, value: number) {
        return !value || value <= this.capacity;
      },
      message: 'Número de clientes não pode exceder a capacidade da mesa'
    }
  },
  identification: {
    type: String,
    trim: true,
    maxlength: [100, 'Identificação não pode ter mais de 100 caracteres']
  },
  openedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  assignedWaiter: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para performance (number já tem índice único automático)
TableSchema.index({ status: 1 });
TableSchema.index({ assignedWaiter: 1 });

// Middleware para validar status
TableSchema.pre('save', function(next) {
  // Se a mesa está sendo ocupada, deve ter openedAt
  if (this.status === 'ocupada' && !this.openedAt) {
    this.openedAt = new Date();
  }
  
  // Se a mesa está sendo liberada, deve ter closedAt
  if (this.status === 'disponivel' && this.isModified('status')) {
    this.closedAt = new Date();
    this.currentCustomers = undefined;
    this.identification = undefined;
    this.assignedWaiter = undefined;
  }
  
  next();
});

// Método para abrir mesa
TableSchema.methods.openTable = function(customersCount: number, waiterId: string, identification?: string) {
  this.status = 'ocupada';
  this.currentCustomers = customersCount;
  this.assignedWaiter = waiterId;
  this.identification = identification;
  this.openedAt = new Date();
  this.closedAt = undefined;
  return this.save();
};

// Método para fechar mesa
TableSchema.methods.closeTable = function() {
  this.status = 'disponivel';
  this.currentCustomers = undefined;
  this.identification = undefined;
  this.assignedWaiter = undefined;
  this.closedAt = new Date();
  return this.save();
};

export default mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema); 