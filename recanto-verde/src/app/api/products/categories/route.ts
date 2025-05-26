import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/db';
import Product from '../../../../../models/Product';
import { authenticateRequest } from '../../../../../lib/auth';

// GET - Listar categorias disponíveis
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

    // Buscar todas as categorias que têm produtos
    const categoriesWithCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Mapear categorias para formato mais amigável
    const categoryMap: Record<string, string> = {
      'entradas': 'Entradas',
      'pratos-principais': 'Pratos Principais',
      'sobremesas': 'Sobremesas',
      'bebidas': 'Bebidas',
      'petiscos': 'Petiscos',
      'saladas': 'Saladas',
      'massas': 'Massas',
      'carnes': 'Carnes',
      'frutos-mar': 'Frutos do Mar',
      'vegetariano': 'Vegetariano',
      'vegano': 'Vegano'
    };

    const categories = categoriesWithCounts.map(cat => ({
      id: cat._id,
      name: categoryMap[cat._id] || cat._id,
      totalProducts: cat.count,
      availableProducts: cat.availableCount
    }));

    // Também retornar todas as categorias possíveis (mesmo sem produtos)
    const allCategories = Object.entries(categoryMap).map(([id, name]) => {
      const existingCategory = categories.find(cat => cat.id === id);
      return existingCategory || {
        id,
        name,
        totalProducts: 0,
        availableProducts: 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: allCategories,
        categoriesWithProducts: categories
      },
      message: 'Categorias recuperadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 