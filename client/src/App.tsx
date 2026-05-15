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


function App() {
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
  

  

  return (<div> 
    {loading && <p> Loading...</p>}
    {error && <p>{error}</p> }
  </div>)
  
}

export default App
