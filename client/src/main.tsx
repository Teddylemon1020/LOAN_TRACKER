import ReactDOM from "react-dom/client"
import {AuthProvider} from "./AuthContext";
import App from "./App";
import DashBoard from "./dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <DashBoard />
  </AuthProvider>
)
