'use client';

import Papa from "papaparse";
import { useRef } from "react";

const ImportCSV = ({ setExpenses }) => {

    const fileInputRef = useRef(null);

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
                    tag: item.Tag || "Other",
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

        e.target.value = "";
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={() => fileInputRef.current.click()}
            >
                Import CSV
            </button>

            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={importCSV}
                style={{ display: "none" }}
            />
        </>
    );
};

export default ImportCSV;