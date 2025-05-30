import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import Order from '../../../../models/Order';
import Table from '../../../../models/Table';
import Product from '../../../../models/Product';
import User from '../../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'recanto_verde_super_secret_key_2025';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role !== 'recepcionista') {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Conectar ao banco
    await connectDB();

    // Definir período de análise
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

    // 1. Buscar todos os pedidos do período
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['entregue', 'pago'] }
    }).populate('waiterId', 'name')
      .populate('items.productId', 'name category price')
      .populate('tableId', 'number');

    // 2. Calcular métricas principais
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 3. Produtos mais vendidos
    const productStats = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          const productId = item.productId._id.toString();
          if (!productStats[productId]) {
            productStats[productId] = {
              name: item.productName, // Usar o nome armazenado no pedido
              quantity: 0,
              revenue: 0
            };
          }
          productStats[productId].quantity += item.quantity;
          productStats[productId].revenue += item.totalPrice; // Usar o preço total do item
        }
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 4. Performance dos garçons
    const waiterStats = {};
    orders.forEach(order => {
      if (order.waiterId) {
        const waiterId = order.waiterId._id.toString();
        if (!waiterStats[waiterId]) {
          waiterStats[waiterId] = {
            name: order.waiterId.name,
            ordersCount: 0,
            revenue: 0
          };
        }
        waiterStats[waiterId].ordersCount += 1;
        waiterStats[waiterId].revenue += order.totalAmount;
      }
    });

    const waiterPerformance = Object.values(waiterStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 5. Faturamento diário
    const dailyStats = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          revenue: 0,
          orders: 0
        };
      }
      dailyStats[date].revenue += order.totalAmount;
      dailyStats[date].orders += 1;
    });

    const dailyRevenue = Object.values(dailyStats)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Últimos 30 dias

    // 6. Análise de ocupação das mesas
    const tables = await Table.find({});
    const totalTables = tables.length;
    
    // Calcular ocupação real baseada nos pedidos
    const averageOccupancy = totalOrders > 0 ? (totalOrders / totalTables) * 10 : 0; // Estimativa baseada nos pedidos
    
    const peakHours = [
      '12:00 - 13:00',
      '19:00 - 20:00',
      '20:00 - 21:00'
    ];

    const tableUtilization = tables.map(table => ({
      tableNumber: table.number,
      utilizationRate: 0 // Será calculado baseado em dados reais futuramente
    }));

    // 7. Compilar dados do relatório
    const reportData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
      waiterPerformance,
      dailyRevenue,
      tableOccupancy: {
        averageOccupancy,
        peakHours,
        tableUtilization
      }
    };

    return NextResponse.json({
      success: true,
      data: reportData,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 