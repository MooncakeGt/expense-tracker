'use client';

import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currency";
import { formatMonth } from "../../utils/dashboard";
import { expenseColor } from "./chartColors";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function MonthlySpendingChart({ daily, month }) {
    if (daily.every(day => day.amount === 0)) return <p className="text-muted mb-0">No spending recorded for this month.</p>;

    const data = {
        labels: daily.map(item => String(item.day)),
        datasets: [{ label: "Daily expenses", data: daily.map(item => item.amount), backgroundColor: expenseColor }],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: items => `${items[0].label} ${formatMonth(month)}`,
                    label: context => formatCurrency(context.parsed.y),
                },
            },
        },
        scales: {
            x: { ticks: { autoSkip: true, maxTicksLimit: 10, maxRotation: 0 } },
            y: { beginAtZero: true, ticks: { callback: value => `RM ${new Intl.NumberFormat("en-MY", { notation: "compact" }).format(value)}` } },
        },
    };

    return <div className="chart-canvas"><Bar data={data} options={options} role="img"
        aria-label={`Daily expense totals for ${formatMonth(month)}`} /></div>;
}
