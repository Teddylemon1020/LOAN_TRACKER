import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashBoard from "./DashBoard";
import LoginRegister from "./LoginRegister";
import Unauthorized from "./Unauthorized";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<LoginRegister />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* User only */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
          <DashBoard/>
        </ProtectedRoute>
      } />
    
    </Routes>
  );
}

