import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashBoard from "./dashboard";
import LoginRegister from "./LoginRegister";
import Unauthorized from "./Unauthorized";

export default function App() {
  return (
    <Routes>
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

