const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

let adminToken = '';
let garcomToken = '';
let garcomUserId = '';

// Função para fazer requests autenticados
const authenticatedRequest = async (method, url, data = null, token = adminToken) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

async function loginUsers() {
  console.log('🔐 Fazendo login dos usuários...');
  
  // Login do admin
  const adminLogin = await authenticatedRequest('POST', '/auth/login', {
    email: 'admin@recantoverde.com',
    password: 'admin123'
  }, '');
  
  if (adminLogin.success) {
    adminToken = adminLogin.data.token;
    console.log('✅ Admin logado com sucesso');
  } else {
    throw new Error('Falha no login do admin');
  }

  // Login do garçom
  const garcomLogin = await authenticatedRequest('POST', '/auth/login', {
    email: 'joao@recantoverde.com',
    password: 'garcom123'
  }, '');
  
  if (garcomLogin.success) {
    garcomToken = garcomLogin.data.token;
    garcomUserId = garcomLogin.data.user.id;
    console.log('✅ Garçom João logado com sucesso');
  } else {
    throw new Error('Falha no login do garçom');
  }
  
  return { adminLogin, garcomLogin };
}

async function demonstrateTableManagement() {
  console.log('\n🪑 === DEMONSTRAÇÃO - GERENCIAMENTO DE MESAS ===');
  
  // Listar mesas
  const tables = await authenticatedRequest('GET', '/tables');
  console.log(`📋 Total de mesas: ${tables.data.tables.length}`);
  
  // Pegar uma mesa para demonstração
  const table = tables.data.tables[0];
  console.log(`🎯 Selecionada Mesa ${table.number} para demonstração`);
  
  // Abrir mesa com garçom
  const openTable = await authenticatedRequest('PUT', `/tables/${table._id}`, {
    status: 'ocupada',
    currentCustomers: 3,
    assignedWaiter: garcomUserId
  });
  
  if (openTable.success) {
    console.log(`✅ Mesa ${table.number} aberta com 3 clientes e garçom atribuído`);
  }
  
  return table;
}

async function demonstrateMenuManagement() {
  console.log('\n🍽️ === DEMONSTRAÇÃO - CARDÁPIO ===');
  
  // Listar categorias
  const categories = await authenticatedRequest('GET', '/products/categories');
  console.log(`📁 Categorias disponíveis: ${categories.data.categoriesWithProducts.length}`);
  
  categories.data.categoriesWithProducts.forEach(cat => {
    console.log(`  - ${cat.name}: ${cat.availableProducts} produtos`);
  });
  
  // Listar produtos por categoria
  const bebidas = await authenticatedRequest('GET', '/products?category=bebidas');
  const entradas = await authenticatedRequest('GET', '/products?category=entradas');
  const pratos = await authenticatedRequest('GET', '/products?category=pratos-principais');
  
  console.log(`🥤 Bebidas disponíveis: ${bebidas.data.products.length}`);
  console.log(`🥗 Entradas disponíveis: ${entradas.data.products.length}`);
  console.log(`🍽️ Pratos principais disponíveis: ${pratos.data.products.length}`);
  
  return {
    bebidas: bebidas.data.products,
    entradas: entradas.data.products,
    pratos: pratos.data.products
  };
}

