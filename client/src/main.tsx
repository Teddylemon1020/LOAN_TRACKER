import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom";
import {AuthProvider} from "./AuthContext";
import App from "./App";
import DashBoard from "./dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <DashBoard />
    </AuthProvider>
  </BrowserRouter>
)
