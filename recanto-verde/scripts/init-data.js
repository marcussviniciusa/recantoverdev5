const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Importar models
const User = require('../models/User').default;
const Table = require('../models/Table').default;
const Product = require('../models/Product').default;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrado no .env.local');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

async function createInitialUsers() {
  console.log('\n📋 Criando usuários iniciais...');
  
  try {
    // Verificar se já existem usuários
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log('⚠️  Usuários já existem no banco de dados');
      return;
    }

    // Criar recepcionista admin
    const admin = new User({
      username: 'admin',
      email: 'admin@recantoVerde.com',
      password: 'admin123',
      role: 'recepcionista',
      isActive: true
    });

    await admin.save();
    console.log('✅ Recepcionista admin criado: admin@recantoVerde.com / admin123');

    // Criar alguns garçons
    const garcons = [
      {
        username: 'joao',
        email: 'joao@recantoVerde.com',
        password: 'garcom123',
        role: 'garcom',
        isActive: true
      },
      {
        username: 'maria',
        email: 'maria@recantoVerde.com',
        password: 'garcom123',
        role: 'garcom',
        isActive: true
      }
    ];

    for (const garcomData of garcons) {
      const garcom = new User(garcomData);
      await garcom.save();
      console.log(`✅ Garçom criado: ${garcomData.email} / garcom123`);
    }

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  }
}

async function createInitialTables() {
  console.log('\n🪑 Criando mesas iniciais...');
  
  try {
    // Verificar se já existem mesas
    const existingTables = await Table.find();
    if (existingTables.length > 0) {
      console.log('⚠️  Mesas já existem no banco de dados');
      return;
    }

    // Criar 10 mesas
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6, // Mesas 1-4: 2 pessoas, 5-8: 4 pessoas, 9-10: 6 pessoas
        status: 'disponivel'
      });
    }

    await Table.insertMany(tables);
    console.log('✅ 10 mesas criadas com sucesso');

  } catch (error) {
    console.error('❌ Erro ao criar mesas:', error);
  }
}

async function createInitialProducts() {
  console.log('\n🍽️ Criando produtos iniciais...');
  
  try {
    // Verificar se já existem produtos
    const existingProducts = await Product.find();
    if (existingProducts.length > 0) {
      console.log('⚠️  Produtos já existem no banco de dados');
      return;
    }

    const products = [
      // Entradas
      {
        name: 'Bruschetta Tradicional',
        description: 'Pão italiano com tomate fresco, manjericão e azeite',
        price: 18.90,
        category: 'entradas',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Carpaccio de Carne',
        description: 'Fatias finas de carne bovina com rúcula e parmesão',
        price: 32.90,
        category: 'entradas',
        available: true,
        preparationTime: 15
      },

      // Pratos Principais
      {
        name: 'Salmão Grelhado',
        description: 'Salmão grelhado com legumes e molho de ervas',
        price: 45.90,
        category: 'pratos-principais',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Risotto de Camarão',
        description: 'Risotto cremoso com camarões frescos e açafrão',
        price: 38.90,
        category: 'pratos-principais',
        available: true,
        preparationTime: 30
      },
      {
        name: 'Picanha na Chapa',
        description: 'Picanha grelhada com batatas rústicas e vinagrete',
        price: 52.90,
        category: 'carnes',
        available: true,
        preparationTime: 20
      },

      // Massas
      {
        name: 'Lasanha à Bolonhesa',
        description: 'Lasanha tradicional com molho bolonhesa e queijos',
        price: 28.90,
        category: 'massas',
        available: true,
        preparationTime: 35
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Massa com bacon, ovos, queijo parmesão e pimenta',
        price: 26.90,
        category: 'massas',
        available: true,
        preparationTime: 18
      },

      // Bebidas
      {
        name: 'Água Mineral',
        description: 'Água mineral natural sem gás - 500ml',
        price: 4.50,
        category: 'bebidas',
        available: true,
        preparationTime: 2
      },
      {
        name: 'Refrigerante Lata',
        description: 'Coca-Cola, Guaraná ou Fanta - 350ml',
        price: 6.90,
        category: 'bebidas',
        available: true,
        preparationTime: 2
      },
      {
        name: 'Suco Natural',
        description: 'Suco natural de laranja, limão ou maracujá',
        price: 8.90,
        category: 'bebidas',
        available: true,
        preparationTime: 5
      },

      // Sobremesas
      {
        name: 'Tiramisu',
        description: 'Sobremesa italiana com café e mascarpone',
        price: 16.90,
        category: 'sobremesas',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Petit Gateau',
        description: 'Bolinho de chocolate quente com sorvete de baunilha',
        price: 19.90,
        category: 'sobremesas',
        available: true,
        preparationTime: 12
      }
    ];

    await Product.insertMany(products);
    console.log(`✅ ${products.length} produtos criados com sucesso`);

  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando configuração do banco de dados...');
  
  await connectDB();
  await createInitialUsers();
  await createInitialTables();
  await createInitialProducts();
  
  console.log('\n✨ Configuração inicial concluída!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('👨‍💼 Admin: admin@recantoVerde.com / admin123');
  console.log('👨‍🍳 Garçom João: joao@recantoVerde.com / garcom123');
  console.log('👩‍🍳 Garçom Maria: maria@recantoVerde.com / garcom123');
  
  await mongoose.disconnect();
  console.log('\n✅ Desconectado do banco de dados');
}

main().catch(error => {
  console.error('❌ Erro na execução:', error);
  process.exit(1);
}); 