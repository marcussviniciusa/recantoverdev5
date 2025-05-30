'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao';
  currentCustomers?: number;
  identification?: string;
  assignedWaiter?: {
    username: string;
    email: string;
  };
  openedAt?: string;
}

export default function GarcomMesas() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [openTableForm, setOpenTableForm] = useState({
    customers: '',
    identification: ''
  });

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
    loadTables();
  }, [router]);

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
        setTables(data.data.tables);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId: string, status: string, currentCustomers?: number, identification?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status, 
          currentCustomers,
          identification,
          assignedWaiter: status === 'ocupada' ? localStorage.getItem('userId') : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadTables(); // Recarregar mesas
        setShowOpenModal(false);
        setOpenTableForm({ customers: '', identification: '' });
      } else {
        alert('Erro ao atualizar mesa: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      alert('Erro de conexão');
    }
  };

  const openTableModal = (table: Table) => {
    setSelectedTable(table);
    setShowOpenModal(true);
  };

  const handleOpenTable = () => {
    if (!selectedTable || !openTableForm.customers || parseInt(openTableForm.customers) <= 0) {
      alert('Por favor, informe o número de clientes válido');
      return;
    }

    if (parseInt(openTableForm.customers) > selectedTable.capacity) {
      alert(`Número de clientes não pode exceder a capacidade da mesa (${selectedTable.capacity})`);
      return;
    }

    updateTableStatus(
      selectedTable._id, 
      'ocupada', 
      parseInt(openTableForm.customers),
      openTableForm.identification || undefined
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'reservada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manutencao': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'ocupada': return 'Ocupada';
      case 'reservada': return 'Reservada';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h2 className="text-2xl font-bold text-gray-900">Mesas</h2>
          <p className="mt-1 text-gray-600">
            Gerencie suas mesas e atendimentos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {tables.filter(t => t.status === 'disponivel').length}
              </p>
              <p className="text-sm text-gray-600">Disponíveis</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {tables.filter(t => t.status === 'ocupada').length}
              </p>
              <p className="text-sm text-gray-600">Ocupadas</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {tables.filter(t => t.status === 'reservada').length}
              </p>
              <p className="text-sm text-gray-600">Reservadas</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {tables.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Mesas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div
              key={table._id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {/* Número da Mesa */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-gray-700">
                    {table.number}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Mesa {table.number}</p>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(table.status)}`}>
                  {getStatusText(table.status)}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Capacidade:</span>
                  <span className="font-medium">{table.capacity} pessoas</span>
                </div>
                {table.currentCustomers && (
                  <div className="flex justify-between">
                    <span>Clientes:</span>
                    <span className="font-medium">{table.currentCustomers}</span>
                  </div>
                )}
                {table.identification && (
                  <div className="flex justify-between">
                    <span>Identificação:</span>
                    <span className="font-medium text-xs text-blue-600">{table.identification}</span>
                  </div>
                )}
                {table.assignedWaiter && (
                  <div className="flex justify-between">
                    <span>Garçom:</span>
                    <span className="font-medium text-xs">{table.assignedWaiter.username}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {table.status === 'disponivel' && (
                  <button
                    onClick={() => openTableModal(table)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Abrir Mesa
                  </button>
                )}
                
                {table.status === 'ocupada' && (
                  <>
                    <Link
                      href={`/garcom/pedido/${table._id}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
                    >
                      Novo Pedido
                    </Link>
                    <Link
                      href={`/garcom/conta/${table._id}`}
                      className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors text-center block"
                    >
                      Fechar Conta
                    </Link>
                    <button
                      onClick={() => updateTableStatus(table._id, 'disponivel')}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Liberar Mesa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tables.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mesa encontrada</h3>
            <p className="text-gray-600">Não há mesas cadastradas no sistema.</p>
          </div>
        )}
      </main>

      {/* Modal de Abertura de Mesa */}
      {showOpenModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Abrir Mesa {selectedTable.number}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de clientes *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedTable.capacity}
                  value={openTableForm.customers}
                  onChange={(e) => setOpenTableForm({...openTableForm, customers: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Máximo ${selectedTable.capacity} pessoas`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificação da mesa (opcional)
                </label>
                <input
                  type="text"
                  value={openTableForm.identification}
                  onChange={(e) => setOpenTableForm({...openTableForm, identification: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Família Silva, João, Evento..."
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajuda a identificar a mesa durante o atendimento
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOpenModal(false);
                  setOpenTableForm({ customers: '', identification: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenTable}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-2 px-4 text-green-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className="text-xs font-medium">Mesas</span>
          </button>
          <Link href="/garcom/pedidos" className="flex flex-col items-center py-2 px-4 text-gray-400">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Pedidos</span>
          </Link>
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