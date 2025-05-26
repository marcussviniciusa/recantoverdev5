'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  observations: string;
  totalPrice: number;
}

interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: string;
  currentCustomers?: number;
}

export default function CriarPedido() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;

  const [table, setTable] = useState<Table | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [observations, setObservations] = useState('');

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Carregar mesa, produtos e categorias em paralelo
      const [tableRes, productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/tables/${tableId}`, { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/products/categories', { headers })
      ]);

      const tableData = await tableRes.json();
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      if (tableData.success) {
        setTable(tableData.data.table);
      }

      if (productsData.success) {
        setProducts(productsData.data.products.filter((p: Product) => p.available));
      }

      if (categoriesData.success) {
        const categoryNames = categoriesData.data.categoriesWithProducts.map((c: { name: string }) => c.name);
        setCategories(categoryNames);
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'garcom') {
      router.push('/auth/login?role=garcom');
      return;
    }

    if (tableId) {
      loadData();
    }
  }, [tableId, router, loadData]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      updateCartItem(product._id, existingItem.quantity + 1, existingItem.observations);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        observations: '',
        totalPrice: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (productId: string, quantity: number, observations: string) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.product._id === productId 
        ? { 
            ...item, 
            quantity, 
            observations,
            totalPrice: Math.round(item.product.price * quantity * 100) / 100
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Adicione pelo menos um item ao pedido');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        tableId,
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          observations: item.observations
        })),
        observations
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Pedido criado com sucesso!');
        router.push('/garcom/mesas');
      } else {
        alert('Erro ao criar pedido: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mesa não encontrada</h2>
          <Link 
            href="/garcom/mesas"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Voltar para Mesas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                href="/garcom/mesas"
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 hover:bg-gray-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Novo Pedido</h1>
                <p className="text-sm text-gray-500">Mesa {table.number} • {table.currentCustomers} clientes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Total: R$ {getTotalAmount().toFixed(2)}</p>
              <p className="text-xs text-gray-500">{getTotalItems()} itens</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            {/* Busca e Filtros */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <div className="space-y-4">
                {/* Busca */}
                <div>
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Categorias */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === '' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <p className="text-lg font-bold text-green-600">R$ {product.price.toFixed(2)}</p>
                      {product.preparationTime && (
                        <p className="text-xs text-gray-500 mt-1">⏱️ {product.preparationTime} min</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Adicionar ao Pedido
                  </button>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros ou termo de busca.</p>
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Carrinho</h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0v0a2 2 0 104 0m-4 0a2 2 0 104 0" />
                  </svg>
                  <p className="text-gray-600">Carrinho vazio</p>
                  <p className="text-sm text-gray-500 mt-1">Adicione produtos do cardápio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product._id} className="border-b border-gray-200 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateCartItem(item.product._id, item.quantity - 1, item.observations)}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                            >
                              -
                            </button>
                            <span className="mx-3 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.product._id, item.quantity + 1, item.observations)}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-green-600">R$ {item.totalPrice.toFixed(2)}</span>
                        </div>

                        <input
                          type="text"
                          placeholder="Observações..."
                          value={item.observations}
                          onChange={(e) => updateCartItem(item.product._id, item.quantity, e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold mb-4">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {getTotalAmount().toFixed(2)}</span>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações gerais
                      </label>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Observações sobre o pedido..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <button
                      onClick={submitOrder}
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Enviando...' : 'Finalizar Pedido'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 