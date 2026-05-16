import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface Signup {
  username: string;
  password: string; 
  email: string; 
  confirmpassword: string;
  role: string; 
}

interface Login {
  username: Signup["username"];
  password: Signup["password"]; 
}


function LoginRegister() {
  const [signup, setSignup] = useState<Signup>({username: "", password: "", email: "", confirmpassword: "", role: "USER" });
  const [login, setLogin] = useState<Login>({username: "", password: ""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState (false);
  const [inSignup, setInSignup] = useState (false);

  const { setIsLoggedIn, setRole } = useAuth();
  const navigate = useNavigate();

  const handSignup = async () =>{
    setError("");

    if (!signup.username || !signup.password || !signup.confirmpassword || signup.email){
      setError("Please fill all the fields");
      return;
    }

    setLoading(true);
    try{

      if (signup.password !== signup.confirmpassword) throw new Error("password and confirm password is not the same")


      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(signup),
      });


      //email error and occupancy check
      if (!res.ok){
        const errorData = await res.json();
        throw new Error (errorData.email ?? errorData.message ?? "Email Taken or Error")
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      setRole(data.role);
      navigate("/dashboard");

    } catch (err){
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally{
      setLoading(false);
    }
  }

  const handleLogin = async() =>{
    setError("");

    if (!login.username || !login.password) {
      setError("Please fill all the fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message ?? "Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      setRole(data.role);
      navigate("/dashboard");
    } catch (err){
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally{
      setLoading(false);
    }

    }
  

  

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const primaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "0.95rem",
    cursor: "pointer",
    fontWeight: 600,
  };

  const linkBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: 0,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "380px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {inSignup ? (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Create account</h2>
              <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>Fill in the details below to register</p>
            </div>

            {error && <p style={{ margin: 0, color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

            <input style={inputStyle} placeholder="Username" value={signup.username} onChange={e => setSignup({...signup, username: e.target.value})} />
            <input style={inputStyle} placeholder="Email" value={signup.email} onChange={e => setSignup({...signup, email: e.target.value})} />
            <input style={inputStyle} placeholder="Password" type="password" value={signup.password} onChange={e => setSignup({...signup, password: e.target.value})} />
            <input style={inputStyle} placeholder="Confirm Password" type="password" value={signup.confirmpassword} onChange={e => setSignup({...signup, confirmpassword: e.target.value})} />

            <button style={primaryBtn} onClick={handSignup} disabled={loading}>{loading ? "Registering..." : "Register"}</button>

            <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
              Already have an account?{" "}
              <button style={linkBtn} onClick={() => { setInSignup(false); }}>Login</button>
            </p>
          </>
        ) : (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Welcome back</h2>
              <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>Sign in to your account</p>
            </div>

            {error && <p style={{ margin: 0, color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

            <input style={inputStyle} placeholder="Username" value={login.username} onChange={e => setLogin({...login, username: e.target.value})} />
            <input style={inputStyle} placeholder="Password" type="password" value={login.password} onChange={e => setLogin({...login, password: e.target.value})} />

            <button style={primaryBtn} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Login"}</button>

            <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
              Don't have an account?{" "}
              <button style={linkBtn} onClick={() => { setInSignup(true); }}>Register</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
  
}

export default LoginRegister
