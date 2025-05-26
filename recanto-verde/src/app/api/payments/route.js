import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import Payment from '../../../../models/Payment';
import Order from '../../../../models/Order';

const JWT_SECRET = process.env.JWT_SECRET || 'recanto_verde_super_secret_key_2025';

export async function POST(request) {
  try {
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

    const body = await request.json();
    const { orderId, totalAmount, paymentMethods, tipAmount, splitBetween, notes } = body;

    // Validações
    if (!orderId || !paymentMethods || paymentMethods.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados obrigatórios não fornecidos' 
      }, { status: 400 });
    }

    // Verificar se o pedido existe
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Pedido não encontrado' 
      }, { status: 404 });
    }

    // Verificar se o pedido já foi pago
    if (order.status === 'pago') {
      return NextResponse.json({ 
        success: false, 
        error: 'Este pedido já foi pago' 
      }, { status: 400 });
    }

    // Verificar se o pedido está entregue
    if (order.status !== 'entregue') {
      return NextResponse.json({ 
        success: false, 
        error: 'Só é possível registrar pagamento de pedidos entregues' 
      }, { status: 400 });
    }

    // Validar métodos de pagamento
    const totalMethodsAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    const expectedTotal = (totalAmount + (tipAmount || 0)) / (splitBetween || 1);
    
    if (Math.abs(totalMethodsAmount - expectedTotal) > 0.01) {
      return NextResponse.json({ 
        success: false, 
        error: `Total dos métodos de pagamento (${totalMethodsAmount.toFixed(2)}) não confere com o valor esperado (${expectedTotal.toFixed(2)})` 
      }, { status: 400 });
    }

    // Validar métodos de pagamento individuais
    for (const method of paymentMethods) {
      if (!method.method || method.amount <= 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Todos os métodos de pagamento devem ter tipo e valor válidos' 
        }, { status: 400 });
      }

      const validMethods = ['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'vale_refeicao'];
      if (!validMethods.includes(method.method)) {
        return NextResponse.json({ 
          success: false, 
          error: `Método de pagamento inválido: ${method.method}` 
        }, { status: 400 });
      }
    }

    // Criar registro de pagamento
    const payment = new Payment({
      orderId: orderId,
      tableId: order.table,
      totalAmount: totalAmount,
      paymentMethods: paymentMethods.map(method => ({
        type: method.method,
        amount: method.amount,
        description: method.description || ''
      })),
      status: 'pago',
      paidAt: new Date()
    });

    await payment.save();

    // Atualizar status do pedido
    order.status = 'pago';
    order.payment = payment._id;
    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        payment: payment,
        message: 'Pagamento registrado com sucesso'
      }
    });

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

    const payments = await Payment.find(filter)
      .populate('tableId', 'number capacity')
      .populate('orderId', 'items totalAmount status')
      .sort({ paidAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        payments: payments,
        total: payments.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 