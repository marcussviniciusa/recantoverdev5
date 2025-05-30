#!/usr/bin/env node

/**
 * 🗑️ Script para resetar completamente o banco de dados
 * 
 * Este script remove TODOS os dados do banco MongoDB.
 * Use apenas quando quiser começar do zero.
 * 
 * Uso: node reset-database.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrado no .env.local');
  console.log('📋 Crie o arquivo .env.local com:');
  console.log('MONGODB_URI=mongodb://localhost:27017/recanto-verde');
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

async function resetDatabase() {
  console.log('🗑️ Resetando banco de dados...');
  
  try {
    const db = mongoose.connection.db;
    
    // Listar todas as coleções
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️ Banco de dados já está vazio');
      return;
    }
    
    console.log(`📋 Encontradas ${collections.length} coleções:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Confirmar antes de deletar
    console.log('\n⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS OS DADOS!');
    console.log('💾 Certifique-se de fazer backup se necessário.');
    
    // Em ambiente de produção, adicione uma confirmação interativa aqui
    // Por simplicidade, vamos continuar automaticamente em desenvolvimento
    
    // Deletar todas as coleções
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`🗑️ Coleção '${collection.name}' removida`);
    }
    
    console.log('\n✅ Banco de dados resetado com sucesso!');
    console.log('🚀 O sistema agora está completamente limpo');
    console.log('👤 Acesse o sistema e crie o primeiro usuário recepcionista');
    
  } catch (error) {
    console.error('❌ Erro ao resetar banco de dados:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando reset do banco de dados...');
  console.log(`🔗 Conectando em: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  
  await connectDB();
  await resetDatabase();
  
  await mongoose.disconnect();
  console.log('\n✅ Desconectado do banco de dados');
  console.log('🎯 Reset concluído!');
}

main().catch(error => {
  console.error('❌ Erro na execução:', error);
  process.exit(1);
}); 