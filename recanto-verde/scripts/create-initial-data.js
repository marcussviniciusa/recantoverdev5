const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

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
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Verificar se já existem usuários
    const existingUsers = await usersCollection.find().toArray();
    if (existingUsers.length > 0) {
      console.log('⚠️  Usuários já existem no banco de dados');
      return;
    }

    // Hash das senhas
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const garcomPasswordHash = await bcrypt.hash('garcom123', 10);

    const users = [
      {
        username: 'admin',
        email: 'admin@recantoverde.com',
        password: adminPasswordHash,
        role: 'recepcionista',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'joao',
        email: 'joao@recantoverde.com',
        password: garcomPasswordHash,
        role: 'garcom',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'maria',
        email: 'maria@recantoverde.com',
        password: garcomPasswordHash,
        role: 'garcom',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await usersCollection.insertMany(users);
    console.log('✅ Usuários criados com sucesso');
    console.log('👨‍💼 Admin: admin@recantoverde.com / admin123');
    console.log('👨‍🍳 Garçom João: joao@recantoverde.com / garcom123');
    console.log('👩‍🍳 Garçom Maria: maria@recantoverde.com / garcom123');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  }
}

async function createInitialTables() {
  console.log('\n🪑 Criando mesas iniciais...');
  
  try {
    const tablesCollection = mongoose.connection.db.collection('tables');
    
    // Verificar se já existem mesas
    const existingTables = await tablesCollection.find().toArray();
    if (existingTables.length > 0) {
      console.log('⚠️  Mesas já existem no banco de dados');
      return;
    }

    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: 'disponivel',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await tablesCollection.insertMany(tables);
    console.log('✅ 10 mesas criadas com sucesso');

  } catch (error) {
    console.error('❌ Erro ao criar mesas:', error);
  }
}

async function createInitialProducts() {
  console.log('\n🍽️ Criando produtos iniciais...');
  
  try {
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Verificar se já existem produtos
    const existingProducts = await productsCollection.find().toArray();
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
        preparationTime: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Carpaccio de Carne',
        description: 'Fatias finas de carne bovina com rúcula e parmesão',
        price: 32.90,
        category: 'entradas',
        available: true,
        preparationTime: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Pratos Principais
      {
        name: 'Salmão Grelhado',
        description: 'Salmão grelhado com legumes e molho de ervas',
        price: 45.90,
        category: 'pratos-principais',
        available: true,
        preparationTime: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Risotto de Camarão',
        description: 'Risotto cremoso com camarões frescos e açafrão',
        price: 38.90,
        category: 'pratos-principais',
        available: true,
        preparationTime: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Picanha na Chapa',
        description: 'Picanha grelhada com batatas rústicas e vinagrete',
        price: 52.90,
        category: 'carnes',
        available: true,
        preparationTime: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Massas
      {
        name: 'Lasanha à Bolonhesa',
        description: 'Lasanha tradicional com molho bolonhesa e queijos',
        price: 28.90,
        category: 'massas',
        available: true,
        preparationTime: 35,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Massa com bacon, ovos, queijo parmesão e pimenta',
        price: 26.90,
        category: 'massas',
        available: true,
        preparationTime: 18,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Bebidas
      {
        name: 'Água Mineral',
        description: 'Água mineral natural sem gás - 500ml',
        price: 4.50,
        category: 'bebidas',
        available: true,
        preparationTime: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Refrigerante Lata',
        description: 'Coca-Cola, Guaraná ou Fanta - 350ml',
        price: 6.90,
        category: 'bebidas',
        available: true,
        preparationTime: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Suco Natural',
        description: 'Suco natural de laranja, limão ou maracujá',
        price: 8.90,
        category: 'bebidas',
        available: true,
        preparationTime: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Sobremesas
      {
        name: 'Tiramisu',
        description: 'Sobremesa italiana com café e mascarpone',
        price: 16.90,
        category: 'sobremesas',
        available: true,
        preparationTime: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Petit Gateau',
        description: 'Bolinho de chocolate quente com sorvete de baunilha',
        price: 19.90,
        category: 'sobremesas',
        available: true,
        preparationTime: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await productsCollection.insertMany(products);
    console.log(`✅ ${products.length} produtos criados com sucesso`);

  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando configuração inicial do banco de dados...');
  
  await connectDB();
  await createInitialUsers();
  await createInitialTables();
  await createInitialProducts();
  
  console.log('\n✨ Configuração inicial concluída!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('👨‍💼 Admin: admin@recantoverde.com / admin123');
  console.log('👨‍🍳 Garçom João: joao@recantoverde.com / garcom123');
  console.log('👩‍🍳 Garçom Maria: maria@recantoverde.com / garcom123');
  
  await mongoose.disconnect();
  console.log('\n✅ Desconectado do banco de dados');
}

main().catch(error => {
  console.error('❌ Erro na execução:', error);
  process.exit(1);
}); 