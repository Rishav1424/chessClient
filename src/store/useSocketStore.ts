import { create } from "zustand";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const WEB_SOCKET_URL =
    import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

interface SocketState {
    client: Client | null;
    isConnected: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    client: null,
    isConnected: false,
    connect: (token: string) => {
        const currentClient = get().client;
        if (currentClient?.connected) return;

        if (currentClient) {
            currentClient.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(WEB_SOCKET_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            debug: (str) => console.log("STOMP Frame:", str),
            onConnect: () => {
                console.log("STOMP Connected");
                set({ isConnected: true });
            },
            onDisconnect: () => {
                console.log("STOMP Disconnected");
                set({ isConnected: false });
            },
            onWebSocketError: () => set({ isConnected: false }),
            onStompError: () => set({ isConnected: false }),
            reconnectDelay: 5000,
        });

        client.activate();
        set({ client });
    },
    disconnect: () => {
        const client = get().client;
        if (client) {
            client.deactivate();
        }
        set({ client: null, isConnected: false });
    },
}));
