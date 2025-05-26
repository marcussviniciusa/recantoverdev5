import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Table from '../../../../models/Table';
import { authenticateRequest, hasPermission } from '../../../../lib/auth';

// GET - Listar todas as mesas
export async function GET(request: NextRequest) {
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

    // Buscar todas as mesas
    const tables = await Table.find()
      .populate('assignedWaiter', 'username email')
      .sort({ number: 1 });

    return NextResponse.json({
      success: true,
      data: {
        tables
      },
      message: 'Mesas recuperadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova mesa (apenas recepcionistas)
export async function POST(request: NextRequest) {
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
          error: 'Apenas recepcionistas podem criar mesas' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { number, capacity } = body;

    // Validação dos dados
    if (!number || !capacity) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Número e capacidade da mesa são obrigatórios' 
        },
        { status: 400 }
      );
    }

    if (number < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Número da mesa deve ser maior que 0' 
        },
        { status: 400 }
      );
    }

    if (capacity < 1 || capacity > 20) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Capacidade deve ser entre 1 e 20 pessoas' 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe mesa com o mesmo número
    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe uma mesa com este número' 
        },
        { status: 409 }
      );
    }

    // Criar nova mesa
    const newTable = new Table({
      number,
      capacity,
      status: 'disponivel'
    });

    await newTable.save();

    return NextResponse.json({
      success: true,
      data: {
        table: newTable
      },
      message: 'Mesa criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    
    // Se for erro de validação do Mongoose
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