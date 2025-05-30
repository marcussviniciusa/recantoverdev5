'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Tipos para notificações
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  connect: (userData: any) => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  emitEvent: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const connectingRef = useRef<boolean>(false);
  
  // Sons de notificação
  const playNotificationSound = (type: string) => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      switch (type) {
        case 'new_order':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFgpGn9v0xXElBSyAzvLZiTYIG2m98OScTgwOUarm7q5dGwc4etryxHAkBSZ+zPLXiTgIGGS7896ZUwwKUKjm7q1fHAY6gNPytG8kBSR+0PLYizcIGGG67+OPVAwKUajm7q1dGwc7hdPysm8kBSR6Zg==';
          break;
        case 'order_ready':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFgpGn9v0xXElBSyAzvLZiTYIG2m98OScTgwOUarm7q5dGwc4etryxHAkBSZ+zPLXiTgIGGS7896ZUwwKUKjm7q1fHAY6gNPytG8kBSR+0PLYizcIGGG67+OPVAwKUajm7q1dGwc7hdPysm8kBSR6Zg==';
          break;
        default:
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFgpGn9v0xXElBSyAzvLZiTYIG2m98OScTgwOUarm7q5dGwc4etryxHAkBSZ+zPLXiTgIGGS7896ZUwwKUKjm7q1fHAY6gNPytG8kBSR+0PLYizcIGGG67+OPVAwKUajm7q1dGwc7hdPysm8kBSR6Zg==';
      }
      audio.volume = 0.3; // Reduzir volume
      audio.play().catch(() => {
        // Ignorar erros de autoplay silenciosamente
      });
    }
  };

  // Mostrar notificação do browser
  const showBrowserNotification = (notification: Notification) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  // Pedir permissão para notificações
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  const connect = (userData: any) => {
    // Evitar múltiplas conexões
    if (socketRef.current?.connected || connectingRef.current) {
      return;
    }

    connectingRef.current = true;
    
    const newSocket = io({
      timeout: 5000,
      retries: 3,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      connectingRef.current = false;
      
      // Autenticar usuário
      newSocket.emit('authenticate', userData);
    });

    newSocket.on('authenticated', () => {
      requestNotificationPermission();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('reconnect', () => {
      setIsConnected(true);
      // Reautenticar após reconexão
      newSocket.emit('authenticate', userData);
    });

    // === LISTENERS DE NOTIFICAÇÕES ===

    // Novos pedidos
    newSocket.on('new_order', (data) => {
      const notification: Notification = {
        id: `order_${data.order._id}_${Date.now()}`,
        type: 'new_order',
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: data.order
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Limitar a 50 notificações
      playNotificationSound('new_order');
      showBrowserNotification(notification);
    });

    // Updates de pedidos
    newSocket.on('order_notification', (data) => {
      const notification: Notification = {
        id: `order_update_${data.order._id}_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: data.order
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      
      if (data.status === 'pronto') {
        playNotificationSound('order_ready');
      } else {
        playNotificationSound('default');
      }
      showBrowserNotification(notification);
    });

    // Notificações de mesa
    newSocket.on('table_notification', (data) => {
      const notification: Notification = {
        id: `table_${data.table._id}_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: data.table
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      playNotificationSound('default');
      showBrowserNotification(notification);
    });

    // Notificações de pagamento
    newSocket.on('payment_notification', (data) => {
      const notification: Notification = {
        id: `payment_${data.payment._id}_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: data.payment
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      playNotificationSound('default');
      showBrowserNotification(notification);
    });

    // Notificações de usuário
    newSocket.on('user_notification', (data) => {
      const notification: Notification = {
        id: `user_${data.user._id}_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: data.user
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      playNotificationSound('default');
      showBrowserNotification(notification);
    });

    // Notificações do sistema
    newSocket.on('system_notification', (data) => {
      const notification: Notification = {
        id: `system_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        data: null
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      playNotificationSound('default');
      showBrowserNotification(notification);
    });

    // Erros silenciosos
    newSocket.on('connect_error', () => {
      connectingRef.current = false;
      // Logs de erro removidos para não poluir console
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      connectingRef.current = false;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const emitEvent = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  // Disponibilizar a função de emit globalmente para integração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).socketEmitter = emitEvent;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).socketEmitter;
      }
    };
  }, []);

  // Limpeza na desmontagem
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    clearNotifications,
    emitEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export type { Notification }; 