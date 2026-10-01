'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currency";
import { getCategoryDisplay } from "../../utils/tags";
import { categoryColor } from "./chartColors";
import { useCategoryOverrides } from "../categories/CategoryIcon";

ChartJS.register(ArcElement, Tooltip);

export default function SpendingByCategoryChart({ spending, customCategories = [] }) {
    const categoryOverrides = useCategoryOverrides();
    if (spending.length === 0) return <p className="text-muted mb-0">No expense data for this month.</p>;

    const data = {
        labels: spending.map(item => getCategoryDisplay(item.tag, customCategories, categoryOverrides)),
        datasets: [{
            data: spending.map(item => item.amount),
            backgroundColor: spending.map(item => categoryColor(item.tag)),
            borderColor: "#fff",
            borderWidth: 2,
        }],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: context => `${formatCurrency(context.parsed)} · ${spending[context.dataIndex].percentage.toFixed(1)}% of expenses`,
                },
            },
        },
    };

    return <div className="chart-canvas"><Doughnut data={data} options={options} role="img"
        aria-label="Expense distribution by category; amounts are listed in the Spending by Category section below" /></div>;
}
