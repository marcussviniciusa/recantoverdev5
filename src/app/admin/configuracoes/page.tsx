'use client';

import { useState, useEffect } from 'react';

interface RestaurantConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface NotificationConfig {
  soundEnabled: boolean;
  volume: number;
  newOrderSound: string;
  readyOrderSound: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  emailNotifications: boolean;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('restaurant');
  const [loading, setLoading] = useState(false);
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig>({
    name: 'Recanto Verde',
    address: '',
    phone: '',
    email: '',
    openingHours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '08:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '21:00', closed: false }
    }
  });

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    soundEnabled: true,
    volume: 80,
    newOrderSound: 'notification',
    readyOrderSound: 'bell',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    emailNotifications: false
  });

  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carregar configurações
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Carregar dados do usuário
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userRole = localStorage.getItem('userRole') || '';
      
      setUserProfile(prev => ({
        ...prev,
        username: userName,
        email: userEmail,
        role: userRole
      }));

      // Carregar configurações salvas do localStorage
      const savedRestaurantConfig = localStorage.getItem('restaurantConfig');
      if (savedRestaurantConfig) {
        setRestaurantConfig(JSON.parse(savedRestaurantConfig));
      }

      const savedNotificationConfig = localStorage.getItem('notificationConfig');
      if (savedNotificationConfig) {
        setNotificationConfig(JSON.parse(savedNotificationConfig));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Salvar configurações do restaurante
  const saveRestaurantConfig = async () => {
    setLoading(true);
    try {
      localStorage.setItem('restaurantConfig', JSON.stringify(restaurantConfig));
      alert('Configurações do restaurante salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações de notificação
  const saveNotificationConfig = async () => {
    setLoading(true);
    try {
      localStorage.setItem('notificationConfig', JSON.stringify(notificationConfig));
      alert('Configurações de notificação salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Alterar senha
  const changePassword = async () => {
    if (!userProfile.currentPassword || !userProfile.newPassword) {
      alert('Preencha a senha atual e a nova senha');
      return;
    }

    if (userProfile.newPassword !== userProfile.confirmPassword) {
      alert('Nova senha e confirmação não coincidem');
      return;
    }

    if (userProfile.newPassword.length < 6) {
      alert('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: userProfile.currentPassword,
          newPassword: userProfile.newPassword
        })
      });

      if (response.ok) {
        alert('Senha alterada com sucesso!');
        setUserProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  // Fazer backup dos dados
  const exportBackup = () => {
    const backupData = {
      restaurantConfig,
      notificationConfig,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `recanto-verde-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('Backup exportado com sucesso!');
  };

  // Restaurar backup
  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.restaurantConfig) {
          setRestaurantConfig(backupData.restaurantConfig);
          localStorage.setItem('restaurantConfig', JSON.stringify(backupData.restaurantConfig));
        }
        
        if (backupData.notificationConfig) {
          setNotificationConfig(backupData.notificationConfig);
          localStorage.setItem('notificationConfig', JSON.stringify(backupData.notificationConfig));
        }
        
        alert('Backup restaurado com sucesso!');
      } catch (error) {
        alert('Erro ao restaurar backup. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'restaurant', name: 'Restaurante', icon: '🏪' },
    { id: 'notifications', name: 'Notificações', icon: '🔔' },
    { id: 'profile', name: 'Perfil', icon: '👤' },
    { id: 'backup', name: 'Backup', icon: '💾' }
  ];

  const weekDays = [
    { key: 'monday', name: 'Segunda-feira' },
    { key: 'tuesday', name: 'Terça-feira' },
    { key: 'wednesday', name: 'Quarta-feira' },
    { key: 'thursday', name: 'Quinta-feira' },
    { key: 'friday', name: 'Sexta-feira' },
    { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Configure o sistema de acordo com suas necessidades
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Configurações do Restaurante */}
        {activeTab === 'restaurant' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Informações do Restaurante</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  value={restaurantConfig.name}
                  onChange={(e) => setRestaurantConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={restaurantConfig.phone}
                  onChange={(e) => setRestaurantConfig(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={restaurantConfig.email}
                  onChange={(e) => setRestaurantConfig(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={restaurantConfig.address}
                  onChange={(e) => setRestaurantConfig(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Horários de Funcionamento */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Horários de Funcionamento</h4>
              <div className="space-y-3">
                {weekDays.map(day => (
                  <div key={day.key} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700">
                      {day.name}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!restaurantConfig.openingHours[day.key as keyof typeof restaurantConfig.openingHours].closed}
                        onChange={(e) => {
                          setRestaurantConfig(prev => ({
                            ...prev,
                            openingHours: {
                              ...prev.openingHours,
                              [day.key]: {
                                ...prev.openingHours[day.key as keyof typeof prev.openingHours],
                                closed: !e.target.checked
                              }
                            }
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Aberto</span>
                      
                      {!restaurantConfig.openingHours[day.key as keyof typeof restaurantConfig.openingHours].closed && (
                        <>
                          <input
                            type="time"
                            value={restaurantConfig.openingHours[day.key as keyof typeof restaurantConfig.openingHours].open}
                            onChange={(e) => {
                              setRestaurantConfig(prev => ({
                                ...prev,
                                openingHours: {
                                  ...prev.openingHours,
                                  [day.key]: {
                                    ...prev.openingHours[day.key as keyof typeof prev.openingHours],
                                    open: e.target.value
                                  }
                                }
                              }));
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-600">às</span>
                          <input
                            type="time"
                            value={restaurantConfig.openingHours[day.key as keyof typeof restaurantConfig.openingHours].close}
                            onChange={(e) => {
                              setRestaurantConfig(prev => ({
                                ...prev,
                                openingHours: {
                                  ...prev.openingHours,
                                  [day.key]: {
                                    ...prev.openingHours[day.key as keyof typeof prev.openingHours],
                                    close: e.target.value
                                  }
                                }
                              }));
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveRestaurantConfig}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        )}

        {/* Configurações de Notificação */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configurações de Notificação</h3>
            
            <div className="space-y-4">
              {/* Som habilitado */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sons habilitados</label>
                  <p className="text-xs text-gray-500">Ativar sons para notificações</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationConfig.soundEnabled}
                  onChange={(e) => setNotificationConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Volume */}
              {notificationConfig.soundEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {notificationConfig.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={notificationConfig.volume}
                    onChange={(e) => setNotificationConfig(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Sons específicos */}
              {notificationConfig.soundEnabled && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Som para novos pedidos
                    </label>
                    <select
                      value={notificationConfig.newOrderSound}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, newOrderSound: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="notification">Notificação padrão</option>
                      <option value="bell">Sino</option>
                      <option value="chime">Carrilhão</option>
                      <option value="alert">Alerta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Som para pedidos prontos
                    </label>
                    <select
                      value={notificationConfig.readyOrderSound}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, readyOrderSound: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bell">Sino</option>
                      <option value="notification">Notificação padrão</option>
                      <option value="chime">Carrilhão</option>
                      <option value="alert">Alerta</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Horário silencioso */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Horário silencioso</label>
                    <p className="text-xs text-gray-500">Desabilitar sons em horários específicos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationConfig.quietHours.enabled}
                    onChange={(e) => setNotificationConfig(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {notificationConfig.quietHours.enabled && (
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm text-gray-600">De</span>
                    <input
                      type="time"
                      value={notificationConfig.quietHours.start}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">até</span>
                    <input
                      type="time"
                      value={notificationConfig.quietHours.end}
                      onChange={(e) => setNotificationConfig(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notificações por email</label>
                  <p className="text-xs text-gray-500">Receber relatórios diários por email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationConfig.emailNotifications}
                  onChange={(e) => setNotificationConfig(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={saveNotificationConfig}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        )}

        {/* Perfil do Usuário */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Perfil do Usuário</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    value={userProfile.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papel
                  </label>
                  <input
                    type="text"
                    value={userProfile.role === 'admin' ? 'Administrador' : 'Garçom'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Alteração de senha */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Alterar Senha</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha atual
                    </label>
                    <input
                      type="password"
                      value={userProfile.currentPassword}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova senha
                      </label>
                      <input
                        type="password"
                        value={userProfile.newPassword}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nova senha
                      </label>
                      <input
                        type="password"
                        value={userProfile.confirmPassword}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup e Restauração */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Backup e Restauração</h3>
            
            <div className="space-y-6">
              {/* Exportar backup */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-blue-900 mb-2">Exportar Backup</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Faça download das configurações atuais em formato JSON para backup.
                </p>
                <button
                  onClick={exportBackup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  📥 Baixar Backup
                </button>
              </div>

              {/* Importar backup */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-yellow-900 mb-2">Restaurar Backup</h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Selecione um arquivo de backup para restaurar as configurações.
                  <br />
                  <strong>Atenção:</strong> Isso substituirá as configurações atuais.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={importBackup}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-white hover:file:bg-yellow-700"
                />
              </div>

              {/* Informações do sistema */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Informações do Sistema</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Versão do Sistema: 1.0.0</div>
                  <div>Última atualização: {new Date().toLocaleDateString('pt-BR')}</div>
                  <div>Usuário logado: {userProfile.username}</div>
                  <div>Papel: {userProfile.role === 'admin' ? 'Administrador' : 'Garçom'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 