import { useState } from 'react'

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
  const [isLoggedIn, setIsLoggedIn] = useState (false);
  const [inSignup, setInSignup] = useState (false);
  const [inLogIn, setInLogIn] = useState (false);


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
    
    } catch (err: any){
      setError (err.message)
    } finally{
      setLoading(false);
    }
  }

  const handleLogin = async() =>{
    setError("")

    try {
      
    } catch (err: any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
      
    }
  

  

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {inSignup ? (
        <>
          <h2>Register</h2>
          <input placeholder="Username" value={signup.username} onChange={e => setSignup({...signup, username: e.target.value})} />
          <input placeholder="Email" value={signup.email} onChange={e => setSignup({...signup, email: e.target.value})} />
          <input placeholder="Password" type="password" value={signup.password} onChange={e => setSignup({...signup, password: e.target.value})} />
          <input placeholder="Confirm Password" type="password" value={signup.confirmpassword} onChange={e => setSignup({...signup, confirmpassword: e.target.value})} />
          <button onClick={handSignup}>Register</button>
          <button onClick={() => { setInSignup(false); setInLogIn(true); }}>Go to Login</button>
        </>
      ) : (
        <>
          <h2>Login</h2>
          <input placeholder="Username" value={login.username} onChange={e => setLogin({...login, username: e.target.value})} />
          <input placeholder="Password" type="password" value={login.password} onChange={e => setLogin({...login, password: e.target.value})} />
          <button onClick={handleLogin}>Login</button>
          <button onClick={() => { setInLogIn(false); setInSignup(true); }}>Go to Register</button>
        </>
      )}
    </div>
  )
  
}

export default LoginRegister
