import { createCsvExport, downloadCsv } from "../utils/csv";
import { getToday } from "../utils/recurring";

export default function ExportCSV({ expenses, customCategories = [], accounts = [], categoryOverrides = {}, compact = false }) {

    const exportCSV = () => {
        downloadCsv(createCsvExport(expenses, customCategories, accounts, categoryOverrides), `expense-tracker-transactions-${getToday()}.csv`);
    };

    return (
        <button
            className={`btn btn-success${compact ? " btn-sm" : " w-100"}`}
            onClick={exportCSV}
        >
            Export CSV
        </button>
    );
}

