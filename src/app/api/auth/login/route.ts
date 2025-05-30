import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import User from '../../../../../models/User';
import { generateToken, isValidEmail, isValidPassword, sanitizeUser } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validação dos dados de entrada
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email e senha são obrigatórios' 
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

    // Buscar usuário no banco
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciais inválidas' 
        },
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (!user.isActive || user.status === 'inativo') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário inativo. Entre em contato com o administrador' 
        },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciais inválidas' 
        },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = generateToken(user);

    // Preparar resposta sem a senha
    const userResponse = sanitizeUser(user);

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 