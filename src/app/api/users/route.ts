import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import User from '../../../../models/User';
import { authenticateRequest, hasPermission } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

// GET - Listar usuários
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

    // Apenas recepcionistas podem listar usuários
    if (user.role !== 'recepcionista') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado' 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Construir filtros
    const filters: any = {};
    if (role) {
      filters.role = role;
    }

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Buscar usuários (excluindo senhas)
    const users = await User.find(filters, '-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Contar total para paginação
    const total = await User.countDocuments(filters);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Usuários recuperados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
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

    // Apenas recepcionistas podem criar usuários
    if (user.role !== 'recepcionista') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validação dos dados obrigatórios
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username, email, senha e role são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Validar role
    if (!['garcom', 'recepcionista'].includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role deve ser "garcom" ou "recepcionista"' 
        },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário com este username ou email já existe' 
        },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar novo usuário
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    // Retornar usuário sem a senha
    const userResponse = await User.findById(newUser._id, '-password');

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Usuário criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 