import React, { createContext, useContext, useState } from "react";

interface Login{
    email: string;
    password: string
}

interface AuthContextType{
    isLoggedIn: boolean;
    setIsLoggedIn: (val: boolean) => void;
    login: Login; 
    setLogin: (val: Login) => void;
    role: string;
    setRole: (val: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}){
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [login, setLogin] = useState<Login> ({email: "", password: ""});
    const [role, setRole] = useState("")

    return(
        <AuthContext.Provider value={{isLoggedIn, setIsLoggedIn, login, setLogin, role, setRole}}>
        {children}
        </AuthContext.Provider>
    )


}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(){
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth for pages must be used inside AuthProvider");
    return ctx;
}