import { transactionSchema } from "./transactionSchema.js";
import { accountSchema } from "./accountSchema.js";
import { transferSchema } from "./transferSchema.js";
import { customCategorySchema } from "./customCategorySchema.js";
import { recurringRuleSchema } from "./recurringSchema.js";
import { recurringTransferSchema, recurringGoalContributionSchema } from "./recurringMoneySchema.js";
import { savingsGoalSchema } from "./savingsGoalSchema.js";
import { savingsGoalContributionSchema } from "./savingsGoalContributionSchema.js";
import { budgetMonthSchema, monthBudgetSchema, parseStoredBudgets } from "./budgetSchema.js";
import { parseStoredPlannerSettings, plannerSettingsSchema } from "./fiftyThirtyTwentySchema.js";
import { GENERAL_ACCOUNT_ID } from "./accounts.js";
import { parseCategoryIconOverrides } from "./categoryIconOverrides.js";

export const BACKUP_FORMAT="expense-tracker-backup";
export const BACKUP_VERSION=1;
export const BACKUP_DATASETS=["transactions","accounts","transfers","customCategories","recurringRules","recurringTransfers","savingsGoals","savingsGoalContributions","recurringSavingsGoalContributions"];
const schemas={transactions:transactionSchema,accounts:accountSchema,transfers:transferSchema,customCategories:customCategorySchema,recurringRules:recurringRuleSchema,recurringTransfers:recurringTransferSchema,savingsGoals:savingsGoalSchema,savingsGoalContributions:savingsGoalContributionSchema,recurringSavingsGoalContributions:recurringGoalContributionSchema};

export const createFullBackup=(appData,exportedAt=new Date().toISOString())=>({format:BACKUP_FORMAT,version:BACKUP_VERSION,exportedAt,appData:{transactions:appData.transactions??[],accounts:appData.accounts??[],transfers:appData.transfers??[],customCategories:appData.customCategories??[],categoryIconOverrides:appData.categoryIconOverrides??{},budgets:appData.budgets??{},recurringRules:appData.recurringRules??[],recurringTransfers:appData.recurringTransfers??[],savingsGoals:appData.savingsGoals??[],savingsGoalContributions:appData.savingsGoalContributions??[],recurringSavingsGoalContributions:appData.recurringSavingsGoalContributions??[],fiftyThirtyTwentySettings:appData.fiftyThirtyTwentySettings}});
export const serializeBackup=backup=>JSON.stringify(backup,null,2);

