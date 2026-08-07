'use client';

import Papa from "papaparse";

const ImportCSV = ({ setExpenses }) => {

    const importCSV = (e) => {

        const file = e.target.files[0];

        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            complete: (results) => {

                const importedExpenses = results.data.map(item => ({
                    id: crypto.randomUUID(),
                    description: item.Description,
                    amount: Number(item.Amount),
                    type: item.Type,
                    date: item.Date,
                }));

                setExpenses(importedExpenses);
            },

            error: (error) => {
                console.error(error);
                alert("Failed to import CSV.");
            }
        });
    };

    return (
        <div className="mt-3">
            <label className="form-label">
                Import CSV
            </label>

            <input
                type="file"
                accept=".csv"
                className="form-control"
                onChange={importCSV}
            />
        </div>
    );
};

export default ImportCSV;