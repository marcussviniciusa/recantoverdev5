import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import Product from '../../../../models/Product';
import { authenticateRequest, hasPermission } from '../../../../lib/auth';

// GET - Listar todos os produtos
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');
    const search = searchParams.get('search');

    // Construir filtros
    const filters: any = {};

    if (category) {
      filters.category = category;
    }

    if (available !== null) {
      filters.available = available === 'true';
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar produtos
    const products = await Product.find(filters)
      .sort({ category: 1, name: 1 });

    return NextResponse.json({
      success: true,
      data: {
        products
      },
      message: 'Produtos recuperados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo produto (apenas recepcionistas)
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
          error: 'Apenas recepcionistas podem criar produtos' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      category, 
      image, 
      available = true, 
      preparationTime,
      ingredients,
      allergens,
      nutritionalInfo
    } = body;

    // Validação dos dados obrigatórios
    if (!name || !price || !category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, preço e categoria são obrigatórios' 
        },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Preço deve ser maior que zero' 
        },
        { status: 400 }
      );
    }

    // Validar se a categoria não está vazia (remover validação de lista fixa)
    if (!category.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Categoria não pode estar vazia' 
        },
        { status: 400 }
      );
    }

    if (preparationTime && (preparationTime < 1 || preparationTime > 180)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tempo de preparo deve ser entre 1 e 180 minutos' 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe produto com o mesmo nome
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe um produto com este nome' 
        },
        { status: 409 }
      );
    }

    // Criar novo produto
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      image,
      available,
      preparationTime,
      ingredients,
      allergens,
      nutritionalInfo
    });

    await newProduct.save();

    return NextResponse.json({
      success: true,
      data: {
        product: newProduct
      },
      message: 'Produto criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    
    // Se for erro de validação do Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      console.error('Erro de validação Mongoose:', error.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos fornecidos: ' + error.message 
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