'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '../../../../lib/socket';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  observations?: string;
  createdAt: string;
  waiterId: {
    username: string;
  };
}

interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: string;
  currentCustomers?: number;
  identification?: string;
}

interface OrdersByStatus {
  preparando: Order[];
  pronto: Order[];
  entregue: Order[];
  pago: Order[];
}

interface Summary {
  totalOrders: number;
  totalAmount: number;
  unpaidAmount: number;
  paidAmount: number;
  canPayNow: boolean;
}

interface PaymentMethod {
  type: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'outro';
  amount: number;
  description?: string;
}

export default function FecharConta() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;
  const { emitEvent } = useSocket();

  const [table, setTable] = useState<Table | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>({
    preparando: [],
    pronto: [],
    entregue: [],
    pago: []
  });
  const [summary, setSummary] = useState<Summary>({
    totalOrders: 0,
    totalAmount: 0,
    unpaidAmount: 0,
    paidAmount: 0,
    canPayNow: false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadTableData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/mesa/${tableId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setTable(data.data.table);
        setOrders(data.data.orders);
        setOrdersByStatus(data.data.ordersByStatus);
        setSummary(data.data.summary);
      } else {
        alert('Erro ao carregar dados: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro de conexão');
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
      loadTableData();
    }
  }, [tableId, router, loadTableData]);

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { type: 'dinheiro', amount: 0 }]);
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const getTotalPaid = () => {
    return paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  };

  const getChange = () => {
    const totalPaid = getTotalPaid();
    return Math.max(0, totalPaid - summary.unpaidAmount);
  };

  const isPaymentValid = () => {
    const totalPaid = getTotalPaid();
    return totalPaid >= summary.unpaidAmount && paymentMethods.length > 0;
  };

  const processPayment = async () => {
    if (!isPaymentValid()) {
      alert('Valor pago deve ser igual ou maior que o valor da conta');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/mesa/${tableId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethods: paymentMethods
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Pagamento processado:', data.data.payment);
        
        // Emitir evento Socket.IO para notificar admin
        emitEvent('payment_completed', {
          tableId: tableId,
          tableNumber: table?.number,
          totalAmount: summary.unpaidAmount,
          paymentMethods: paymentMethods
        });
        
        alert('Pagamento processado com sucesso! A mesa pode ser liberada.');
        router.push('/garcom/mesas');
      } else {
        alert('Erro ao processar pagamento: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparando': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pronto': return 'bg-green-100 text-green-800 border-green-200';
      case 'entregue': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pago': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preparando': return 'Preparando';
      case 'pronto': return 'Pronto';
      case 'entregue': return 'Entregue';
      case 'pago': return 'Pago';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando conta...</p>
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
    <div className="min-h-screen bg-gray-50 pb-20">
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
                <h1 className="text-xl font-bold text-gray-900">Fechar Conta</h1>
                <p className="text-sm text-gray-500">
                  Mesa {table.number}
                  {table.identification && ` • ${table.identification}`}
                  {table.currentCustomers && ` • ${table.currentCustomers} clientes`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">R$ {summary.unpaidAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">A pagar</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Resumo da Conta */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Resumo da Conta</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{summary.totalOrders}</p>
              <p className="text-sm text-gray-600">Total de Pedidos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">R$ {summary.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Valor Total</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">R$ {summary.unpaidAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">A Pagar</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">R$ {summary.paidAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Já Pago</p>
            </div>
          </div>

          {summary.canPayNow && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Processar Pagamento - R$ {summary.unpaidAmount.toFixed(2)}
            </button>
          )}

          {!summary.canPayNow && summary.unpaidAmount === 0 && (
            <div className="text-center py-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">✅ Conta já está paga!</p>
              <p className="text-sm text-green-600 mt-1">A mesa pode ser liberada</p>
            </div>
          )}

          {!summary.canPayNow && summary.unpaidAmount > 0 && (
            <div className="text-center py-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-700 font-medium">⏳ Aguardando entrega dos pedidos</p>
              <p className="text-sm text-yellow-600 mt-1">Só é possível processar pagamento após entregar todos os pedidos</p>
            </div>
          )}
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-6">
          {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
            statusOrders.length > 0 && (
              <div key={status} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border mr-3 ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                  {statusOrders.length} pedido(s)
                </h3>
                
                <div className="space-y-4">
                  {statusOrders.map((order: Order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            Pedido #{order._id.slice(-6)} • {formatTime(order.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Garçom: {order.waiterId.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">R$ {order.totalAmount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{order.items.length} itens</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.map((item: OrderItem, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="font-medium">R$ {item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {order.observations && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Obs:</strong> {order.observations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Processar Pagamento
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span>Total a pagar:</span>
                <span className="font-bold">R$ {summary.unpaidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pago:</span>
                <span className="font-bold text-green-600">R$ {getTotalPaid().toFixed(2)}</span>
              </div>
              {getChange() > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Troco:</span>
                  <span className="font-bold">R$ {getChange().toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Métodos de Pagamento</h4>
                <button
                  onClick={addPaymentMethod}
                  className="text-green-600 hover:text-green-700"
                >
                  + Adicionar
                </button>
              </div>

              {paymentMethods.map((method, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <select
                      value={method.type}
                      onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                      className="flex-1 mr-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="outro">Outro</option>
                    </select>
                    <button
                      onClick={() => removePaymentMethod(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={method.amount}
                    onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="Valor (R$)"
                  />
                </div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhum método de pagamento adicionado</p>
                  <button
                    onClick={addPaymentMethod}
                    className="mt-2 text-green-600 hover:text-green-700"
                  >
                    + Adicionar método de pagamento
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethods([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                disabled={submitting || !isPaymentValid()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Processando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 