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

const th: React.CSSProperties = {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #e5e7eb",
};

const td: React.CSSProperties = {
    padding: "0.85rem 1rem",
    fontSize: "0.9rem",
    color: "#111827",
    borderBottom: "1px solid #f3f4f6",
};

const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "1.25rem 1.5rem",
    flex: 1,
};

function statusBadge(status: string): React.CSSProperties {
    const map: Record<string, React.CSSProperties> = {
        APPROVED: { background: "#d1fae5", color: "#065f46" },
        PENDING:  { background: "#fef3c7", color: "#92400e" },
        REJECTED: { background: "#fee2e2", color: "#991b1b" },
    };
    return {
        ...(map[status] ?? { background: "#f3f4f6", color: "#374151" }),
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "0.78rem",
        fontWeight: 600,
        display: "inline-block",
    };
}

function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month) - 1]} ${day}, ${year}`;
}

function fmt(n: number) {
    return "₱" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function capitalize(s: string) {
    return s.charAt(0) + s.slice(1).toLowerCase();
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

    const handleRejectLoan = async (loanId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/loans/${loanId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: "REJECTED" }),
            });
            if (!res.ok) throw new Error("Failed to reject loan");
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
    const totalBorrowed = approvedLoans.reduce((sum, l) => sum + l.amount, 0);

    const previewAmount = parseFloat(loanForm.amount) || 0;
    const previewTerm = parseInt(loanForm.term);
    const previewRate = TERM_RATES[loanForm.term] ?? 6;
    const previewMonthly = previewAmount > 0 ? computeMonthly(previewAmount, previewRate, previewTerm) : "0.00";
    const previewRepayment = previewAmount > 0 ? (parseFloat(previewMonthly) * previewTerm).toFixed(2) : "0.00";

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "0.6rem 0.75rem",
        borderRadius: "6px",
        border: "1px solid #d1d5db",
        fontSize: "0.9rem",
        boxSizing: "border-box",
        outline: "none",
    };

    const primaryBtn: React.CSSProperties = {
        padding: "0.6rem 1.25rem",
        borderRadius: "6px",
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: "0.9rem",
        cursor: "pointer",
        fontWeight: 600,
    };

    const ghostBtn: React.CSSProperties = {
        padding: "0.6rem 1.25rem",
        borderRadius: "6px",
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        fontSize: "0.9rem",
        cursor: "pointer",
        fontWeight: 500,
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Navbar */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>LoanTracker</span>
                <button onClick={handleLogOut} style={ghostBtn}>Logout</button>
            </div>

            <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 1.5rem" }}>

                {error && (
                    <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem" }}>
                        {error}
                    </div>
                )}

                {role !== "ADMIN" ? (
                    <>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Dashboard</h1>
                            <button style={primaryBtn} onClick={() => setShowLoanForm(true)}>Apply for Loan</button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={card}>
                                <p style={{ margin: "0 0 0.4rem", color: "#6b7280", fontSize: "0.82rem", fontWeight: 500 }}>Approved Loans</p>
                                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#111827" }}>{approvedLoans.length}</p>
                            </div>
                            <div style={card}>
                                <p style={{ margin: "0 0 0.4rem", color: "#6b7280", fontSize: "0.82rem", fontWeight: 500 }}>Total Borrowed</p>
                                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#111827" }}>{fmt(totalBorrowed)}</p>
                            </div>
                        </div>

                        {/* Loans table */}
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
                                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Loans</h2>
                            </div>
                            {loading && loans.length === 0 ? (
                                <p style={{ padding: "1.5rem", color: "#6b7280", fontSize: "0.9rem" }}>Loading…</p>
                            ) : loans.length === 0 ? (
                                <p style={{ padding: "1.5rem", color: "#6b7280", fontSize: "0.9rem" }}>No loans yet. Click "Apply for Loan" to get started.</p>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f9fafb" }}>
                                            <th style={th}>ID</th>
                                            <th style={th}>Date</th>
                                            <th style={th}>Amount</th>
                                            <th style={th}>Term</th>
                                            <th style={th}>Rate</th>
                                            <th style={th}>Monthly</th>
                                            <th style={th}>Repayment</th>
                                            <th style={th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loans.map((l, i) => (
                                            <tr key={l.id}>
                                                <td style={td}>{i + 1}</td>
                                                <td style={td}>{formatDate(l.date)}</td>
                                                <td style={td}>{l.amount.toLocaleString()}</td>
                                                <td style={td}>{l.term} Months</td>
                                                <td style={td}>{l.rate}%</td>
                                                <td style={td}>{l.monthly.toFixed(2)}</td>
                                                <td style={td}>{l.repayment.toFixed(2)}</td>
                                                <td style={td}><span style={statusBadge(l.status)}>{capitalize(l.status)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Admin header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Admin Dashboard</h1>
                        </div>

                        {/* User selector */}
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 500, color: "#374151" }}>Select User</label>
                            <select
                                style={{ ...inputStyle, cursor: "pointer" }}
                                onChange={e => {
                                    const user = users.find(u => u.id === e.target.value) || null;
                                    setSelectedUser(user);
                                    if (user) void fetchUserLoans(user.id);
                                }}
                            >
                                <option value="">— choose a user —</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selected user loans */}
                        {selectedUser && (
                            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
                                    <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{selectedUser.username}'s Loans</h2>
                                </div>
                                {selectedUserLoans.length === 0 ? (
                                    <p style={{ padding: "1.5rem", color: "#6b7280", fontSize: "0.9rem" }}>No loans found.</p>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f9fafb" }}>
                                                <th style={th}>ID</th>
                                                <th style={th}>Date</th>
                                                <th style={th}>Amount</th>
                                                <th style={th}>Term</th>
                                                <th style={th}>Rate</th>
                                                <th style={th}>Monthly</th>
                                                <th style={th}>Repayment</th>
                                                <th style={th}>Status</th>
                                                <th style={th}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedUserLoans.map((l, i) => (
                                                <tr key={l.id}>
                                                    <td style={td}>{i + 1}</td>
                                                    <td style={td}>{formatDate(l.date)}</td>
                                                    <td style={td}>{l.amount.toLocaleString()}</td>
                                                    <td style={td}>{l.term} Months</td>
                                                    <td style={td}>{l.rate}%</td>
                                                    <td style={td}>{l.monthly.toFixed(2)}</td>
                                                    <td style={td}>{l.repayment.toFixed(2)}</td>
                                                    <td style={td}><span style={statusBadge(l.status)}>{capitalize(l.status)}</span></td>
                                                    <td style={td}>
                                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                                            {l.status === "PENDING" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => void handleApproveLoan(l.id)}
                                                                        style={{ padding: "4px 10px", borderRadius: "5px", border: "none", background: "#d1fae5", color: "#065f46", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => void handleRejectLoan(l.id)}
                                                                        style={{ padding: "4px 10px", borderRadius: "5px", border: "none", background: "#fee2e2", color: "#991b1b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <input
                                                                type="number"
                                                                placeholder="Rate %"
                                                                value={rateInputs[l.id] ?? ""}
                                                                onChange={e => setRateInputs(prev => ({ ...prev, [l.id]: e.target.value }))}
                                                                style={{ width: "70px", padding: "4px 6px", borderRadius: "5px", border: "1px solid #d1d5db", fontSize: "0.78rem" }}
                                                            />
                                                            <button
                                                                onClick={() => void handleAdjustRate(l.id)}
                                                                style={{ padding: "4px 10px", borderRadius: "5px", border: "none", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                                                            >
                                                                Set Rate
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Apply for Loan modal */}
            {showLoanForm && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
                    onClick={e => { if (e.target === e.currentTarget) setShowLoanForm(false); }}
                >
                    <div style={{ background: "#fff", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Apply for Loan</h2>
                            <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.85rem" }}>Fill in the details below</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "#374151" }}>Amount</label>
                            <input
                                style={inputStyle}
                                type="number"
                                placeholder="Enter amount"
                                value={loanForm.amount}
                                onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "#374151" }}>Term</label>
                            <select
                                style={{ ...inputStyle, cursor: "pointer" }}
                                value={loanForm.term}
                                onChange={e => setLoanForm({ ...loanForm, term: e.target.value })}
                            >
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">12 Months</option>
                            </select>
                        </div>

                        {/* Preview */}
                        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "#6b7280" }}>Interest Rate</span>
                                <span style={{ fontWeight: 600 }}>{previewRate}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "#6b7280" }}>Monthly Payment</span>
                                <span style={{ fontWeight: 600 }}>₱{parseFloat(previewMonthly).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "#6b7280" }}>Total Repayment</span>
                                <span style={{ fontWeight: 600, color: "#2563eb" }}>₱{parseFloat(previewRepayment).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button style={{ ...ghostBtn, flex: 1 }} onClick={() => setShowLoanForm(false)}>Cancel</button>
                            <button
                                style={{ ...primaryBtn, flex: 1, opacity: (!loanForm.amount || loading) ? 0.6 : 1 }}
                                onClick={handleLoan}
                                disabled={!loanForm.amount || loading}
                            >
                                {loading ? "Applying…" : "Apply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashBoard;
