import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
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

    return NextResponse.json({
      success: true,
      data: {
        user
      },
      message: 'Usuário autenticado'
    });

  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 