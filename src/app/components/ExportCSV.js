export default function ExportCSV({ expenses }) {

    const escapeField = (field) => {
        const str = String(field ?? "");
        return `"${str.replace(/"/g, '""')}"`;
    };

    const exportCSV = () => {

        const headers = "Description,Tag,Amount,Type,Date\n";

        const rows = expenses
            .map(expense =>
                [
                    escapeField(expense.description),
                    escapeField(expense.tag),
                    escapeField(expense.amount),
                    escapeField(expense.type),
                    escapeField(expense.date),
                ].join(",")
            )
            .join("\n");

        const csv = headers + rows;

        const blob = new Blob([csv], {
            type: "text/csv",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "expenses.csv";

        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <button
            className="btn btn-success w-100"
            onClick={exportCSV}
        >
            Export CSV
        </button>
    );
}