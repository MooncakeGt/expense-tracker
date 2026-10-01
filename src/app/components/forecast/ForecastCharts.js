'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currency";
import { formatMonth } from "../../utils/dashboard";
import { incomeColor, expenseColor, accentColor } from "../charts/chartColors";
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,BarElement,Tooltip,Legend);
const scales={y:{ticks:{callback:value=>`RM ${new Intl.NumberFormat("en-MY",{notation:"compact"}).format(value)}`}},x:{ticks:{autoSkip:true,maxTicksLimit:8}}};
const singleMonthBarSizing={maxBarThickness:56,categoryPercentage:.65,barPercentage:.85};
export function ForecastCashFlowChart({monthly=[]}){if(!monthly.length)return null;return <div className="chart-canvas"><Bar data={{labels:monthly.map(item=>formatMonth(item.month)),datasets:[{label:"Projected income",data:monthly.map(item=>item.income),backgroundColor:incomeColor,...singleMonthBarSizing},{label:"Projected expenses",data:monthly.map(item=>item.expenses),backgroundColor:expenseColor,...singleMonthBarSizing},{label:"Net / savings",data:monthly.map(item=>item.net),backgroundColor:accentColor,...singleMonthBarSizing}]}} options={{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:context=>`${context.dataset.label}: ${formatCurrency(context.parsed.y)}`}}},scales}} role="img" aria-label="Projected income, expenses, and net savings for next month"/></div>;}
export function ForecastBalanceChart({trend=[]}){if(!trend.length)return null;return <div className="chart-canvas"><Line data={{labels:trend.map(item=>formatMonth(item.month)),datasets:[{label:"Available balance",data:trend.map(item=>item.balance),borderColor:incomeColor,backgroundColor:incomeColor,tension:.2}]}} options={{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:context=>`${context.dataset.label}: ${formatCurrency(context.parsed.y)}`}}},scales}} role="img" aria-label="Projected available balance over the next 12 months"/></div>;}
