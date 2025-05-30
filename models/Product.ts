import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  preparationTime?: number; // em minutos
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  isAvailable(): boolean;
  formatPrice(): string;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Nome do produto é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço deve ser maior que zero']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: {
      values: [
        'entradas',
        'pratos-principais',
        'sobremesas',
        'bebidas',
        'petiscos',
        'saladas',
        'massas',
        'carnes',
        'frutos-mar',
        'vegetariano',
        'vegano'
      ],
      message: 'Categoria inválida'
    }
  },
  image: {
    type: String,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    min: [1, 'Tempo de preparo deve ser pelo menos 1 minuto'],
    max: [180, 'Tempo de preparo não pode exceder 180 minutos']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true,
    enum: {
      values: [
        'gluten',
        'lactose',
        'ovo',
        'soja',
        'amendoim',
        'castanhas',
        'peixes',
        'crustaceos',
        'sementes-sesamo'
      ],
      message: 'Alérgeno inválido'
    }
  }],
  nutritionalInfo: {
    calories: {
      type: Number,
      min: [0, 'Calorias devem ser positivas']
    },
    protein: {
      type: Number,
      min: [0, 'Proteína deve ser positiva']
    },
    carbs: {
      type: Number,
      min: [0, 'Carboidratos devem ser positivos']
    },
    fat: {
      type: Number,
      min: [0, 'Gordura deve ser positiva']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para performance
ProductSchema.index({ category: 1, available: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Métodos de instância
ProductSchema.methods.isAvailable = function(): boolean {
  return this.available;
};

ProductSchema.methods.formatPrice = function(): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.price);
};

// Middleware pré-save
ProductSchema.pre<IProduct>('save', function(next) {
  // Capitalizar primeira letra do nome
  if (this.name && typeof this.name === 'string') {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  
  // Garantir que o preço tenha no máximo 2 casas decimais
  if (this.price && typeof this.price === 'number') {
    this.price = Math.round(this.price * 100) / 100;
  }
  
  next();
});

// Virtual para categoria formatada
ProductSchema.virtual('categoryFormatted').get(function() {
  const categories: Record<string, string> = {
    'entradas': 'Entradas',
    'pratos-principais': 'Pratos Principais',
    'sobremesas': 'Sobremesas',
    'bebidas': 'Bebidas',
    'petiscos': 'Petiscos',
    'saladas': 'Saladas',
    'massas': 'Massas',
    'carnes': 'Carnes',
    'frutos-mar': 'Frutos do Mar',
    'vegetariano': 'Vegetariano',
    'vegano': 'Vegano'
  };
  const category = this.category as string;
  return categories[category] || category;
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema); 