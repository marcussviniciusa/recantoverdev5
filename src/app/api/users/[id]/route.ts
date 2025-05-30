import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import User from '../../../../../models/User';
import { authenticateRequest } from '../../../../../lib/auth';
import bcrypt from 'bcryptjs';

// GET - Buscar usuário por ID
export async function GET(
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

    // Apenas recepcionistas podem buscar usuários
    if (user.role !== 'recepcionista') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado' 
        },
        { status: 403 }
      );
    }

    const foundUser = await User.findById(params.id, '-password');
    
    if (!foundUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário não encontrado' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: foundUser,
      message: 'Usuário encontrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
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

    // Apenas recepcionistas podem atualizar usuários
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
    const { username, email, password, role, phone, status } = body;

    // Verificar se usuário existe
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário não encontrado' 
        },
        { status: 404 }
      );
    }

    // Validar role se fornecido
    if (role && !['garcom', 'recepcionista'].includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role deve ser "garcom" ou "recepcionista"' 
        },
        { status: 400 }
      );
    }

    // Validar status se fornecido
    if (status && !['ativo', 'inativo'].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Status deve ser "ativo" ou "inativo"' 
        },
        { status: 400 }
      );
    }

    // Verificar duplicatas (excluindo o usuário atual)
    if (username || email) {
      const duplicateUser = await User.findOne({
        _id: { $ne: params.id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (duplicateUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Usuário com este username ou email já existe' 
          },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;

    // Hash da nova senha se fornecida
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir usuário
export async function DELETE(
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

    // Apenas recepcionistas podem excluir usuários
    if (user.role !== 'recepcionista') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado' 
        },
        { status: 403 }
      );
    }

    // Verificar se não está tentando excluir a si mesmo
    if (user.id === params.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir seu próprio usuário' 
        },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuário não encontrado' 
        },
        { status: 404 }
      );
    }

    // Excluir usuário
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 