const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCreateOrder() {
  console.log('🚀 Testando criação de pedido detalhada...');
  
  try {
    // 1. Login primeiro
    const loginResult = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@recantoverde.com',
      password: 'admin123'
    });

    if (!loginResult.data.success) {
      console.log('❌ Erro no login:', loginResult.data.error);
      return;
    }

    const token = loginResult.data.data.token;
    console.log('✅ Login realizado com sucesso');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Buscar uma mesa disponível
    const tablesResult = await axios.get(`${API_BASE_URL}/tables`, { headers });
    
    if (!tablesResult.data.success || tablesResult.data.data.tables.length === 0) {
      console.log('❌ Nenhuma mesa encontrada');
      return;
    }

    const table = tablesResult.data.data.tables[0];
    console.log(`✅ Mesa encontrada: ${table.number} (${table.status})`);

    // 3. Ocupar a mesa se necessário
    if (table.status !== 'ocupada') {
      const occupyResult = await axios.put(`${API_BASE_URL}/tables/${table._id}`, {
        status: 'ocupada',
        currentCustomers: 2
      }, { headers });

      if (!occupyResult.data.success) {
        console.log('❌ Erro ao ocupar mesa:', occupyResult.data.error);
        return;
      }
      console.log('✅ Mesa ocupada com sucesso');
    }

    // 4. Buscar produtos
    const productsResult = await axios.get(`${API_BASE_URL}/products`, { headers });
    
    if (!productsResult.data.success || productsResult.data.data.products.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }

    const products = productsResult.data.data.products.slice(0, 2);
    console.log(`✅ Produtos encontrados: ${products.length}`);
    
    products.forEach(p => {
      console.log(`  - ${p.name}: R$ ${p.price} (ID: ${p._id})`);
    });

    // 5. Criar pedido
    const orderData = {
      tableId: table._id,
      items: products.map(product => ({
        productId: product._id,
        quantity: 1,
        observations: 'Teste de criação'
      })),
      observations: 'Pedido de teste detalhado'
    };

    console.log('\n📋 Dados do pedido:');
    console.log(JSON.stringify(orderData, null, 2));

    const createOrderResult = await axios.post(`${API_BASE_URL}/orders`, orderData, { headers });
    
    if (createOrderResult.data.success) {
      console.log('\n✅ Pedido criado com sucesso!');
      console.log(`💰 Total: R$ ${createOrderResult.data.data.order.totalAmount}`);
      console.log(`🍽️ Itens: ${createOrderResult.data.data.order.items.length}`);
    } else {
      console.log('\n❌ Erro ao criar pedido:');
      console.log('Error:', createOrderResult.data.error);
      if (createOrderResult.data.details) {
        console.log('Details:', JSON.stringify(createOrderResult.data.details, null, 2));
      }
    }

    // 6. Limpar: liberar mesa
    await axios.put(`${API_BASE_URL}/tables/${table._id}`, {
      status: 'disponivel'
    }, { headers });
    console.log('✅ Mesa liberada');

  } catch (error) {
    console.log('\n❌ Erro durante teste:');
    if (error.response && error.response.data) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data.error);
      if (error.response.data.details) {
        console.log('Details:', JSON.stringify(error.response.data.details, null, 2));
      }
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testCreateOrder(); 