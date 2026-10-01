import { getDueOccurrences } from "./recurring.js";
import { transferSchema } from "./transferSchema.js";
import { savingsGoalContributionSchema } from "./savingsGoalContributionSchema.js";

export const generateRecurringTransfers = (rules, transfers, today, createId=()=>crypto.randomUUID()) => {
 const existing=new Set(transfers.filter(item=>item.recurringTransferRuleId&&item.recurringOccurrenceDate).map(item=>`${item.recurringTransferRuleId}\0${item.recurringOccurrenceDate}`)); const generated=[]; let changed=false;
 const nextRules=rules.map(rule=>{const due=getDueOccurrences(rule,today);if(!due.length)return rule;for(const date of due){const key=`${rule.id}\0${date}`;if(existing.has(key))continue;const result=transferSchema.safeParse({id:`transfer-${createId()}`,fromAccountId:rule.fromAccountId,toAccountId:rule.toAccountId,amount:rule.amount,date,note:rule.note,createdAt:new Date().toISOString(),recurringTransferRuleId:rule.id,recurringOccurrenceDate:date});if(result.success){generated.push(result.data);existing.add(key);}}changed=true;return{...rule,processedThrough:due.at(-1)};});
 return{rules:changed?nextRules:rules,transfers:generated.length?[...transfers,...generated]:transfers,changed,generatedCount:generated.length};
};

export const generateRecurringGoalContributions = (rules, goals, contributions, transfers, today, createId=()=>crypto.randomUUID()) => {
 const existing=new Set(contributions.filter(item=>item.recurringGoalContributionRuleId&&item.recurringOccurrenceDate).map(item=>`${item.recurringGoalContributionRuleId}\0${item.recurringOccurrenceDate}`));const generated=[],generatedTransfers=[];let changed=false;
 const nextRules=rules.map(rule=>{const goal=goals.find(item=>item.id===rule.goalId);if(!goal||goal.archived||!rule.active)return rule;const due=getDueOccurrences(rule,today);if(!due.length)return rule;for(const date of due){const key=`${rule.id}\0${date}`;if(existing.has(key))continue;let transferId; if(rule.createTransfer&&goal.linkedAccountId&&goal.linkedAccountId!==rule.accountId){const transfer=transferSchema.safeParse({id:`transfer-${createId()}`,fromAccountId:rule.accountId,toAccountId:goal.linkedAccountId,amount:rule.amount,date,note:`Savings goal: ${goal.name}`,createdAt:new Date().toISOString()});if(transfer.success){generatedTransfers.push(transfer.data);transferId=transfer.data.id;}}
 const contribution=savingsGoalContributionSchema.safeParse({id:`goal-contribution-${createId()}`,goalId:rule.goalId,amount:rule.amount,date,accountId:rule.accountId,transferId,note:rule.note,createdAt:new Date().toISOString(),recurringGoalContributionRuleId:rule.id,recurringOccurrenceDate:date});if(contribution.success){generated.push(contribution.data);existing.add(key);}}
 changed=true;return{...rule,processedThrough:due.at(-1)};});
 return{rules:changed?nextRules:rules,contributions:generated.length?[...contributions,...generated]:contributions,transfers:generatedTransfers.length?[...transfers,...generatedTransfers]:transfers,changed,generatedCount:generated.length};
};
