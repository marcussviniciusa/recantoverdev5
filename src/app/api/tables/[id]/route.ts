import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import Table from '../../../../../models/Table';
import { authenticateRequest, hasPermission } from '../../../../../lib/auth';

// GET - Buscar mesa específica
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

    // Buscar mesa
    const table = await Table.findById(id)
      .populate('assignedWaiter', 'username email');

    if (!table) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesa não encontrada' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        table
      },
      message: 'Mesa encontrada'
    });

  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar mesa
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
    const { number, capacity, status, currentCustomers, assignedWaiter } = body;

    // Buscar mesa
    const table = await Table.findById(id);

    if (!table) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesa não encontrada' 
        },
        { status: 404 }
      );
    }

    // Verificar permissões baseadas na operação
    if (number !== undefined || capacity !== undefined) {
      // Apenas recepcionistas podem alterar número e capacidade
      if (!hasPermission(user, 'recepcionista')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Apenas recepcionistas podem alterar número e capacidade da mesa' 
          },
          { status: 403 }
        );
      }
    }

    // Validação dos dados
    if (number !== undefined) {
      if (number < 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Número da mesa deve ser maior que 0' 
          },
          { status: 400 }
        );
      }

      // Verificar se já existe mesa com o mesmo número (exceto a atual)
      const existingTable = await Table.findOne({ 
        number, 
        _id: { $ne: id } 
      });
      
      if (existingTable) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Já existe uma mesa com este número' 
          },
          { status: 409 }
        );
      }

      table.number = number;
    }

    if (capacity !== undefined) {
      if (capacity < 1 || capacity > 20) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Capacidade deve ser entre 1 e 20 pessoas' 
          },
          { status: 400 }
        );
      }
      table.capacity = capacity;
    }

    if (status !== undefined) {
      const validStatuses = ['disponivel', 'ocupada', 'reservada', 'manutencao'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Status inválido' 
          },
          { status: 400 }
        );
      }

      table.status = status;

      // Se está sendo ocupada, definir dados necessários
      if (status === 'ocupada') {
        if (currentCustomers !== undefined) {
          if (currentCustomers < 1 || currentCustomers > table.capacity) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Número de clientes deve ser entre 1 e a capacidade da mesa' 
              },
              { status: 400 }
            );
          }
          table.currentCustomers = currentCustomers;
        }

        if (assignedWaiter !== undefined) {
          table.assignedWaiter = assignedWaiter;
        } else {
          // Se não informou garçom, usar o usuário logado (se for garçom)
          if (user.role === 'garcom') {
            table.assignedWaiter = user.id as any;
          }
        }

        table.openedAt = new Date();
        table.closedAt = undefined;
      }

      // Se está sendo liberada
      if (status === 'disponivel') {
        table.currentCustomers = undefined;
        table.assignedWaiter = undefined;
        table.closedAt = new Date();
      }
    }

    await table.save();

    // Recarregar com populate
    const updatedTable = await Table.findById(id)
      .populate('assignedWaiter', 'username email');

    return NextResponse.json({
      success: true,
      data: {
        table: updatedTable
      },
      message: 'Mesa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    
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

// DELETE - Deletar mesa (apenas recepcionistas)
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

    // Verificar permissão
    if (!hasPermission(user, 'recepcionista')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Apenas recepcionistas podem deletar mesas' 
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Buscar mesa
    const table = await Table.findById(id);

    if (!table) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mesa não encontrada' 
        },
        { status: 404 }
      );
    }

    // Verificar se a mesa está ocupada
    if (table.status === 'ocupada') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível deletar uma mesa ocupada' 
        },
        { status: 409 }
      );
    }

    await Table.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Mesa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar mesa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 