'use client';

import React, { useState } from 'react';
import { useSocket, Notification } from '../lib/socket';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { notifications, unreadCount, markAsRead, clearNotifications, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return '📝';
      case 'order_update':
        return '🔄';
      case 'table_occupied':
        return '🪑';
      case 'table_freed':
        return '🆓';
      case 'payment_registered':
        return '💰';
      case 'user_created':
        return '👤';
      case 'system_broadcast':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'bg-blue-50 border-blue-200';
      case 'order_update':
        return 'bg-yellow-50 border-yellow-200';
      case 'table_occupied':
        return 'bg-red-50 border-red-200';
      case 'table_freed':
        return 'bg-green-50 border-green-200';
      case 'payment_registered':
        return 'bg-emerald-50 border-emerald-200';
      case 'user_created':
        return 'bg-purple-50 border-purple-200';
      case 'system_broadcast':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notificações"
      >
        {/* Ícone de sino */}
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Indicador de conexão */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel de notificações */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Notificações
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} não lidas)
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Status de conexão */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Botão limpar */}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm">Nenhuma notificação</p>
                  <p className="text-xs mt-1">
                    As notificações aparecerão aqui quando houver atividade
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone */}
                        <div className="text-xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-medium text-gray-900 ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer com informações */}
            {isConnected && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  ⚡ Notificações em tempo real ativas
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter; 