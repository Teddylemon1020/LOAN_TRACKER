import {useState} from "react";

interface Board{

}

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);



export default function DashBoard(){
    const handleLogOut = async() => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setLogin({email: "", password: ""});
    };

    


    return(
        <p></p>
    )
}
