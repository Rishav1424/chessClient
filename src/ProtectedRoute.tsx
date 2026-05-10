import { useAuthStore } from "./store/useAuthStore";
import { Navigate } from "react-router";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const isAuthenticated: boolean = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
