const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrado no .env.local');
  process.exit(1);
}

async function testConnection() {
  console.log('🔌 Testando conexão com MongoDB...');
  console.log('📍 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Esconder credenciais no log
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar algumas operações básicas
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections encontradas:', collections.map(c => c.name));
    
    // Verificar se as collections principais existem
    const collectionNames = collections.map(c => c.name);
    const expectedCollections = ['users', 'tables', 'products', 'orders', 'payments'];
    
    console.log('\n📊 Status das collections:');
    for (const collection of expectedCollections) {
      const exists = collectionNames.includes(collection);
      console.log(`${exists ? '✅' : '❌'} ${collection}: ${exists ? 'existe' : 'não existe'}`);
      
      if (exists) {
        const count = await mongoose.connection.db.collection(collection).countDocuments();
        console.log(`   📄 Documentos: ${count}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

testConnection(); 