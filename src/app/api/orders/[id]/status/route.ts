import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/db';
import Order from '../../../../../../models/Order';
import { authenticateRequest } from '../../../../../../lib/auth';

type OrderStatus = 'pendente' | 'preparando' | 'pronto' | 'entregue';

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Validação do status
    const validStatuses: OrderStatus[] = ['pendente', 'preparando', 'pronto', 'entregue'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Status deve ser um dos valores: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Buscar pedido
    const order = await Order.findById(id)
      .populate('tableId', 'number capacity status')
      .populate('waiterId', 'username email');

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pedido não encontrado' 
        },
        { status: 404 }
      );
    }

    // Verificar permissões
    // Admin pode alterar qualquer pedido
    // Garçom só pode alterar seus próprios pedidos
    if (user.role === 'garcom' && order.waiterId._id.toString() !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você só pode alterar seus próprios pedidos' 
        },
        { status: 403 }
      );
    }

    // Validação de transição de status
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      'pendente': ['preparando', 'entregue'], // Pode pular direto para entregue em casos especiais
      'preparando': ['pronto', 'pendente'], // Pode voltar para pendente se houver problema
      'pronto': ['entregue', 'preparando'], // Pode voltar para preparando se necessário
      'entregue': [] // Status final, não pode ser alterado
    };

    if (order.status === 'entregue') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pedidos entregues não podem ter o status alterado' 
        },
        { status: 400 }
      );
    }

    const currentStatus = order.status as OrderStatus;
    if (!statusFlow[currentStatus].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível alterar status de '${order.status}' para '${status}'` 
        },
        { status: 400 }
      );
    }

    // Atualizar status
    order.status = status;
    
    // Se o status for 'entregue', marcar data de entrega
    if (status === 'entregue') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Recarregar com populate para resposta
    const updatedOrder = await Order.findById(order._id)
      .populate('tableId', 'number capacity status')
      .populate('waiterId', 'username email');

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder
      },
      message: `Status do pedido atualizado para '${status}' com sucesso`
    });

  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    
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