'use client';

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { accentColor, neutralColor } from "../charts/chartColors";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const colors = { target: neutralColor, actual: accentColor };

export default function AllocationChart({ percentages, shares }) {
    const labels = ["Needs", "Wants", "Savings", "Unassigned"];
    const actual = [shares.needs, shares.wants, shares.savings, shares.unassigned];
    if (actual.every(value => value === null || value === 0)) return <p className="text-muted mb-0">No income-based allocation data for this month.</p>;
    const data = { labels, datasets: [
        { label: "Target", data: [percentages.needs, percentages.wants, percentages.savings, null], backgroundColor: colors.target },
        { label: "Actual", data: actual, backgroundColor: colors.actual },
    ] };
    const options = {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: context => context.raw === null ? `${context.dataset.label}: unavailable` : `${context.dataset.label}: ${Number(context.raw).toFixed(1)}% of income` } } },
        scales: { y: { beginAtZero: true, ticks: { callback: value => `${value}%` } } },
    };
    return <div className="chart-canvas"><Bar data={data} options={options} role="img" aria-label="Target and actual income allocation percentages for Needs, Wants, Savings, and Unassigned spending" /></div>;
}