export const validateBackupObject=value=>{
 if(!value||typeof value!=="object"||Array.isArray(value))return{success:false,error:"The selected file is not a backup object."};
 if(value.format!==BACKUP_FORMAT)return{success:false,error:"This file is not an Expense Tracker backup."};
 if(!Number.isInteger(value.version)||value.version<1)return{success:false,error:"The backup version is missing or invalid."};
 if(value.version>BACKUP_VERSION)return{success:false,error:"This backup was created by a newer version of the app and cannot be safely restored."};
 if(typeof value.exportedAt!=="string"||Number.isNaN(Date.parse(value.exportedAt)))return{success:false,error:"The backup export date is missing or invalid."};
 if(!value.appData||typeof value.appData!=="object"||Array.isArray(value.appData))return{success:false,error:"The backup does not contain app data."};
 const data={},report={};
 for(const name of BACKUP_DATASETS){const supplied=value.appData[name];const source=Array.isArray(supplied)?supplied:[],valid=[];let invalid=supplied===undefined||Array.isArray(supplied)?0:1;for(const item of source){const result=schemas[name].safeParse(item);if(result.success)valid.push(result.data);else invalid+=1;}data[name]=valid;report[name]={valid:valid.length,invalid};}
 const rawIconOverrides=value.appData.categoryIconOverrides;data.categoryIconOverrides=parseCategoryIconOverrides(rawIconOverrides);const iconOverrideShapeValid=rawIconOverrides===undefined||(rawIconOverrides&&typeof rawIconOverrides==="object"&&!Array.isArray(rawIconOverrides));const suppliedIconCount=iconOverrideShapeValid&&rawIconOverrides?Object.keys(rawIconOverrides).length:0;report.categoryIconOverrides={valid:Object.keys(data.categoryIconOverrides).length,invalid:iconOverrideShapeValid?suppliedIconCount-Object.keys(data.categoryIconOverrides).length:1};
 const rawBudgets=value.appData.budgets;let invalidBudgets=0;if(rawBudgets!==undefined&&(!rawBudgets||typeof rawBudgets!=="object"||Array.isArray(rawBudgets)))invalidBudgets=1;else for(const [month,budget] of Object.entries(rawBudgets??{}))if(!budgetMonthSchema.safeParse(month).success||!monthBudgetSchema.safeParse(budget).success)invalidBudgets+=1;data.budgets=parseStoredBudgets(JSON.stringify(rawBudgets??{}));report.budgets={valid:Object.keys(data.budgets).length,invalid:invalidBudgets};
 const settings=plannerSettingsSchema.safeParse(value.appData.fiftyThirtyTwentySettings);data.fiftyThirtyTwentySettings=settings.success?settings.data:parseStoredPlannerSettings(null);report.fiftyThirtyTwentySettings={valid:settings.success?1:0,invalid:settings.success?0:1};
 const accountIds=new Set([GENERAL_ACCOUNT_ID,...data.accounts.map(item=>item.id)]),goalIds=new Set(data.savingsGoals.map(item=>item.id)),transferIds=new Set(data.transfers.map(item=>item.id));const missing=[];
 for(const item of data.transactions)if(item.accountId&&!accountIds.has(item.accountId))missing.push(`Transaction ${item.id} references a missing account.`);
 for(const item of data.recurringRules)if(item.accountId&&!accountIds.has(item.accountId))missing.push(`Recurring transaction ${item.id} references a missing account.`);
 for(const item of data.transfers)if(!accountIds.has(item.fromAccountId)||!accountIds.has(item.toAccountId))missing.push(`Transfer ${item.id} references a missing account.`);
 for(const item of data.recurringTransfers)if(!accountIds.has(item.fromAccountId)||!accountIds.has(item.toAccountId))missing.push(`Recurring transfer ${item.id} references a missing account.`);
 for(const item of data.savingsGoals)if(item.linkedAccountId&&!accountIds.has(item.linkedAccountId))missing.push(`Goal ${item.id} references a missing account.`);
 for(const item of data.savingsGoalContributions){if(!goalIds.has(item.goalId))missing.push(`Contribution ${item.id} references a missing goal.`);if(!accountIds.has(item.accountId))missing.push(`Contribution ${item.id} references a missing account.`);if(item.transferId&&!transferIds.has(item.transferId))missing.push(`Contribution ${item.id} references a missing transfer.`);}
 for(const item of data.recurringSavingsGoalContributions){if(!goalIds.has(item.goalId))missing.push(`Recurring goal contribution ${item.id} references a missing goal.`);if(!accountIds.has(item.accountId))missing.push(`Recurring goal contribution ${item.id} references a missing account.`);}
 return{success:true,data,report,missing,exportedAt:value.exportedAt,version:value.version};
};
export const parseBackupText=text=>{try{return validateBackupObject(JSON.parse(text));}catch{return{success:false,error:"The backup contains invalid JSON."};}};

const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const findBackupConflicts=(current,imported)=>{const conflicts=BACKUP_DATASETS.flatMap(dataset=>{const byId=new Map((current[dataset]??[]).map(item=>[item.id,item]));return(imported[dataset]??[]).flatMap(item=>byId.has(item.id)&&!equal(byId.get(item.id),item)?[{dataset,id:item.id,current:byId.get(item.id),imported:item}]:[]);});for(const [categoryId,override] of Object.entries(imported.categoryIconOverrides??{}))if(current.categoryIconOverrides?.[categoryId]&&!equal(current.categoryIconOverrides[categoryId],override))conflicts.push({dataset:"categoryIconOverrides",id:categoryId,current:current.categoryIconOverrides[categoryId],imported:override});for(const [month,budget] of Object.entries(imported.budgets??{}))if(current.budgets?.[month]&&!equal(current.budgets[month],budget))conflicts.push({dataset:"budgets",id:month,current:current.budgets[month],imported:budget});if(current.fiftyThirtyTwentySettings&&imported.fiftyThirtyTwentySettings&&!equal(current.fiftyThirtyTwentySettings,imported.fiftyThirtyTwentySettings))conflicts.push({dataset:"fiftyThirtyTwentySettings",id:"settings",current:current.fiftyThirtyTwentySettings,imported:imported.fiftyThirtyTwentySettings});return conflicts;};
export const mergeBackupData=(current,imported,resolution="current")=>{const result={};for(const dataset of BACKUP_DATASETS){const map=new Map((current[dataset]??[]).map(item=>[item.id,item]));for(const item of imported[dataset]??[]){if(!map.has(item.id)||resolution==="imported")map.set(item.id,item);}result[dataset]=[...map.values()];}result.categoryIconOverrides={...(resolution==="imported"?current.categoryIconOverrides:imported.categoryIconOverrides),...(resolution==="imported"?imported.categoryIconOverrides:current.categoryIconOverrides)};result.budgets={...(resolution==="imported"?current.budgets:imported.budgets),...(resolution==="imported"?imported.budgets:current.budgets)};result.fiftyThirtyTwentySettings=resolution==="imported"?imported.fiftyThirtyTwentySettings:(current.fiftyThirtyTwentySettings??imported.fiftyThirtyTwentySettings);return result;};
