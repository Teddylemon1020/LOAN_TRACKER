import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];  // e.g. ["ADMIN"] or ["USER"]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
}