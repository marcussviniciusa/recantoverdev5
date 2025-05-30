'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  tableId: {
    _id: string;
    number: number;
  };
  items: Array<{
    productName: string;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    observations?: string;
  }>;
  totalAmount: number;
  status: string;
  waiterId: {
    username: string;
  };
  createdAt: string;
  payment?: Payment;
}

interface Payment {
  _id: string;
  totalAmount: number;
  paymentMethods: Array<{
    method: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'vale_refeicao';
    amount: number;
  }>;
  tipAmount?: number;
  splitBetween?: number;
  notes?: string;
  paidAt: string;
  status: 'pendente' | 'pago' | 'cancelado';
}

interface PaymentFormData {
  orderId: string;
  totalAmount: number;
  paymentMethods: Array<{
    method: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'vale_refeicao';
    amount: number;
  }>;
  tipAmount: number;
  splitBetween: number;
  notes: string;
}

export default function AdminPagamentos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    orderId: '',
    totalAmount: 0,
    paymentMethods: [{ method: 'dinheiro', amount: 0 }],
    tipAmount: 0,
    splitBetween: 1,
    notes: ''
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'recepcionista') {
      router.push('/auth/login?role=recepcionista');
      return;
    }

    loadOrders();
  }, [router]);

  useEffect(() => {
    // Filtrar pedidos
    let filtered = orders;

    if (statusFilter) {
      if (statusFilter === 'pendente') {
        filtered = filtered.filter(order => order.status === 'entregue' && !order.payment);
      } else if (statusFilter === 'pago') {
        filtered = filtered.filter(order => order.payment?.status === 'pago');
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.tableId.number.toString().includes(searchTerm) ||
        order.waiterId.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

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

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setFormData({
      orderId: order._id,
      totalAmount: order.totalAmount,
      paymentMethods: [{ method: 'dinheiro', amount: order.totalAmount }],
      tipAmount: 0,
      splitBetween: 1,
      notes: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      paymentMethods: [...formData.paymentMethods, { method: 'dinheiro', amount: 0 }]
    });
  };

  const removePaymentMethod = (index: number) => {
    const newMethods = formData.paymentMethods.filter((_, i) => i !== index);
    setFormData({ ...formData, paymentMethods: newMethods });
  };

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    const newMethods = [...formData.paymentMethods];
    newMethods[index] = { ...newMethods[index], [field]: value };
    setFormData({ ...formData, paymentMethods: newMethods });
  };

  const getTotalMethodsAmount = () => {
    return formData.paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalMethodsAmount = getTotalMethodsAmount();
    const expectedTotal = (formData.totalAmount + formData.tipAmount) / formData.splitBetween;
    
    if (Math.abs(totalMethodsAmount - expectedTotal) > 0.01) {
      alert(`Total dos métodos de pagamento (${totalMethodsAmount.toFixed(2)}) não confere com o valor esperado (${expectedTotal.toFixed(2)})`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await loadOrders();
        closeModal();
        alert('Pagamento registrado com sucesso!');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      alert('Erro de conexão');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getMethodLabel = (method: string) => {
    const labels = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão de Débito',
      'cartao_credito': 'Cartão de Crédito',
      'pix': 'PIX',
      'vale_refeicao': 'Vale Refeição'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getStatusColor = (order: Order) => {
    if (order.payment?.status === 'pago') {
      return 'bg-green-100 text-green-800';
    } else if (order.status === 'entregue') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (order: Order) => {
    if (order.payment?.status === 'pago') {
      return 'Pago';
    } else if (order.status === 'entregue') {
      return 'Pendente';
    }
    return order.status;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Pagamentos</h1>
          <p className="mt-1 text-gray-600">
            Registrar e controlar pagamentos dos pedidos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'entregue' && !o.payment).length}
              </p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.payment?.status === 'pago').length}
              </p>
              <p className="text-sm text-gray-600">Pagos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(orders.filter(o => o.payment?.status === 'pago').reduce((sum, o) => sum + o.totalAmount, 0))}
              </p>
              <p className="text-sm text-gray-600">Total Recebido</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(orders.filter(o => o.payment?.tipAmount).reduce((sum, o) => sum + (o.payment?.tipAmount || 0), 0))}
              </p>
              <p className="text-sm text-gray-600">Total Gorjetas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Número da mesa ou garçom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status do Pagamento
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pedidos ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Tente ajustar os filtros.' 
                : 'Não há pedidos para mostrar.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Garçom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order._id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">{order.items.length} itens</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-800 font-bold text-sm">{order.tableId.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.waiterId.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                      {order.payment?.tipAmount && (
                        <div className="text-xs text-green-600">+ {formatCurrency(order.payment.tipAmount)} gorjeta</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order)}`}>
                        {getStatusLabel(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {order.status === 'entregue' && !order.payment ? (
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Registrar Pagamento
                        </button>
                      ) : order.payment ? (
                        <span className="text-green-600">✓ Pago</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Registrar Pagamento - Mesa {selectedOrder.tableId.number}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Resumo do Pedido */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Itens do Pedido</h3>
                <div className="space-y-1">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Divisão de Conta */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dividir conta entre
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.splitBetween}
                      onChange={(e) => setFormData({...formData, splitBetween: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gorjeta (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tipAmount}
                      onChange={(e) => setFormData({...formData, tipAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Valor por pessoa */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Valor por pessoa:</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency((formData.totalAmount + formData.tipAmount) / formData.splitBetween)}
                    </p>
                  </div>
                </div>

                {/* Métodos de Pagamento */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Métodos de Pagamento</h3>
                    <button
                      type="button"
                      onClick={addPaymentMethod}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Adicionar método
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <select
                          value={method.method}
                          onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="pix">PIX</option>
                          <option value="vale_refeicao">Vale Refeição</option>
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Valor"
                          value={method.amount || ''}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        {formData.paymentMethods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePaymentMethod(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total dos métodos */}
                  <div className="mt-3 text-right">
                    <span className="text-sm text-gray-600">
                      Total métodos: {formatCurrency(getTotalMethodsAmount())}
                    </span>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Informações adicionais sobre o pagamento..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    💰 Registrar Pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 