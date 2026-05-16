import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "@/store/useAuthStore";

// 1. Define an interface so consumers get both the client and the status
interface SocketContextType {
    client: Client;
    isConnected: boolean;
}

const WEB_SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

// 2. Initialize context with default values
const SocketContext = createContext<SocketContextType>({
    client: new Client(), // This will be replaced by the provider, but we need to satisfy the type
    isConnected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuthStore();

    // 3. Add state specifically for the connection status
    const [isConnected, setIsConnected] = useState(false);

    const socket = new SockJS(WEB_SOCKET_URL);
    const clientInstance = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
            console.log("STOMP Connected");
            // 4. Update the connection state when successfully connected!
            setIsConnected(true);
        },
        onDisconnect: () => {
            console.log("STOMP Disconnected");
            // Update state when connection drops
            setIsConnected(false);
        },
        // Optional but highly recommended:
        onWebSocketError: () => setIsConnected(false),
        onStompError: () => setIsConnected(false),
        reconnectDelay: 5000,
    });

    const clientRef = useRef<Client>(clientInstance);

    useEffect(() => {
        if (token) {
            clientInstance.activate();
            clientRef.current = clientInstance;
        }

        if (!token && clientRef.current) {
            clientRef.current.deactivate();
            setIsConnected(false); // Reset status on logout
        }
    }, [token]);

    return (
        // 5. Pass both the client and the status down the tree
        <SocketContext.Provider value={{ client: clientRef.current, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useStompClient = () => useContext(SocketContext);
