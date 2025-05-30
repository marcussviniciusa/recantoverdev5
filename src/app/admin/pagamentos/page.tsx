'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: string;
  currentCustomers?: number;
  identification?: string;
  assignedWaiter?: {
    username: string;
  };
}

interface Order {
  _id: string;
  tableId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  waiterId: {
    username: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface Payment {
  _id: string;
  tableId: string;
  orderIds: string[];
  totalAmount: number;
  paymentMethods: Array<{
    type: string;
    amount: number;
    description?: string;
  }>;
  status: string;
  paidAt: string;
  tableIdentification?: string;
  changeAmount?: number;
}

interface TableWithData {
  table: Table;
  orders: Order[];
  payment?: Payment;
  totalAmount: number;
  orderCount: number;
  canPay: boolean;
}

export default function AdminPagamentos() {
  const router = useRouter();
  const [tablesData, setTablesData] = useState<TableWithData[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableWithData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'recepcionista') {
      router.push('/auth/login?role=recepcionista');
      return;
    }

    loadData();
  }, [router]);

  useEffect(() => {
    // Filtrar mesas
    let filtered = tablesData;

    if (statusFilter) {
      if (statusFilter === 'pendente') {
        filtered = filtered.filter(td => td.canPay && !td.payment);
      } else if (statusFilter === 'pago') {
        filtered = filtered.filter(td => td.payment?.status === 'pago');
      } else if (statusFilter === 'ocupada') {
        filtered = filtered.filter(td => td.table.status === 'ocupada');
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(td => 
        td.table.number.toString().includes(searchTerm) ||
        (td.table.identification && td.table.identification.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (td.table.assignedWaiter && td.table.assignedWaiter.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTables(filtered);
  }, [tablesData, statusFilter, searchTerm]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar mesas
      const tablesResponse = await fetch('/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const tablesData = await tablesResponse.json();
      if (!tablesData.success) {
        throw new Error('Erro ao carregar mesas');
      }

      // Carregar pedidos
      const ordersResponse = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const ordersData = await ordersResponse.json();
      if (!ordersData.success) {
        throw new Error('Erro ao carregar pedidos');
      }

      // Carregar pagamentos
      const paymentsResponse = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let payments: Payment[] = [];
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.success) {
          payments = paymentsData.data.payments || [];
        }
      }

      // Organizar dados por mesa
      const tableMap = new Map<string, TableWithData>();

      // Inicializar mesas
      tablesData.data.tables.forEach((table: Table) => {
        tableMap.set(table._id, {
          table,
          orders: [],
          totalAmount: 0,
          orderCount: 0,
          canPay: false
        });
      });

      // Organizar pedidos por mesa
      ordersData.data.orders.forEach((order: Order) => {
        const tableData = tableMap.get(order.tableId);
        if (tableData) {
          tableData.orders.push(order);
          if (order.status !== 'cancelado') {
            tableData.totalAmount += order.totalAmount;
            tableData.orderCount++;
          }
        }
      });

      // Verificar se pode pagar (todos pedidos entregues)
      tableMap.forEach((tableData) => {
        if (tableData.orders.length > 0) {
          const deliveredOrders = tableData.orders.filter(o => o.status === 'entregue');
          const paidOrders = tableData.orders.filter(o => o.status === 'pago');
          tableData.canPay = deliveredOrders.length > 0 && (deliveredOrders.length + paidOrders.length) === tableData.orders.length;
        }
      });

      // Adicionar pagamentos
      payments.forEach((payment) => {
        const tableData = tableMap.get(payment.tableId);
        if (tableData) {
          tableData.payment = payment;
        }
      });

      // Converter para array e filtrar apenas mesas com dados relevantes
      const result = Array.from(tableMap.values()).filter(td => 
        td.orders.length > 0 || td.table.status === 'ocupada'
      );

      setTablesData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  const getMethodLabel = (type: string) => {
    const labels = {
      'dinheiro': 'Dinheiro',
      'cartao_debito': 'Cartão de Débito',
      'cartao_credito': 'Cartão de Crédito',
      'pix': 'PIX',
      'outro': 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (tableData: TableWithData) => {
    if (tableData.payment?.status === 'pago') {
      return 'bg-green-100 text-green-800';
    } else if (tableData.canPay) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (tableData.table.status === 'ocupada') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (tableData: TableWithData) => {
    if (tableData.payment?.status === 'pago') {
      return 'Pago';
    } else if (tableData.canPay) {
      return 'Pode Pagar';
    } else if (tableData.table.status === 'ocupada') {
      return 'Em Andamento';
    }
    return 'Disponível';
  };

  // Calcular estatísticas
  const totalPendente = tablesData.filter(td => td.canPay && !td.payment).length;
  const totalPago = tablesData.filter(td => td.payment?.status === 'pago').length;
  const valorTotal = tablesData.filter(td => td.payment?.status === 'pago').reduce((sum, td) => sum + (td.payment?.totalAmount || 0), 0);
  const valorPendente = tablesData.filter(td => td.canPay && !td.payment).reduce((sum, td) => sum + td.totalAmount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Pagamentos por Mesa</h1>
          <p className="mt-1 text-gray-600">
            Controle de pagamentos consolidados por mesa
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
              <p className="text-2xl font-bold text-gray-900">{totalPendente}</p>
              <p className="text-sm text-gray-600">Mesas Pendentes</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalPago}</p>
              <p className="text-sm text-gray-600">Mesas Pagas</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
              <p className="text-sm text-gray-600">Total Recebido</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorPendente)}</p>
              <p className="text-sm text-gray-600">Valor Pendente</p>
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
              placeholder="Número da mesa, identificação ou garçom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="ocupada">Em Andamento</option>
              <option value="pendente">Pode Pagar</option>
              <option value="pago">Pagos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Mesas */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Mesas ({filteredTables.length})
          </h2>
        </div>

        {filteredTables.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mesa encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Tente ajustar os filtros.' 
                : 'Não há mesas com dados para mostrar.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identificação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Garçom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTables.map((tableData) => (
                  <tr key={tableData.table._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-800 font-bold text-sm">{tableData.table.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tableData.table.identification || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tableData.table.currentCustomers ? `${tableData.table.currentCustomers} clientes` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tableData.table.assignedWaiter?.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tableData.orderCount} pedidos</div>
                      <div className="text-sm text-gray-500">
                        {tableData.orders.filter(o => o.status === 'entregue').length} entregues
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(tableData.totalAmount)}</div>
                      {tableData.payment?.changeAmount && tableData.payment.changeAmount > 0 && (
                        <div className="text-xs text-blue-600">Troco: {formatCurrency(tableData.payment.changeAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tableData)}`}>
                        {getStatusLabel(tableData)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tableData.payment ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {formatDateTime(tableData.payment.paidAt)}
                          </div>
                          <div className="text-gray-500">
                            {tableData.payment.paymentMethods.map((pm, i) => (
                              <span key={i} className="text-xs">
                                {getMethodLabel(pm.type)}: {formatCurrency(pm.amount)}
                                {i < tableData.payment!.paymentMethods.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não pago</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {tableData.canPay && !tableData.payment ? (
                        <Link
                          href={`/garcom/conta/${tableData.table._id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Processar Pagamento
                        </Link>
                      ) : tableData.payment ? (
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
    </div>
  );
} 