async function demonstrateOrderFlow(table, products) {
  console.log('\n📋 === DEMONSTRAÇÃO - FLUXO DE PEDIDOS ===');
  
  // Garçom cria um pedido
  const orderData = {
    tableId: table._id,
    items: [
      {
        productId: products.bebidas[0]._id,
        quantity: 2,
        observations: 'Sem gelo'
      },
      {
        productId: products.entradas[0]._id,
        quantity: 1,
        observations: 'Sem cebola'
      },
      {
        productId: products.pratos[0]._id,
        quantity: 1
      }
    ],
    observations: 'Cliente tem alergia a frutos do mar'
  };
  
  console.log('🍴 Garçom criando pedido...');
  const order = await authenticatedRequest('POST', '/orders', orderData, garcomToken);
  
  if (order.success) {
    console.log(`✅ Pedido criado! Total: R$ ${order.data.order.totalAmount}`);
    console.log(`⏱️ Tempo estimado: ${order.data.order.estimatedTime || 'N/A'} minutos`);
    console.log(`🍽️ Itens no pedido: ${order.data.order.items.length}`);
    
    order.data.order.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.productName} x${item.quantity} = R$ ${item.totalPrice}`);
      if (item.observations) {
        console.log(`     Obs: ${item.observations}`);
      }
    });
  } else {
    console.log('❌ Erro ao criar pedido:', order.error);
    return null;
  }
  
  // Recepcionista marca como pronto
  console.log('\n👨‍💼 Recepcionista marcando pedido como pronto...');
  const updateStatus = await authenticatedRequest('PUT', `/orders/${order.data.order._id}`, {
    status: 'pronto',
    isMarkedByReceptionist: true
  });
  
  if (updateStatus.success) {
    console.log('✅ Pedido marcado como pronto pelo recepcionista');
  }
  
  // Garçom marca como entregue
  console.log('\n🚶‍♂️ Garçom entregando pedido...');
  const deliverOrder = await authenticatedRequest('PUT', `/orders/${order.data.order._id}`, {
    status: 'entregue'
  }, garcomToken);
  
  if (deliverOrder.success) {
    console.log('✅ Pedido marcado como entregue pelo garçom');
  }
  
  return order.data.order;
}

async function demonstratePaymentFlow(table, order) {
  console.log('\n💳 === DEMONSTRAÇÃO - PAGAMENTO ===');
  
  // Criar pagamento com divisão de métodos
  const paymentData = {
    tableId: table._id,
    orderId: order._id,
    totalAmount: order.totalAmount,
    paymentMethods: [
      {
        type: 'cartao_credito',
        amount: Math.round(order.totalAmount * 0.6 * 100) / 100,
        description: 'Cartão Visa terminado em 1234'
      },
      {
        type: 'dinheiro',
        amount: Math.round(order.totalAmount * 0.4 * 100) / 100,
        description: 'Dinheiro em espécie'
      }
    ]
  };
  
  console.log('💰 Processando pagamento...');
  console.log(`💵 Total da conta: R$ ${order.totalAmount}`);
  console.log(`💳 Cartão de Crédito: R$ ${paymentData.paymentMethods[0].amount}`);
  console.log(`💵 Dinheiro: R$ ${paymentData.paymentMethods[1].amount}`);
  
  const payment = await authenticatedRequest('POST', '/payments', paymentData);
  
  if (payment.success) {
    console.log('✅ Pagamento registrado com sucesso!');
    console.log(`📊 Status: ${payment.data.payment.status}`);
    console.log(`💰 Valor pago: R$ ${payment.data.payment.paidAmount}`);
    console.log(`💴 Valor restante: R$ ${payment.data.payment.remainingAmount}`);
    
    if (payment.data.payment.changeAmount > 0) {
      console.log(`💱 Troco: R$ ${payment.data.payment.changeAmount}`);
    }
  } else {
    console.log('❌ Erro ao processar pagamento:', payment.error);
  }
  
  return payment.data?.payment;
}

async function demonstrateReporting() {
  console.log('\n📊 === DEMONSTRAÇÃO - RELATÓRIOS ===');
  
  // Listar todos os pedidos
  const allOrders = await authenticatedRequest('GET', '/orders');
  console.log(`📋 Total de pedidos: ${allOrders.data.orders.length}`);
  
  // Contar por status
  const statusCount = allOrders.data.orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📈 Pedidos por status:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
  
  // Listar todos os pagamentos
  const allPayments = await authenticatedRequest('GET', '/payments');
  console.log(`💳 Total de pagamentos: ${allPayments.data.payments.length}`);
  
  // Calcular total faturado
  const totalRevenue = allPayments.data.payments
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  
  console.log(`💰 Total faturado: R$ ${totalRevenue.toFixed(2)}`);
}

async function cleanupDemo(table) {
  console.log('\n🧹 === LIMPEZA DA DEMONSTRAÇÃO ===');
  
  // Liberar a mesa
  const closeTable = await authenticatedRequest('PUT', `/tables/${table._id}`, {
    status: 'disponivel'
  });
  
  if (closeTable.success) {
    console.log(`✅ Mesa ${table.number} liberada`);
  }
  
  console.log('🎉 Demonstração concluída!');
}

async function runCompleteDemo() {
  try {
    console.log('🚀 INICIANDO DEMONSTRAÇÃO COMPLETA DO SISTEMA RECANTO VERDE');
    console.log('=' * 60);
    
    const loginData = await loginUsers();
    
    const table = await demonstrateTableManagement();
    const products = await demonstrateMenuManagement();
    const order = await demonstrateOrderFlow(table, products);
    
    if (order) {
      const payment = await demonstratePaymentFlow(table, order);
    }
    
    await demonstrateReporting();
    await cleanupDemo(table);
    
    console.log('\n' + '=' * 60);
    console.log('✨ DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO! ✨');
    console.log('🎯 Todas as funcionalidades principais foram testadas');
    console.log('📱 Sistema pronto para desenvolvimento do frontend');
    
  } catch (error) {
    console.error('\n❌ Erro durante demonstração:', error.message);
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}`);
    return true;
  } catch (error) {
    console.log('❌ Servidor não está rodando. Execute "npm run dev" primeiro.');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runCompleteDemo();
  }
}

main().catch(error => {
  console.error('❌ Erro durante execução da demonstração:', error.message);
}); 