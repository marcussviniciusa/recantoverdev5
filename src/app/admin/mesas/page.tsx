'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
  currentCustomers?: number;
  openedAt?: string;
  closedAt?: string;
  assignedWaiter?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TableFormData {
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
}

interface StatusStats {
  disponivel: number;
  ocupada: number;
  reservada: number;
  manutencao: number;
}

export default function AdminMesas() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [capacityFilter, setCapacityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    number: 0,
    capacity: 2,
    status: 'disponivel'
  });
  const [stats, setStats] = useState<StatusStats>({
    disponivel: 0,
    ocupada: 0,
    reservada: 0,
    manutencao: 0
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'recepcionista') {
      router.push('/auth/login?role=recepcionista');
      return;
    }

    loadTables();
  }, [router]);

  useEffect(() => {
    // Filtrar tabelas
    let filtered = tables;

    if (statusFilter) {
      filtered = filtered.filter(table => table.status === statusFilter);
    }

    if (capacityFilter) {
      if (capacityFilter === '1-2') {
        filtered = filtered.filter(table => table.capacity <= 2);
      } else if (capacityFilter === '3-4') {
        filtered = filtered.filter(table => table.capacity >= 3 && table.capacity <= 4);
      } else if (capacityFilter === '5-8') {
        filtered = filtered.filter(table => table.capacity >= 5 && table.capacity <= 8);
      } else if (capacityFilter === '9+') {
        filtered = filtered.filter(table => table.capacity >= 9);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.number.toString().includes(searchTerm) ||
        table.assignedWaiter?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTables(filtered);
  }, [tables, statusFilter, capacityFilter, searchTerm]);

  const loadTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const tablesData = data.data.tables;
        setTables(tablesData);

        // Calcular estatísticas
        const newStats = tablesData.reduce((acc: StatusStats, table: Table) => {
          acc[table.status] = (acc[table.status] || 0) + 1;
          return acc;
        }, {
          disponivel: 0,
          ocupada: 0,
          reservada: 0,
          manutencao: 0
        });
        
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number,
        capacity: table.capacity,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setFormData({
        number: tables.length + 1,
        capacity: 2,
        status: 'disponivel'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTable(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingTable ? `/api/tables/${editingTable._id}` : '/api/tables';
      const method = editingTable ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await loadTables();
        closeModal();
        alert(editingTable ? 'Mesa atualizada com sucesso!' : 'Mesa criada com sucesso!');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      alert('Erro de conexão');
    }
  };

  const handleDelete = async (table: Table) => {
    if (table.status === 'ocupada') {
      alert('Não é possível excluir uma mesa ocupada!');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a Mesa ${table.number}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tables/${table._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        await loadTables();
        alert('Mesa excluída com sucesso!');
      } else {
        alert('Erro ao excluir mesa: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      alert('Erro de conexão');
    }
  };

  const changeTableStatus = async (table: Table, newStatus: string) => {
    if (table.status === 'ocupada' && newStatus !== 'ocupada') {
      if (!confirm('Esta mesa está ocupada. Tem certeza que deseja alterar o status? Isso pode afetar o atendimento.')) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tables/${table._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        await loadTables();
      } else {
        alert('Erro ao alterar status: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro de conexão');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'reservada': return 'bg-yellow-100 text-yellow-800';
      case 'manutencao': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'ocupada': return 'Ocupada';
      case 'reservada': return 'Reservada';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Mesas</h1>
          <p className="mt-1 text-gray-600">
            Controle administrativo de todas as mesas do restaurante
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova Mesa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.disponivel}</p>
              <p className="text-sm text-gray-600">Disponíveis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.ocupada}</p>
              <p className="text-sm text-gray-600">Ocupadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.reservada}</p>
              <p className="text-sm text-gray-600">Reservadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.manutencao}</p>
              <p className="text-sm text-gray-600">Manutenção</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="disponivel">Disponível</option>
              <option value="ocupada">Ocupada</option>
              <option value="reservada">Reservada</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidade
            </label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas as capacidades</option>
              <option value="1-2">1-2 pessoas</option>
              <option value="3-4">3-4 pessoas</option>
              <option value="5-8">5-8 pessoas</option>
              <option value="9+">9+ pessoas</option>
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
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || capacityFilter 
                ? 'Tente ajustar os filtros.' 
                : 'Comece adicionando mesas ao restaurante.'
              }
            </p>
            {!searchTerm && !statusFilter && !capacityFilter && (
              <button
                onClick={() => openModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Adicionar Primeira Mesa
              </button>
            )}
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
                    Capacidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Garçom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTables.map((table) => (
                  <tr key={table._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-800 font-bold">{table.number}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Mesa {table.number}</div>
                          <div className="text-sm text-gray-500">ID: {table._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.capacity} {table.capacity === 1 ? 'pessoa' : 'pessoas'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={table.status}
                        onChange={(e) => changeTableStatus(table, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(table.status)} focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="disponivel">Disponível</option>
                        <option value="ocupada">Ocupada</option>
                        <option value="reservada">Reservada</option>
                        <option value="manutencao">Manutenção</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.currentCustomers ? `${table.currentCustomers}/${table.capacity}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.assignedWaiter?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.status === 'ocupada' && table.openedAt 
                        ? `Aberta: ${formatTime(table.openedAt)}`
                        : table.status === 'disponivel' && table.closedAt
                        ? `Fechada: ${formatTime(table.closedAt)}`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openModal(table)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          className="text-red-600 hover:text-red-700"
                          disabled={table.status === 'ocupada'}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Mesa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da Mesa *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidade *
                  </label>
                  <select
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 pessoa</option>
                    <option value={2}>2 pessoas</option>
                    <option value={3}>3 pessoas</option>
                    <option value={4}>4 pessoas</option>
                    <option value={5}>5 pessoas</option>
                    <option value={6}>6 pessoas</option>
                    <option value={8}>8 pessoas</option>
                    <option value={10}>10 pessoas</option>
                    <option value={12}>12 pessoas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="reservada">Reservada</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingTable ? 'Atualizar' : 'Criar'} Mesa
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