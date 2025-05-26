import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import Order from '../../../../../models/Order';
import { authenticateRequest, hasPermission } from '../../../../../lib/auth';

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

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

    // Se for garçom, só pode ver seus próprios pedidos
    if (user.role === 'garcom' && order.waiterId._id.toString() !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para ver este pedido' 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order
      },
      message: 'Pedido encontrado'
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status do pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { status, observations, isMarkedByReceptionist } = body;

    // Buscar pedido
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pedido não encontrado' 
        },
        { status: 404 }
      );
    }

    // Se for garçom, só pode atualizar seus próprios pedidos
    if (user.role === 'garcom' && order.waiterId.toString() !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para atualizar este pedido' 
        },
        { status: 403 }
      );
    }

    // Validar status
    if (status !== undefined) {
      const validStatuses = ['preparando', 'pronto', 'entregue', 'cancelado'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Status inválido' 
          },
          { status: 400 }
        );
      }

      // Verificar transições de status válidas
      const currentStatus = order.status;
      
      // Regras de transição
      if (currentStatus === 'cancelado') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Não é possível alterar status de pedido cancelado' 
          },
          { status: 400 }
        );
      }

      if (currentStatus === 'entregue' && status !== 'entregue') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Não é possível alterar status de pedido já entregue' 
          },
          { status: 400 }
        );
      }

      // Garçom só pode marcar como entregue ou cancelar
      if (user.role === 'garcom' && !['entregue', 'cancelado'].includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Garçom só pode marcar como entregue ou cancelar pedido' 
          },
          { status: 403 }
        );
      }

      order.status = status;
    }

    // Atualizar observações
    if (observations !== undefined) {
      order.observations = observations;
    }

    // Marcar como visto pelo recepcionista (apenas recepcionistas)
    if (isMarkedByReceptionist !== undefined && user.role === 'recepcionista') {
      order.isMarkedByReceptionist = isMarkedByReceptionist;
    }

    await order.save();

    // Recarregar com populate
    const updatedOrder = await Order.findById(id)
      .populate('tableId', 'number capacity status')
      .populate('waiterId', 'username email');

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder
      },
      message: 'Pedido atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos fornecidos' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Buscar pedido
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pedido não encontrado' 
        },
        { status: 404 }
      );
    }

    // Se for garçom, só pode cancelar seus próprios pedidos
    if (user.role === 'garcom' && order.waiterId.toString() !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para cancelar este pedido' 
        },
        { status: 403 }
      );
    }

    // Verificar se o pedido pode ser cancelado
    if (order.status === 'entregue') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível cancelar pedido já entregue' 
        },
        { status: 400 }
      );
    }

    if (order.status === 'cancelado') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pedido já está cancelado' 
        },
        { status: 400 }
      );
    }

    // Marcar como cancelado em vez de deletar
    order.status = 'cancelado';
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 