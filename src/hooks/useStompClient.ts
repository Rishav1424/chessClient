import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/store/useAuthStore';

export const useStompClient = () => {
  const clientRef = useRef<Client | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {

    if (token && (!clientRef.current)) {
      const socket = new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws');
      const clientInstance = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          console.log('Connected to WebSocket');
        },
        onDisconnect: () => {
          console.log('Disconnected from WebSocket');
        },
        onStompError: (frame: IFrame) => {
          console.error('STOMP error', frame);
        },
        reconnectDelay: 5000,
      });
      clientInstance.activate();
      clientRef.current = clientInstance;
      
    } else if (!token && clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.activate();
    }
    console.log('STOMP Client Ref status:', clientRef.current);

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [token]);

  return clientRef;
};