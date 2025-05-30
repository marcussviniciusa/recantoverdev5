import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/db';
import Payment from '../../../../../../models/Payment';
import Order from '../../../../../../models/Order';
import Table from '../../../../../../models/Table';
import { authenticateRequest, hasPermission } from '../../../../../../lib/auth';

// POST - Criar pagamento para mesa (todos os pedidos)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    await connectDB();

    // Verificar autenticação
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token inválido ou expirado' 
        },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!hasPermission(user, 'recepcionista') && !hasPermission(user, 'garcom')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado' 
        },
        { status: 403 }
      );
    }

    const { tableId } = await params;
    const body = await request.json();
    const { paymentMethods } = body;

    // Validações
    if (!paymentMethods || paymentMethods.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Métodos de pagamento são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Verificar se a mesa existe
    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesa não encontrada' 
        },
        { status: 404 }
      );
    }

    // Buscar todos os pedidos entregues da mesa que ainda não foram pagos
    const orders = await Order.find({
      tableId: tableId,
      status: 'entregue'
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não há pedidos entregues para esta mesa' 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe pagamento para esta mesa
    const existingPayment = await Payment.findOne({
      tableId: tableId,
      status: { $ne: 'cancelado' }
    });

    if (existingPayment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe um pagamento para esta mesa' 
        },
        { status: 400 }
      );
    }

    // Calcular valor total de todos os pedidos
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderIds = orders.map(order => order._id);

    // Validar métodos de pagamento
    const totalMethodsAmount = paymentMethods.reduce((sum: number, method: any) => sum + method.amount, 0);
    
    if (Math.abs(totalMethodsAmount - totalAmount) > 0.01) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Total dos métodos de pagamento (${totalMethodsAmount.toFixed(2)}) não confere com o valor total da mesa (${totalAmount.toFixed(2)})` 
        },
        { status: 400 }
      );
    }

    // Validar métodos de pagamento individuais
    for (const method of paymentMethods) {
      if (!method.type || method.amount <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Todos os métodos de pagamento devem ter tipo e valor válidos' 
          },
          { status: 400 }
        );
      }

      const validMethods = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'outro'];
      if (!validMethods.includes(method.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Método de pagamento inválido: ${method.type}` 
          },
          { status: 400 }
        );
      }
    }

    // Criar registro de pagamento
    const payment = new Payment({
      tableId: tableId,
      orderIds: orderIds,
      totalAmount: totalAmount,
      paymentMethods: paymentMethods,
      status: 'pago',
      paidAt: new Date(),
      tableIdentification: table.identification
    });

    await payment.save();

    // Atualizar status dos pedidos para pago
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { status: 'pago', paymentId: payment._id }
    );

    console.log('✅ Pagamento criado para mesa:', table.number);
    console.log('- Total de pedidos:', orders.length);
    console.log('- Valor total:', totalAmount);
    console.log('- Identificação da mesa:', table.identification || 'Sem identificação');

    return NextResponse.json({
      success: true,
      data: {
        payment: payment,
        orders: orders,
        totalOrders: orders.length
      },
      message: 'Pagamento registrado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao registrar pagamento da mesa:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      const mongooseError = error as any;
      const validationErrors: any = {};
      
      for (const field in mongooseError.errors) {
        validationErrors[field] = mongooseError.errors[field].message;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos fornecidos',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET - Obter resumo da conta da mesa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    await connectDB();

    // Verificar autenticação
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token inválido ou expirado' 
        },
        { status: 401 }
      );
    }

    const { tableId } = await params;

    // Verificar se a mesa existe
    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesa não encontrada' 
        },
        { status: 404 }
      );
    }

    // Buscar todos os pedidos da mesa
    const orders = await Order.find({
      tableId: tableId
    }).populate('waiterId', 'username');

    // Separar pedidos por status
    const ordersByStatus = {
      preparando: orders.filter(o => o.status === 'preparando'),
      pronto: orders.filter(o => o.status === 'pronto'),
      entregue: orders.filter(o => o.status === 'entregue'),
      pago: orders.filter(o => o.status === 'pago')
    };

    // Calcular totais
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const unpaidAmount = ordersByStatus.entregue.reduce((sum, order) => sum + order.totalAmount, 0);
    const paidAmount = ordersByStatus.pago.reduce((sum, order) => sum + order.totalAmount, 0);

    // Verificar se já existe pagamento
    const existingPayment = await Payment.findOne({
      tableId: tableId,
      status: { $ne: 'cancelado' }
    });

    return NextResponse.json({
      success: true,
      data: {
        table: table,
        orders: orders,
        ordersByStatus: ordersByStatus,
        summary: {
          totalOrders: orders.length,
          totalAmount: totalAmount,
          unpaidAmount: unpaidAmount,
          paidAmount: paidAmount,
          canPayNow: unpaidAmount > 0 && !existingPayment
        },
        existingPayment: existingPayment
      },
      message: 'Resumo da conta obtido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao obter resumo da conta:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 