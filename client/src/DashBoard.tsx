import {useState} from "react";
import { useAuth } from "./AuthContext";

function DashBoard(){
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIsLoggedIn, setLogin } = useAuth();

    const handleLogOut = async() => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setLogin({email: "", password: ""});
    };

    


    return(
        <p></p>
    )
}

export default DashBoard;