import { z } from "zod";

export const ACCOUNT_TYPES = ["cash", "bank", "savings", "ewallet", "credit-card", "personal-loan", "student-loan", "vehicle-loan", "mortgage", "other-debt", "other"];

export const accountSchema = z.object({
    id: z.string().trim().min(1, "Account ID is required."),
    name: z.string().trim().min(1, "Account name is required.").max(80, "Account name must be 80 characters or fewer."),
    type: z.enum(ACCOUNT_TYPES, { error: "Choose an account type." }),
    openingBalance: z.number({ error: "Enter a valid opening balance." }).finite("Enter a valid opening balance."),
    archived: z.boolean(),
    createdAt: z.string().datetime({ message: "Invalid creation date." }),
});

export const validateAccountInput = data => accountSchema.safeParse({
    ...data,
    openingBalance: typeof data?.openingBalance === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(data.openingBalance.trim())
        ? Number(data.openingBalance.trim()) : data?.openingBalance,
});

export const parseStoredAccounts = json => {
    try {
        const value = JSON.parse(json);
        if (!Array.isArray(value)) return [];
        let generalSeen = false;
        return value.flatMap(item => {
            const result = accountSchema.safeParse(item);
            if (!result.success) return [];
            if (result.data.id !== "general") return [result.data];
            if (generalSeen) return [];
            generalSeen = true;
            return [{ ...result.data, id: "general", archived: false }];
        });
    } catch { return []; }
};
