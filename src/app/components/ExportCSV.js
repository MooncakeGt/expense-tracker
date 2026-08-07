export default function ExportCSV({ expenses }) {

    const exportCSV = () => {

        const headers =
            "Description,Amount,Type,Date\n";

        const rows = expenses
            .map(expense =>
                `${expense.description},${expense.amount},${expense.type},${expense.date}`
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
            className="btn btn-success my-3"
            onClick={exportCSV}
        >
            Export CSV
        </button>
    );
}