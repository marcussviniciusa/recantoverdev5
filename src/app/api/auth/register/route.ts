import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import User from '../../../../../models/User';
import { authenticateRequest, hasPermission, isValidEmail, isValidPassword, sanitizeUser } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticação (apenas recepcionistas podem criar usuários)
    const currentUser = await authenticateRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token inválido ou expirado' 
        },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser, 'recepcionista')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Apenas recepcionistas podem criar novos usuários' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validação dos dados de entrada
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Todos os campos são obrigatórios' 
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email inválido' 
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Senha deve ter pelo menos 6 caracteres' 
        },
        { status: 400 }
      );
    }

    if (!['garcom', 'recepcionista'].includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Função deve ser "garcom" ou "recepcionista"' 
        },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome de usuário deve ter entre 3 e 30 caracteres' 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe usuário com o mesmo email ou username
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email já está em uso' 
          },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Nome de usuário já está em uso' 
          },
          { status: 409 }
        );
      }
    }

    // Criar novo usuário
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true
    });

    await newUser.save();

    // Preparar resposta sem a senha
    const userResponse = sanitizeUser(newUser);

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse
      },
      message: `${role === 'garcom' ? 'Garçom' : 'Recepcionista'} criado com sucesso`
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    
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