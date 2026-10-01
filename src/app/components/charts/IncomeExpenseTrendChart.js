'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currency";
import { formatMonth } from "../../utils/dashboard";
import { expenseColor, incomeColor } from "./chartColors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function IncomeExpenseTrendChart({ trend }) {
    if (trend.every(month => month.income === 0 && month.expenses === 0)) {
        return <p className="text-muted mb-0">No transactions in this six-month period.</p>;
    }

    const data = {
        labels: trend.map(item => formatMonth(item.month).split(" ")[0].slice(0, 3)),
        datasets: [
            { label: "Income", data: trend.map(item => item.income), borderColor: incomeColor, backgroundColor: incomeColor, tension: 0.2, pointRadius: 3 },
            { label: "Expenses", data: trend.map(item => item.expenses), borderColor: expenseColor, backgroundColor: expenseColor, tension: 0.2, pointRadius: 3 },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12 } },
            tooltip: {
                callbacks: {
                    title: items => formatMonth(trend[items[0].dataIndex].month),
                    label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
                },
            },
        },
        scales: {
            x: { ticks: { autoSkip: true, maxTicksLimit: 6 } },
            y: { beginAtZero: true, ticks: { callback: value => `RM ${new Intl.NumberFormat("en-MY", { notation: "compact" }).format(value)}` } },
        },
    };

    return <div className="chart-canvas"><Line data={data} options={options} role="img"
        aria-label="Monthly income and expenses for the six months ending with the selected month" /></div>;
}
