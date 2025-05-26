'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  _id: string;
  tableId: {
    _id: string;
    number: number;
  };
  waiterId: {
    username: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    observations?: string;
  }>;
  status: 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  totalAmount: number;
  observations?: string;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export default function GarcomPedidos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [filter, setFilter] = useState<string>('todos');

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const storedUserName = localStorage.getItem('userName');

    if (!token || userRole !== 'garcom') {
      router.push('/auth/login?role=garcom');
      return;
    }

    setUserName(storedUserName || '');
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        await loadOrders(); // Recarregar pedidos
      } else {
        alert('Erro ao atualizar pedido: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      alert('Erro de conexão');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparando': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pronto': return 'bg-green-100 text-green-800 border-green-200';
      case 'entregue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preparando': return 'Preparando';
      case 'pronto': return 'Pronto';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'todos') return true;
    return order.status === filter;
  });

  const getOrderStats = () => {
    return {
      total: orders.length,
      preparando: orders.filter(o => o.status === 'preparando').length,
      pronto: orders.filter(o => o.status === 'pronto').length,
      entregue: orders.filter(o => o.status === 'entregue').length
    };
  };

  const stats = getOrderStats();

  const logout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">RV</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Recanto Verde</h1>
                <p className="text-sm text-gray-500">Garçom - {userName}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meus Pedidos</h2>
          <p className="mt-1 text-gray-600">
            Acompanhe e gerencie seus pedidos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.preparando}</p>
              <p className="text-sm text-gray-600">Preparando</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.pronto}</p>
              <p className="text-sm text-gray-600">Prontos</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.entregue}</p>
              <p className="text-sm text-gray-600">Entregues</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'todos' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('preparando')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'preparando' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preparando ({stats.preparando})
            </button>
            <button
              onClick={() => setFilter('pronto')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pronto' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prontos ({stats.pronto})
            </button>
            <button
              onClick={() => setFilter('entregue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'entregue' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregues ({stats.entregue})
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mesa {order.tableId.number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    R$ {order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Itens:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                        {item.observations && (
                          <span className="text-gray-500 italic"> ({item.observations})</span>
                        )}
                      </span>
                      <span className="font-medium">R$ {item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {order.observations && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">Observações:</h4>
                  <p className="text-sm text-gray-600 italic">{order.observations}</p>
                </div>
              )}

              {/* Tempo Estimado */}
              {order.estimatedTime && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    ⏱️ Tempo estimado: {order.estimatedTime} minutos
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 mt-4">
                {order.status === 'pronto' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'entregue')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Marcar como Entregue
                  </button>
                )}
                
                {order.status === 'preparando' && (
                  <div className="flex-1 text-center py-2 px-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                    Aguardando cozinha...
                  </div>
                )}

                {order.status === 'entregue' && (
                  <div className="flex-1 text-center py-2 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    ✅ Pedido entregue
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'todos' ? 'Nenhum pedido encontrado' : `Nenhum pedido ${getStatusText(filter).toLowerCase()}`}
            </h3>
            <p className="text-gray-600">
              {filter === 'todos' 
                ? 'Você ainda não tem pedidos.' 
                : `Não há pedidos com status ${getStatusText(filter).toLowerCase()}.`
              }
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/garcom/mesas" className="flex flex-col items-center py-2 px-4 text-gray-400">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className="text-xs">Mesas</span>
          </Link>
          <button className="flex flex-col items-center py-2 px-4 text-green-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">Pedidos</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-400">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Histórico</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-400">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
} 