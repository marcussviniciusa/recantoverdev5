const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

let authToken = '';

// Função para fazer requests autenticados
const authenticatedRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
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

async function testLogin() {
  console.log('\n🔐 Testando Login...');
  
  try {
    // Teste com credenciais corretas (admin)
    const loginData = {
      email: 'admin@recantoverde.com',
      password: 'admin123'
    };

    const result = await authenticatedRequest('POST', '/auth/login', loginData);
    
    if (result.success) {
      authToken = result.data.token;
      console.log('✅ Login realizado com sucesso');
      console.log(`👤 Usuário: ${result.data.user.username} (${result.data.user.role})`);
      return true;
    } else {
      console.log('❌ Erro no login:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de login:', error.message);
    return false;
  }
}

async function testAuthMe() {
  console.log('\n🔍 Testando verificação de autenticação...');
  
  try {
    const result = await authenticatedRequest('GET', '/auth/me');
    
    if (result.success) {
      console.log('✅ Usuário autenticado verificado');
      console.log(`👤 Dados: ${result.data.user.username} - ${result.data.user.email}`);
      return true;
    } else {
      console.log('❌ Erro na verificação:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de autenticação:', error.message);
    return false;
  }
}

async function testTables() {
  console.log('\n🪑 Testando APIs de Mesas...');
  
  try {
    // Listar mesas
    const tablesResult = await authenticatedRequest('GET', '/tables');
    
    if (tablesResult.success) {
      console.log(`✅ Mesas listadas: ${tablesResult.data.tables.length} encontradas`);
      
      if (tablesResult.data.tables.length > 0) {
        const firstTable = tablesResult.data.tables[0];
        console.log(`📋 Primeira mesa: Mesa ${firstTable.number} (${firstTable.capacity} pessoas) - ${firstTable.status}`);
        
        // Testar buscar mesa específica
        const tableResult = await authenticatedRequest('GET', `/tables/${firstTable._id}`);
        if (tableResult.success) {
          console.log('✅ Mesa específica recuperada');
        } else {
          console.log('❌ Erro ao buscar mesa específica:', tableResult.error);
        }
        
        return true;
      }
    } else {
      console.log('❌ Erro ao listar mesas:', tablesResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de mesas:', error.message);
    return false;
  }
}

async function testProducts() {
  console.log('\n🍽️ Testando APIs de Produtos...');
  
  try {
    // Listar produtos
    const productsResult = await authenticatedRequest('GET', '/products');
    
    if (productsResult.success) {
      console.log(`✅ Produtos listados: ${productsResult.data.products.length} encontrados`);
      
      // Listar categorias
      const categoriesResult = await authenticatedRequest('GET', '/products/categories');
      if (categoriesResult.success) {
        console.log(`✅ Categorias listadas: ${categoriesResult.data.categoriesWithProducts.length} com produtos`);
        
        // Mostrar algumas categorias
        categoriesResult.data.categoriesWithProducts.slice(0, 3).forEach(cat => {
          console.log(`  📁 ${cat.name}: ${cat.availableProducts}/${cat.totalProducts} produtos disponíveis`);
        });
      }
      
      // Testar filtro por categoria
      const filteredResult = await authenticatedRequest('GET', '/products?category=bebidas');
      if (filteredResult.success) {
        console.log(`✅ Filtro por categoria: ${filteredResult.data.products.length} bebidas encontradas`);
      }
      
      if (productsResult.data.products.length > 0) {
        const firstProduct = productsResult.data.products[0];
        console.log(`📋 Primeiro produto: ${firstProduct.name} - R$ ${firstProduct.price}`);
        
        // Testar buscar produto específico
        const productResult = await authenticatedRequest('GET', `/products/${firstProduct._id}`);
        if (productResult.success) {
          console.log('✅ Produto específico recuperado');
        } else {
          console.log('❌ Erro ao buscar produto específico:', productResult.error);
        }
      }
      
      return true;
    } else {
      console.log('❌ Erro ao listar produtos:', productsResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de produtos:', error.message);
    return false;
  }
}

async function testCreateProduct() {
  console.log('\n➕ Testando criação de produto...');
  
  try {
    const newProduct = {
      name: 'Produto Teste API',
      description: 'Produto criado via teste da API',
      price: 25.90,
      category: 'petiscos',
      available: true,
      preparationTime: 15
    };

    const result = await authenticatedRequest('POST', '/products', newProduct);
    
    if (result.success) {
      console.log('✅ Produto criado com sucesso');
      console.log(`📦 Produto: ${result.data.product.name} - R$ ${result.data.product.price}`);
      
      // Deletar o produto de teste
      const deleteResult = await authenticatedRequest('DELETE', `/products/${result.data.product._id}`);
      if (deleteResult.success) {
        console.log('✅ Produto de teste deletado');
      }
      
      return true;
    } else {
      console.log('❌ Erro ao criar produto:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de criação de produto:', error.message);
    return false;
  }
}

async function testOrders() {
  console.log('\n📋 Testando APIs de Pedidos...');
  
  try {
    // Primeiro, precisamos de uma mesa ocupada
    const tablesResult = await authenticatedRequest('GET', '/tables');
    if (!tablesResult.success || tablesResult.data.tables.length === 0) {
      console.log('❌ Não há mesas disponíveis para teste');
      return false;
    }

    const firstTable = tablesResult.data.tables[0];
    
    // Ocupar a mesa primeiro
    const occupyTableResult = await authenticatedRequest('PUT', `/tables/${firstTable._id}`, {
      status: 'ocupada',
      currentCustomers: 2
    });

    if (!occupyTableResult.success) {
      console.log('❌ Erro ao ocupar mesa para teste:', occupyTableResult.error);
      return false;
    }

    console.log(`✅ Mesa ${firstTable.number} ocupada para teste`);

    // Buscar produtos para o pedido
    const productsResult = await authenticatedRequest('GET', '/products?limit=3');
    if (!productsResult.success || productsResult.data.products.length === 0) {
      console.log('❌ Não há produtos disponíveis para teste');
      return false;
    }

    const products = productsResult.data.products.slice(0, 2);
    
    // Criar pedido de teste
    const newOrder = {
      tableId: firstTable._id,
      items: products.map(product => ({
        productId: product._id,
        quantity: 1,
        observations: 'Teste de pedido'
      })),
      observations: 'Pedido criado via teste da API'
    };

    const createOrderResult = await authenticatedRequest('POST', '/orders', newOrder);
    
    if (createOrderResult.success) {
      console.log('✅ Pedido criado com sucesso');
      console.log(`📦 Total: R$ ${createOrderResult.data.order.totalAmount}`);
      console.log(`🍽️ Itens: ${createOrderResult.data.order.items.length}`);
      
      const orderId = createOrderResult.data.order._id;
      
      // Testar buscar pedido específico
      const orderResult = await authenticatedRequest('GET', `/orders/${orderId}`);
      if (orderResult.success) {
        console.log('✅ Pedido específico recuperado');
      }
      
      // Testar atualizar status
      const updateResult = await authenticatedRequest('PUT', `/orders/${orderId}`, {
        status: 'entregue'
      });
      if (updateResult.success) {
        console.log('✅ Status do pedido atualizado para entregue');
      }

      // Listar pedidos
      const ordersResult = await authenticatedRequest('GET', '/orders');
      if (ordersResult.success) {
        console.log(`✅ Pedidos listados: ${ordersResult.data.orders.length} encontrados`);
      }

      // Liberar a mesa
      await authenticatedRequest('PUT', `/tables/${firstTable._id}`, {
        status: 'disponivel'
      });
      
      return true;
    } else {
      console.log('❌ Erro ao criar pedido:', createOrderResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de pedidos:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes das APIs...');
  console.log('📍 Base URL:', API_BASE_URL);
  
  const results = {
    login: false,
    authMe: false,
    tables: false,
    products: false,
    createProduct: false,
    orders: false
  };

  // Executar testes em sequência
  results.login = await testLogin();
  
  if (results.login) {
    results.authMe = await testAuthMe();
    results.tables = await testTables();
    results.products = await testProducts();
    results.createProduct = await testCreateProduct();
    results.orders = await testOrders();
  } else {
    console.log('⏭️ Pulando outros testes devido a falha no login');
  }

  // Resumo dos resultados
  console.log('\n📊 Resumo dos Testes:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Resultado Final: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram! Sistema funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
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
    await runAllTests();
  }
}

main().catch(error => {
  console.error('❌ Erro durante execução dos testes:', error.message);
}); 