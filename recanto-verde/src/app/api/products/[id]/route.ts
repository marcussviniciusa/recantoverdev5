import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import Product from '../../../../../models/Product';
import { authenticateRequest, hasPermission } from '../../../../../lib/auth';

// GET - Buscar produto específico
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

    // Buscar produto
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        product
      },
      message: 'Produto encontrado'
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto (apenas recepcionistas)
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

    // Verificar permissão
    if (!hasPermission(user, 'recepcionista')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Apenas recepcionistas podem atualizar produtos' 
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Buscar produto
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado' 
        },
        { status: 404 }
      );
    }

    const { 
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
    } = body;

    // Validações
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Nome não pode estar vazio' 
          },
          { status: 400 }
        );
      }

      // Verificar se já existe produto com o mesmo nome (exceto o atual)
      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
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

      product.name = name.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (price !== undefined) {
      if (price <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Preço deve ser maior que zero' 
          },
          { status: 400 }
        );
      }
      product.price = price;
    }

    if (category !== undefined) {
      const validCategories = [
        'entradas', 'pratos-principais', 'sobremesas', 'bebidas', 
        'petiscos', 'saladas', 'massas', 'carnes', 'frutos-mar', 
        'vegetariano', 'vegano'
      ];

      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Categoria inválida' 
          },
          { status: 400 }
        );
      }
      product.category = category;
    }

    if (image !== undefined) {
      product.image = image;
    }

    if (available !== undefined) {
      product.available = available;
    }

    if (preparationTime !== undefined) {
      if (preparationTime !== null && (preparationTime < 1 || preparationTime > 180)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tempo de preparo deve ser entre 1 e 180 minutos' 
          },
          { status: 400 }
        );
      }
      product.preparationTime = preparationTime;
    }

    if (ingredients !== undefined) {
      product.ingredients = ingredients;
    }

    if (allergens !== undefined) {
      const validAllergens = [
        'gluten', 'lactose', 'ovo', 'soja', 'amendoim', 
        'castanhas', 'peixes', 'crustaceos', 'sementes-sesamo'
      ];

      if (allergens && allergens.some((allergen: string) => !validAllergens.includes(allergen))) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Alérgeno inválido fornecido' 
          },
          { status: 400 }
        );
      }
      product.allergens = allergens;
    }

    if (nutritionalInfo !== undefined) {
      product.nutritionalInfo = nutritionalInfo;
    }

    await product.save();

    return NextResponse.json({
      success: true,
      data: {
        product
      },
      message: 'Produto atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    
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

// DELETE - Deletar produto (apenas recepcionistas)
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
          error: 'Apenas recepcionistas podem deletar produtos' 
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Buscar produto
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado' 
        },
        { status: 404 }
      );
    }

    // TODO: Verificar se o produto está sendo usado em pedidos ativos
    // Por enquanto, vamos apenas marcar como indisponível em vez de deletar
    
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 