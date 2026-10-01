'use client';

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currency";
import { expenseColor, incomeColor } from "./chartColors";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const baseOptions = { responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } } },
    scales: { y: { beginAtZero: true, ticks: { callback: value => `RM ${new Intl.NumberFormat("en-MY", { notation: "compact" }).format(value)}` } } } };

export function YearlyIncomeExpenseChart({ months, year }) {
    if (months.every(month => month.income === 0 && month.expenses === 0)) return <p className="text-muted">No transactions recorded in {year}.</p>;
    const data = { labels: monthLabels, datasets: [
        { label: "Income", data: months.map(month => month.income), borderColor: incomeColor, backgroundColor: incomeColor, tension: 0.2 },
        { label: "Expenses", data: months.map(month => month.expenses), borderColor: expenseColor, backgroundColor: expenseColor, tension: 0.2 },
    ] };
    return <div className="chart-canvas"><Line data={data} options={baseOptions} role="img" aria-label={`Monthly income and expenses for ${year}`} /></div>;
}

export function YearlyNetChart({ months, year }) {
    if (months.every(month => month.net === 0)) return <p className="text-muted">No monthly net activity in {year}.</p>;
    const data = { labels: monthLabels, datasets: [{ label: "Net", data: months.map(month => month.net), backgroundColor: months.map(month => month.net >= 0 ? incomeColor : expenseColor) }] };
    const options = { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } }, scales: { y: { ticks: baseOptions.scales.y.ticks } } };
    return <div className="chart-canvas"><Bar data={data} options={options} role="img" aria-label={`Monthly net totals for ${year}`} /></div>;
}
