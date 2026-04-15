import { useMemo, useRef, useState } from "react";
import "./MoneyTracker.css";

const CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Health",
    "Shopping",
    "Entertainment",
    "Salary",
    "Freelance",
    "Other",
];

function getTodayLocalDate() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function fmt(n) {
    return `€${Math.abs(Number(n) || 0).toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export default function MoneyTracker() {
    const nextId = useRef(1);

    const [txType, setTxType] = useState("income");
    const [filter, setFilter] = useState("all");
    const [txs, setTxs] = useState([]);

    const [form, setForm] = useState({
        desc: "",
        amount: "",
        cat: "Food",
        date: getTodayLocalDate(),
    });

    const { income, expense } = useMemo(() => {
        return txs.reduce(
            (acc, tx) => {
                if (tx.type === "income") acc.income += tx.amount;
                if (tx.type === "expense") acc.expense += tx.amount;
                return acc;
            },
            { income: 0, expense: 0 }
        );
    }, [txs]);

    const balance = income - expense;

    const filteredTxs = useMemo(() => {
        return filter === "all" ? txs : txs.filter((tx) => tx.type === filter);
    }, [filter, txs]);

    const expenseByCategory = useMemo(() => {
        const totals = {};

        txs.forEach((tx) => {
            if (tx.type === "expense") {
                totals[tx.cat] = (totals[tx.cat] || 0) + tx.amount;
            }
        });

        const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const max = rows.length > 0 ? rows[0][1] : 0;

        return rows.map(([cat, amount]) => ({
            cat,
            amount,
            width: max > 0 ? `${((amount / max) * 100).toFixed(1)}%` : "0%",
        }));
    }, [txs]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleAdd(event) {
        event.preventDefault();

        const desc = form.desc.trim();
        const amount = parseFloat(form.amount);

        if (!desc || Number.isNaN(amount) || amount <= 0) {
            return;
        }

        const newTx = {
            id: nextId.current++,
            desc,
            amount,
            type: txType,
            cat: form.cat,
            date: form.date || getTodayLocalDate(),
        };

        setTxs((prev) => [newTx, ...prev]);

        setForm((prev) => ({
            ...prev,
            desc: "",
            amount: "",
        }));
    }

    function handleDelete(id) {
        setTxs((prev) => prev.filter((tx) => tx.id !== id));
    }

    const balanceColor =
        balance < 0
            ? "var(--color-expense)"
            : balance > 0
                ? "var(--color-income)"
                : "var(--color-text-primary)";

    const listEmptyMessage =
        txs.length === 0
            ? "No transactions yet — add your first one above."
            : "No transactions here yet.";

    return (
        <div className="mt-shell">
            <section className="mt-tracker" aria-label="Money movement tracker">
                <div className="mt-header">
                    <span className="mt-header-title">Money tracker</span>

                    <div className="mt-type-toggle" aria-label="Transaction type">
                        <button
                            type="button"
                            className={`mt-type-btn ${txType === "income" ? "active-income" : ""}`}
                            aria-pressed={txType === "income"}
                            onClick={() => setTxType("income")}
                        >
                            + Income
                        </button>
                        <button
                            type="button"
                            className={`mt-type-btn ${txType === "expense" ? "active-expense" : ""}`}
                            aria-pressed={txType === "expense"}
                            onClick={() => setTxType("expense")}
                        >
                            − Expense
                        </button>
                    </div>
                </div>

                <div className="mt-metrics" aria-label="Summary">
                    <div className="mt-metric">
                        <div className="mt-metric-label">Total income</div>
                        <div className="mt-metric-value income">{fmt(income)}</div>
                    </div>

                    <div className="mt-metric">
                        <div className="mt-metric-label">Total expenses</div>
                        <div className="mt-metric-value expense">{fmt(expense)}</div>
                    </div>

                    <div className="mt-metric">
                        <div className="mt-metric-label">Balance</div>
                        <div className="mt-metric-value" style={{ color: balanceColor }}>
                            {balance < 0 ? "−" : ""}
                            {fmt(balance)}
                        </div>
                    </div>
                </div>

                <form className="mt-add-section" aria-label="Add transaction" onSubmit={handleAdd}>
                    <div className="mt-add-row">
                        <input
                            type="text"
                            name="desc"
                            placeholder="Description"
                            value={form.desc}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="amount"
                            placeholder="Amount"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                        />

                        <select name="cat" value={form.cat} onChange={handleChange}>
                            {CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                        />

                        <button className="mt-add-btn" type="submit">
                            Add
                        </button>
                    </div>
                </form>

                <div className="mt-list-header">
                    <span className="mt-list-title">Transactions</span>

                    <div className="mt-filter-row" role="group" aria-label="Filter">
                        <button
                            type="button"
                            className={`mt-filter-btn ${filter === "all" ? "active" : ""}`}
                            aria-pressed={filter === "all"}
                            onClick={() => setFilter("all")}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`mt-filter-btn ${filter === "income" ? "active" : ""}`}
                            aria-pressed={filter === "income"}
                            onClick={() => setFilter("income")}
                        >
                            Income
                        </button>
                        <button
                            type="button"
                            className={`mt-filter-btn ${filter === "expense" ? "active" : ""}`}
                            aria-pressed={filter === "expense"}
                            onClick={() => setFilter("expense")}
                        >
                            Expenses
                        </button>
                    </div>
                </div>

                <div className="mt-tx-list" aria-live="polite">
                    {filteredTxs.length === 0 ? (
                        <div className="mt-empty">{listEmptyMessage}</div>
                    ) : (
                        filteredTxs.map((tx) => (
                            <div className="mt-tx-item" key={tx.id}>
                                <div className={`mt-tx-dot ${tx.type}`} />

                                <div className="mt-tx-meta">
                                    <div className="mt-tx-desc">{tx.desc}</div>
                                    <div className="mt-tx-cat">{tx.cat}</div>
                                </div>

                                <div className="mt-tx-date">{tx.date}</div>

                                <div className={`mt-tx-amount ${tx.type}`}>
                                    {tx.type === "income" ? "+" : "−"}
                                    {fmt(tx.amount)}
                                </div>

                                <button
                                    type="button"
                                    className="mt-tx-del"
                                    aria-label="Delete transaction"
                                    onClick={() => handleDelete(tx.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-chart-section" aria-label="Spending by category">
                    <div className="mt-chart-label">Spending by category</div>

                    <div className="mt-cat-bars">
                        {expenseByCategory.length === 0 ? (
                            <div className="mt-empty mt-empty-compact">No expense data yet.</div>
                        ) : (
                            expenseByCategory.map((row) => (
                                <div className="mt-cat-bar-row" key={row.cat}>
                                    <div className="mt-cat-name">{row.cat}</div>
                                    <div className="mt-cat-track">
                                        <div className="mt-cat-fill" style={{ width: row.width }} />
                                    </div>
                                    <div className="mt-cat-amt">{fmt(row.amount)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}