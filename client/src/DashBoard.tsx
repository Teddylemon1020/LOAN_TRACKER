import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { TERM_RATES } from "./constants/loanConstants";

interface Loan {
    id: string;
    amount: number;
    date: string;
    term: number;
    rate: number;
    monthly: number;
    repayment: number;
    status: string;
}

interface User {
    id: string;
    username: string;
    email: string;
}

function DashBoard() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIsLoggedIn, setLogin, role } = useAuth();
    const navigate = useNavigate();

    const [loans, setLoans] = useState<Loan[]>([]);
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [loanForm, setLoanForm] = useState({ amount: "", term: "3" });

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserLoans, setSelectedUserLoans] = useState<Loan[]>([]);
    const [rateInputs, setRateInputs] = useState<Record<string, string>>({});

    const handleLogOut = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setLogin({ email: "", password: "" });
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
            const rate = TERM_RATES[loanForm.term] ?? 6;
            const monthly = computeMonthly(amount, rate, term);
            const repayment = (parseFloat(monthly) * term).toFixed(2);

            const res = await fetch("/api/loan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    amount: loanForm.amount,
                    date: new Date().toISOString().split("T")[0],
                    term: loanForm.term,
                    rate,
                    monthly,
                    repayment,
                    status: "PENDING",
                }),
            });

            if (!res.ok) throw new Error("Failed to apply for loan");
            await fetchLoans();
            setShowLoanForm(false);
            setLoanForm({ amount: "", term: "3" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/loans", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error("Failed to fetch loans");
            setLoans(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
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
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
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
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLoan = async (loanId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/loans/${loanId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: "APPROVED" }),
            });
            if (!res.ok) throw new Error("Failed to approve loan");
            if (selectedUser) await fetchUserLoans(selectedUser.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustRate = async (loanId: string) => {
        const newRate = rateInputs[loanId];
        if (!newRate) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/loans/${loanId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ rate: newRate }),
            });
            if (!res.ok) throw new Error("Failed to adjust rate");
            setRateInputs(prev => ({ ...prev, [loanId]: "" }));
            if (selectedUser) await fetchUserLoans(selectedUser.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === "ADMIN") void fetchUsers();
        else void fetchLoans();
    }, [role]);

    const approvedLoans = loans.filter(l => l.status === "APPROVED");
    const approvedCount = approvedLoans.length;
    const totalBorrowed = approvedLoans.reduce((sum, l) => sum + l.amount, 0);

    const previewAmount = parseFloat(loanForm.amount) || 0;
    const previewTerm = parseInt(loanForm.term);
    const previewRate = TERM_RATES[loanForm.term] ?? 6;
    const previewMonthly = previewAmount > 0 ? computeMonthly(previewAmount, previewRate, previewTerm) : "0.00";
    const previewRepayment = previewAmount > 0 ? (parseFloat(previewMonthly) * previewTerm).toFixed(2) : "0.00";

    return (
        <div>
            <div>
                <button onClick={handleLogOut}>Logout</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {role !== "ADMIN" ? (
                <div>
                    <h1>Dashboard</h1>

                    <div>
                        <div>
                            <h3>Approved Loans</h3>
                            <p>{approvedCount}</p>
                        </div>
                        <div>
                            <h3>Total Borrowed</h3>
                            <p>${totalBorrowed.toFixed(2)}</p>
                        </div>
                    </div>

                    <button onClick={() => setShowLoanForm(!showLoanForm)}>
                        {showLoanForm ? "Cancel" : "Apply for Loan"}
                    </button>

                    {showLoanForm && (
                        <div>
                            <h3>Loan Application</h3>
                            <div>
                                <label>Amount</label>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={loanForm.amount}
                                    onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Term</label>
                                <select
                                    value={loanForm.term}
                                    onChange={e => setLoanForm({ ...loanForm, term: e.target.value })}
                                >
                                    <option value="3">3 months</option>
                                    <option value="6">6 months</option>
                                    <option value="12">12 months</option>
                                </select>
                            </div>
                            <div>
                                <p>Interest Rate: {previewRate}%</p>
                                <p>Monthly Payment: ${previewMonthly}</p>
                                <p>Total Repayment: ${previewRepayment}</p>
                            </div>
                            <button onClick={handleLoan} disabled={loading || !loanForm.amount}>
                                Apply
                            </button>
                        </div>
                    )}

                    <h2>My Loans</h2>
                    {loans.length === 0 ? (
                        <p>No loans yet.</p>
                    ) : (
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
                                {loans.map(l => (
                                    <tr key={l.id}>
                                        <td>${l.amount.toFixed(2)}</td>
                                        <td>{l.date}</td>
                                        <td>{l.term} months</td>
                                        <td>{l.rate}%</td>
                                        <td>${l.monthly.toFixed(2)}</td>
                                        <td>${l.repayment.toFixed(2)}</td>
                                        <td>{l.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div>
                    <h1>Admin Dashboard</h1>
                    <select
                        onChange={e => {
                            const user = users.find(u => u.id === e.target.value) || null;
                            setSelectedUser(user);
                            if (user) fetchUserLoans(user.id);
                        }}
                    >
                        <option value="">Select a user</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
                        ))}
                    </select>

                    {selectedUser && (
                        <div>
                            <h3>{selectedUser.username}'s Loans</h3>
                            {selectedUserLoans.length === 0 ? (
                                <p>No loans found.</p>
                            ) : (
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
                                        {selectedUserLoans.map(l => (
                                            <tr key={l.id}>
                                                <td>${l.amount.toFixed(2)}</td>
                                                <td>{l.date}</td>
                                                <td>{l.term} months</td>
                                                <td>{l.rate}%</td>
                                                <td>${l.monthly.toFixed(2)}</td>
                                                <td>${l.repayment.toFixed(2)}</td>
                                                <td>{l.status}</td>
                                                <td>
                                                    {l.status !== "APPROVED" && (
                                                        <button onClick={() => handleApproveLoan(l.id)}>
                                                            Approve
                                                        </button>
                                                    )}
                                                    <input
                                                        type="number"
                                                        placeholder="New rate"
                                                        value={rateInputs[l.id] ?? ""}
                                                        onChange={e =>
                                                            setRateInputs(prev => ({ ...prev, [l.id]: e.target.value }))
                                                        }
                                                        style={{ width: "80px" }}
                                                    />
                                                    <button onClick={() => handleAdjustRate(l.id)}>
                                                        Set Rate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DashBoard;
