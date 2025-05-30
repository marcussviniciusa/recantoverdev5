const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Preparar Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Criar servidor HTTP
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Criar instância Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Controle de conexões para evitar spam
  let connectionCount = 0;
  const connectedUsers = new Map();

  // Eventos do Socket.IO
  io.on('connection', (socket) => {
    connectionCount++;
    
    // Log apenas a cada 10 conexões para reduzir spam
    if (connectionCount % 10 === 0) {
      console.log(`🔌 ${connectionCount} conexões ativas`);
    }

    // Autenticação do usuário
    socket.on('authenticate', (userData) => {
      socket.user = userData;
      socket.join(`role_${userData.role}`);
      if (userData.role === 'garcom') {
        socket.join(`waiter_${userData.id}`);
      }
      
      // Armazenar usuário conectado
      connectedUsers.set(socket.id, userData);
      
      // Confirmar autenticação
      socket.emit('authenticated', { success: true });
    });

    // === NOTIFICAÇÕES DE PEDIDOS ===
    
    // Novo pedido criado
    socket.on('order_created', (orderData) => {
      console.log('📝 Novo pedido:', orderData._id);
      
      // Notificar todos os recepcionistas
      socket.to('role_recepcionista').emit('new_order', {
        type: 'new_order',
        title: 'Novo Pedido!',
        message: `Mesa ${orderData.tableId.number} - ${orderData.items.length} item(s)`,
        order: orderData,
        timestamp: new Date()
      });
    });

    // Status do pedido atualizado
    socket.on('order_status_updated', (orderData) => {
      console.log('🔄 Pedido atualizado:', orderData._id, '→', orderData.status);
      
      const notifications = {
        'preparando': {
          title: 'Pedido em Preparo',
          message: `Mesa ${orderData.tableId.number} - Pedido sendo preparado`,
          target: [`waiter_${orderData.waiterId._id}`]
        },
        'pronto': {
          title: 'Pedido Pronto! 🍽️',
          message: `Mesa ${orderData.tableId.number} - Pedido pronto para entrega`,
          target: [`waiter_${orderData.waiterId._id}`, 'role_recepcionista']
        },
        'entregue': {
          title: 'Pedido Entregue ✅',
          message: `Mesa ${orderData.tableId.number} - Pedido entregue com sucesso`,
          target: ['role_recepcionista']
        }
      };

      const notif = notifications[orderData.status];
      if (notif) {
        notif.target.forEach(target => {
          socket.to(target).emit('order_notification', {
            type: 'order_update',
            title: notif.title,
            message: notif.message,
            order: orderData,
            status: orderData.status,
            timestamp: new Date()
          });
        });
      }
    });

    // === NOTIFICAÇÕES DE MESAS ===
    
    // Mesa ocupada
    socket.on('table_occupied', (tableData) => {
      console.log('🪑 Mesa ocupada:', tableData.number);
      
      socket.to('role_recepcionista').emit('table_notification', {
        type: 'table_occupied',
        title: 'Mesa Ocupada',
        message: `Mesa ${tableData.number} foi ocupada`,
        table: tableData,
        timestamp: new Date()
      });
    });

    // Mesa liberada
    socket.on('table_freed', (tableData) => {
      console.log('🆓 Mesa liberada:', tableData.number);
      
      socket.to('role_recepcionista').emit('table_notification', {
        type: 'table_freed',
        title: 'Mesa Disponível',
        message: `Mesa ${tableData.number} está disponível`,
        table: tableData,
        timestamp: new Date()
      });
    });

    // === NOTIFICAÇÕES DE PAGAMENTOS ===
    
    // Pagamento registrado
    socket.on('payment_registered', (paymentData) => {
      console.log('💰 Pagamento:', paymentData._id, '- R$', paymentData.totalAmount.toFixed(2));
      
      socket.to('role_recepcionista').emit('payment_notification', {
        type: 'payment_registered',
        title: 'Pagamento Recebido 💰',
        message: `Mesa ${paymentData.orderId.tableId.number} - R$ ${paymentData.totalAmount.toFixed(2)}`,
        payment: paymentData,
        timestamp: new Date()
      });
    });

    // === EVENTOS ADMINISTRATIVOS ===
    
    // Novo usuário criado
    socket.on('user_created', (userData) => {
      console.log('👤 Novo usuário:', userData.username);
      
      socket.to('role_recepcionista').emit('user_notification', {
        type: 'user_created',
        title: 'Novo Usuário',
        message: `${userData.role === 'garcom' ? 'Garçom' : 'Recepcionista'} ${userData.username} foi adicionado`,
        user: userData,
        timestamp: new Date()
      });
    });

    // === EVENTOS DO SISTEMA ===
    
    // Broadcast para todos
    socket.on('system_broadcast', (message) => {
      if (socket.user?.role === 'recepcionista') {
        io.emit('system_notification', {
          type: 'system_broadcast',
          title: 'Aviso do Sistema',
          message: message,
          timestamp: new Date()
        });
        console.log('📢 Broadcast:', message);
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      connectionCount--;
      connectedUsers.delete(socket.id);
      
      // Log apenas ocasionalmente para reduzir spam
      if (connectionCount % 5 === 0) {
        console.log(`🔌 ${connectionCount} conexões ativas`);
      }
    });
  });

  // Disponibilizar o io globalmente
  global.io = io;

  // Status de usuários conectados a cada 30 segundos (apenas se houver mudanças)
  let lastConnectionCount = 0;
  setInterval(() => {
    if (connectionCount !== lastConnectionCount) {
      console.log(`📊 Status: ${connectionCount} conexões ativas, ${connectedUsers.size} usuários autenticados`);
      lastConnectionCount = connectionCount;
    }
  }, 30000);

  // Iniciar servidor
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Servidor rodando em http://${hostname}:${port}`);
    console.log('⚡ Socket.IO habilitado para notificações em tempo real');
    console.log('📊 Logs otimizados - conexões agrupadas para reduzir spam');
  });
}); 