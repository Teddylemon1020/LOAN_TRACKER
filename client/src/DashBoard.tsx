import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface Loan {
    id: string;
    amount: string;
    date: string;
    term: string;
    rate: string;
    monthly: string;
    repayment: string;
    status: string;
}

interface User {
    id: string;
    username: string;
    email: string;
}

function DashBoard(){
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIsLoggedIn, setLogin, role } = useAuth();
    const navigate = useNavigate();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [loanForm, setLoanForm] = useState({ amount: "", term: "", rate: "" });

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserLoans, setSelectedUserLoans] = useState<Loan[]>([]);

    const handleLogOut = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setLogin({email: "", password: ""});
        navigate("/login");
    };

    const computeMonthly = (amount: number, rate: number, term: number) => {
        const r = rate / 100 / 12;
        if (r === 0) return (amount / term).toFixed(2);
        return ((amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1)).toFixed(2);
    };

    const handleLoan = async () => {
        try {
            setLoading(true);
            const amount = parseFloat(loanForm.amount);
            const term = parseInt(loanForm.term);
            const rate = parseFloat(loanForm.rate);
            const monthly = computeMonthly(amount, rate, term);
            const repayment = (parseFloat(monthly) * term).toFixed(2);

            const res = await fetch("/api/loan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: "",
                    amount: loanForm.amount,
                    date: new Date().toISOString().split("T")[0], //use the one from present date
                    term: loanForm.term,
                    rate: loanForm.rate,
                    monthly,
                    repayment,
                    status: "PENDING",
                }),
            });

            if (!res.ok) throw new Error("Failed to apply for loan");
            await fetchLoans();
            setShowLoanForm(false);
            setLoanForm({ amount: "", term: "", rate: "" });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/loans", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch loans");
            setLoans(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            setUsers(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserLoans = async (userId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/users/${userId}/loans`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch user loans");
            setSelectedUserLoans(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLoan = async (loanId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/loans/${loanId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ status: "APPROVED" }),
            });
            if (!res.ok) throw new Error("Failed to approve loan");
            if (selectedUser) await fetchUserLoans(selectedUser.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustRate = async (loanId: string, newRate: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/loans/${loanId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ rate: newRate }),
            });
            if (!res.ok) throw new Error("Failed to adjust rate");
            if (selectedUser) await fetchUserLoans(selectedUser.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === "ADMIN") fetchUsers();
        else fetchLoans();
    }, [role]);

    return(
        <div>
            <div><button onClick={handleLogOut}>logout</button></div>
            <div>
                <h1>Dashboard</h1>
                {role !== "ADMIN" && <button onClick={() => setShowLoanForm(!showLoanForm)}>apply for loan</button>} {/*side by side with one starting from the other end of the container */}
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {role === "ADMIN" ? (
                <div>
                    <select onChange={e => {
                        const user = users.find(u => u.id === e.target.value) || null;
                        setSelectedUser(user);
                        if (user) fetchUserLoans(user.id);
                    }}>
                        <option value="">Select a user</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
                        ))}
                    </select>

                    {selectedUser && (
                        <div>
                            <h3>{selectedUser.username}'s Loans</h3>
                            {/*table */}
                            <table>
                                <thead>
                                    <tr>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Term</th>
                                        <th>Rate (%)</th>
                                        <th>Monthly</th>
                                        <th>Repayment</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedUserLoans.map(loan => (
                                        <tr key={loan.id}>
                                            <td>{loan.amount}</td>
                                            <td>{loan.date}</td>
                                            <td>{loan.term}</td>
                                            <td>
                                                <input
                                                    defaultValue={loan.rate}
                                                    onBlur={e => handleAdjustRate(loan.id, e.target.value)}
                                                />
                                            </td>
                                            <td>{loan.monthly}</td>
                                            <td>{loan.repayment}</td>
                                            <td>{loan.status}</td>
                                            <td>
                                                {loan.status !== "APPROVED" && (
                                                    <button onClick={() => handleApproveLoan(loan.id)}>Approve</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {showLoanForm && (
                        <div>
                            <input placeholder="Amount" value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: e.target.value})} />
                            <input placeholder="Term (months)" value={loanForm.term} onChange={e => setLoanForm({...loanForm, term: e.target.value})} />
                            <input placeholder="Rate (%)" value={loanForm.rate} onChange={e => setLoanForm({...loanForm, rate: e.target.value})} />
                            <button onClick={handleLoan}>Submit</button>
                            <button onClick={() => setShowLoanForm(false)}>Cancel</button>
                        </div>
                    )}

                    {/*table */}
                    <table>
                        <thead>
                            <tr>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Term</th>
                                <th>Rate (%)</th>
                                <th>Monthly</th>
                                <th>Repayment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(loan => (
                                <tr key={loan.id}>
                                    <td>{loan.amount}</td>
                                    <td>{loan.date}</td>
                                    <td>{loan.term}</td>
                                    <td>{loan.rate}</td>
                                    <td>{loan.monthly}</td>
                                    <td>{loan.repayment}</td>
                                    <td>{loan.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default DashBoard;
