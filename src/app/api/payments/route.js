import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import Payment from '../../../../models/Payment';
import Order from '../../../../models/Order';

const JWT_SECRET = process.env.JWT_SECRET || 'recanto_verde_super_secret_key_2025';

// ⚠️ DEPRECATED: Esta API está obsoleta!
// Use a nova API por mesa: /api/payments/mesa/[tableId]
// 
// Sistema antigo: Um pagamento por pedido
// Sistema novo: Um pagamento por mesa (todos os pedidos)
//
// Esta API será removida em versões futuras

export async function POST(request) {
  try {
    console.warn('⚠️ DEPRECATED API USAGE: /api/payments - Use /api/payments/mesa/[tableId] instead');
    
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

    // Retornar erro informando sobre a nova API
    return NextResponse.json({ 
      success: false, 
      error: 'Esta API está deprecated. Use /api/payments/mesa/[tableId] para o novo sistema de pagamentos por mesa.',
      deprecated: true,
      newEndpoint: '/api/payments/mesa/[tableId]'
    }, { status: 410 }); // 410 Gone

  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    console.warn('⚠️ DEPRECATED API USAGE: /api/payments - Use /api/payments/mesa/[tableId] instead');
    
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    let filter = {};

    // Filtro por data
    if (startDate && endDate) {
      filter.paidAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59')
      };
    }

    // Filtro por status
    if (status) {
      filter.status = status;
    }

    // Buscar apenas pagamentos do novo sistema (com orderIds array)
    filter.orderIds = { $exists: true, $type: 'array' };

    const payments = await Payment.find(filter)
      .populate('tableId', 'number capacity identification status')
      .sort({ paidAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        payments: payments,
        total: payments.length
      },
      message: 'Retornando apenas pagamentos do novo sistema por mesa'
    });

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 