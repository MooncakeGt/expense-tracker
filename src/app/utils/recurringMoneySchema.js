import { z } from "zod";
import { isCalendarDate, parseDecimalAmount } from "./transactionSchema.js";

const schedule = {
    frequency: z.enum(["weekly", "monthly", "yearly"]), interval: z.number().int().min(1).max(100),
    startDate: z.string().refine(isCalendarDate), endDate: z.string().refine(isCalendarDate).nullable(),
    processedThrough: z.string().refine(isCalendarDate).nullable(), active: z.boolean(), pausedAt: z.string().refine(isCalendarDate).nullable(),
    note: z.string().trim().max(200), createdAt: z.string().datetime(),
};
export const recurringTransferSchema = z.object({ id:z.string().regex(/^recurring-transfer-/), fromAccountId:z.string().min(1), toAccountId:z.string().min(1), amount:z.number().finite().positive(), ...schedule }).refine(item=>item.fromAccountId!==item.toAccountId,{path:["toAccountId"],message:"Source and destination must be different."}).refine(item=>!item.endDate||item.endDate>=item.startDate,{path:["endDate"],message:"End date must be on or after start date."});
export const recurringGoalContributionSchema = z.object({ id:z.string().regex(/^recurring-goal-contribution-/), goalId:z.string().min(1), accountId:z.string().min(1), amount:z.number().finite().positive(), createTransfer:z.boolean(), ...schedule }).refine(item=>!item.endDate||item.endDate>=item.startDate,{path:["endDate"],message:"End date must be on or after start date."});
const input = data => ({...data,amount:parseDecimalAmount(data?.amount),interval:typeof data?.interval==="string"?Number(data.interval):data?.interval,endDate:data?.endDate||null,processedThrough:data?.processedThrough||null,pausedAt:data?.pausedAt||null,note:data?.note??""});
export const validateRecurringTransferInput=data=>recurringTransferSchema.safeParse(input(data));
export const validateRecurringGoalContributionInput=data=>recurringGoalContributionSchema.safeParse(input(data));
const parse=(json,schema)=>{try{const data=JSON.parse(json);return Array.isArray(data)?data.flatMap(item=>{const result=schema.safeParse(item);return result.success?[result.data]:[];}):[];}catch{return[];}};
export const parseStoredRecurringTransfers=json=>parse(json,recurringTransferSchema);
export const parseStoredRecurringGoalContributions=json=>parse(json,recurringGoalContributionSchema);
