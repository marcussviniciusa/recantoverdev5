'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  waiterPerformance: Array<{
    name: string;
    ordersCount: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  tableOccupancy: {
    averageOccupancy: number;
    peakHours: string[];
    tableUtilization: Array<{
      tableNumber: number;
      utilizationRate: number;
    }>;
  };
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function AdminRelatorios() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'recepcionista') {
      router.push('/auth/login?role=recepcionista');
      return;
    }

    loadReportData();
  }, [router, dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPredefinedPeriod = (period: string) => {
    setSelectedPeriod(period);
    const end = new Date();
    let start = new Date();

    switch (period) {
      case '1d':
        start = new Date(end);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${dateRange.startDate}-${dateRange.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar relatórios</h2>
          <button 
            onClick={loadReportData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h1>
          <p className="mt-1 text-gray-600">
            Insights e métricas do restaurante
          </p>
        </div>
        <button
          onClick={exportReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          📊 Exportar PDF
        </button>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-2">
            {[
              { key: '1d', label: 'Hoje' },
              { key: '7d', label: '7 dias' },
              { key: '30d', label: '30 dias' },
              { key: '90d', label: '90 dias' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setPredefinedPeriod(period.key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Ocupação</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.tableOccupancy.averageOccupancy.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Produtos Mais Vendidos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {reportData.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-800 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} vendidos</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance dos Garçons */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance dos Garçons</h3>
          <div className="space-y-3">
            {reportData.waiterPerformance.slice(0, 5).map((waiter, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-800 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{waiter.name}</p>
                    <p className="text-sm text-gray-500">{waiter.ordersCount} pedidos</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(waiter.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Faturamento Diário */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Faturamento Diário</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.dailyRevenue.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{day.orders}</td>
                  <td className="px-4 py-2 text-sm font-bold text-green-600">
                    {formatCurrency(day.revenue)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatCurrency(day.orders > 0 ? day.revenue / day.orders : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilização das Mesas */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilização das Mesas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Horários de Pico</h4>
            <div className="space-y-2">
              {reportData.tableOccupancy.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">{hour}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Taxa de Utilização por Mesa</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reportData.tableOccupancy.tableUtilization.map((table, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Mesa {table.tableNumber}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${table.utilizationRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-10">{table.utilizationRate.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Insights */}
      <div className="bg-blue-50 rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Insights e Recomendações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🍽️ Produtos</h4>
            <p className="text-blue-800">
              {reportData.topProducts.length > 0 && 
                `"${reportData.topProducts[0].name}" é o produto mais vendido com ${reportData.topProducts[0].quantity} unidades.`
              }
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">👨‍💼 Equipe</h4>
            <p className="text-blue-800">
              {reportData.waiterPerformance.length > 0 && 
                `${reportData.waiterPerformance[0].name} teve o melhor desempenho com ${reportData.waiterPerformance[0].ordersCount} pedidos.`
              }
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🕐 Horários</h4>
            <p className="text-blue-800">
              {reportData.tableOccupancy.peakHours.length > 0 && 
                `Horário de pico: ${reportData.tableOccupancy.peakHours.join(', ')}`
              }
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📊 Ocupação</h4>
            <p className="text-blue-800">
              Taxa média de ocupação: {reportData.tableOccupancy.averageOccupancy.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 