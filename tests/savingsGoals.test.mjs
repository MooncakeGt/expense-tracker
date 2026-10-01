import test from "node:test";
import assert from "node:assert/strict";
import { validateSavingsGoalInput, parseStoredSavingsGoals } from "../src/app/utils/savingsGoalSchema.js";
import { validateSavingsGoalContributionInput, parseStoredSavingsGoalContributions } from "../src/app/utils/savingsGoalContributionSchema.js";
import { GOAL_ICONS, deleteSavingsGoalData, getActiveGoals, getGoalProgress, getGoalRemainingAmount, getGoalSavedAmount, getGoalStatus, getGoalsSummary, getValidGoalContributions } from "../src/app/utils/savingsGoals.js";
import { calculateAccountBalance } from "../src/app/utils/accounts.js";
import { getMonthlySummary, buildCalendarMonth } from "../src/app/utils/dashboard.js";
import { getPlannerData } from "../src/app/utils/fiftyThirtyTwenty.js";
import { calculateBudgetProgress } from "../src/app/utils/budgets.js";

const createdAt="2026-09-28T00:00:00.000Z";
const goal={id:"goal-550e8400-e29b-41d4-a716-446655440000",name:"Japan Trip",targetAmount:6000,targetDate:"2027-04-01",linkedAccountId:"account-savings",icon:"✈️",note:"Travel",archived:false,createdAt};
const contribution=(id,amount,extra={})=>({id:`goal-contribution-${id}`,goalId:goal.id,amount,date:"2026-09-28",accountId:"account-bank",note:"Monthly savings",createdAt,...extra});
const c1=contribution("11111111-1111-4111-8111-111111111111",500);
const c2=contribution("22222222-2222-4222-8222-222222222222",1000);

test("goal schema validates stable identity, dates, and positive targets",()=>{
 assert.equal(validateSavingsGoalInput({...goal,targetAmount:"6000"}).success,true);
 assert.equal(validateSavingsGoalInput({...goal,targetAmount:0}).success,false);
 assert.equal(validateSavingsGoalInput({...goal,targetDate:"2027-02-30"}).success,false);
 assert.equal(validateSavingsGoalInput({...goal,id:"goal-random"}).success,false);
});

test("contribution schema validates references, dates, and positive amounts",()=>{
 assert.equal(validateSavingsGoalContributionInput({...c1,amount:"500",transferId:"transfer-1"}).success,true);
 assert.equal(validateSavingsGoalContributionInput({...c1,amount:-1}).success,false);
 assert.equal(validateSavingsGoalContributionInput({...c1,date:"not-a-date"}).success,false);
});

test("progress, remaining, and completion are derived from contributions",()=>{
 assert.equal(getGoalSavedAmount(goal.id,[c1,c2]),1500);
 assert.equal(getGoalProgress(goal,[c1,c2]),25);
 assert.equal(getGoalRemainingAmount(goal,[c1,c2]),4500);
 assert.equal(getGoalStatus(goal,[c1,c2]),"In Progress");
});

test("over-target values are retained and remaining is never negative",()=>{
 const small={...goal,targetAmount:1000};
 assert.equal(getGoalSavedAmount(goal.id,[c1,c2]),1500);
 assert.equal(getGoalProgress(small,[c1,c2]),150);
 assert.equal(getGoalRemainingAmount(small,[c1,c2]),0);
 assert.equal(getGoalStatus(small,[c1,c2]),"Completed");
});

test("editing target or name preserves contribution linkage by goal ID",()=>{
 const edited={...goal,name:"Japan 2027",targetAmount:8000};
 assert.equal(getGoalSavedAmount(edited.id,[c1,c2]),1500);
 assert.equal(getGoalProgress(edited,[c1,c2]),18.75);
});

test("archived goals are excluded from active totals but retain history",()=>{
 const archived={...goal,archived:true};
 assert.equal(getActiveGoals([archived]).length,0);
 assert.equal(getGoalStatus(archived,[c1]),"Archived");
 assert.deepEqual(getGoalsSummary([archived],[c1]),{totalTarget:0,totalSaved:0,progress:null,activeCount:0});
 assert.equal(getGoalSavedAmount(archived.id,[c1]),500);
});

test("orphaned contributions are excluded safely",()=>{
 const orphan={...c1,id:"goal-contribution-33333333-3333-4333-8333-333333333333",goalId:"missing-goal"};
 assert.deepEqual(getValidGoalContributions([goal],[c1,orphan]),[c1]);
 assert.equal(getGoalsSummary([goal],[c1,orphan]).totalSaved,500);
});

test("storage parsers recover valid records individually",()=>{
 assert.equal(parseStoredSavingsGoals(JSON.stringify([goal,{bad:true}])).length,1);
 assert.equal(parseStoredSavingsGoalContributions(JSON.stringify([c1,{bad:true}])).length,1);
 assert.deepEqual(parseStoredSavingsGoals("{bad"),[]);
});

test("legacy mojibake savings icons normalize to the intended emoji",()=>{
 const legacyMoney="\u00f0\u0178\u2019\u00b0";
 const validated=validateSavingsGoalInput({...goal,icon:legacyMoney});
 assert.equal(validated.success,true);
 assert.equal(validated.data.icon,GOAL_ICONS[0]);
 assert.equal(parseStoredSavingsGoals(JSON.stringify([{...goal,icon:legacyMoney}]))[0].icon,GOAL_ICONS[0]);
});

test("deleting an empty savings goal removes only that goal",()=>{
 const other={...goal,id:"goal-11111111-1111-4111-8111-111111111111",name:"Emergency Fund"};
 const result=deleteSavingsGoalData({goals:[goal,other]},goal.id);
 assert.deepEqual(result.goals,[other]);
 assert.deepEqual(result.contributions,[]);
 assert.deepEqual(result.recurringRules,[]);
});

test("deleting a goal removes its contributions without affecting other goals",()=>{
 const otherGoal={...goal,id:"goal-11111111-1111-4111-8111-111111111111",name:"Emergency Fund"};
 const otherContribution={...c2,goalId:otherGoal.id};
 const result=deleteSavingsGoalData({goals:[goal,otherGoal],contributions:[c1,otherContribution]},goal.id);
 assert.deepEqual(result.contributions,[otherContribution]);
 assert.deepEqual(result.goals,[otherGoal]);
});

test("deleting a goal removes recurring contribution rules tied to it",()=>{
 const matchingRule={id:"recurring-goal-contribution-1",goalId:goal.id};
 const otherRule={id:"recurring-goal-contribution-2",goalId:"goal-11111111-1111-4111-8111-111111111111"};
 const result=deleteSavingsGoalData({goals:[goal],recurringRules:[matchingRule,otherRule]},goal.id);
 assert.deepEqual(result.recurringRules,[otherRule]);
});

test("deleting a goal preserves linked transfer history",()=>{
 const transfer={id:"transfer-1",fromAccountId:"account-bank",toAccountId:"account-savings",amount:500,date:"2026-09-28"};
 const result=deleteSavingsGoalData({goals:[goal],contributions:[{...c1,transferId:transfer.id}],transfers:[transfer]},goal.id);
 assert.deepEqual(result.transfers,[transfer]);
 assert.equal(result.transfers[0],transfer);
});

test("goal deletion leaves no contribution or recurring-rule references to the deleted goal",()=>{
 const rule={id:"recurring-goal-contribution-1",goalId:goal.id};
 const result=deleteSavingsGoalData({goals:[{...goal,archived:true}],contributions:[c1,c2],recurringRules:[rule]},goal.id);
 assert.equal(result.goals.some(item=>item.id===goal.id),false);
 assert.equal(result.contributions.some(item=>item.goalId===goal.id),false);
 assert.equal(result.recurringRules.some(item=>item.goalId===goal.id),false);
 assert.deepEqual(getValidGoalContributions(result.goals,result.contributions),result.contributions);
});

test("linked transfer owns account movement once while contribution leaves analytics unchanged",()=>{
 const bank={id:"account-bank",name:"Maybank",type:"bank",openingBalance:5000,archived:false,createdAt};
 const savings={id:"account-savings",name:"Savings",type:"savings",openingBalance:0,archived:false,createdAt};
 const transfer={id:"transfer-1",fromAccountId:bank.id,toAccountId:savings.id,amount:500,date:"2026-09-28",note:"Goal",createdAt};
 const linked={...c1,transferId:transfer.id};
 assert.equal(calculateAccountBalance(bank,[],[transfer],[linked]),4500);
 assert.equal(calculateAccountBalance(savings,[],[transfer],[linked]),500);
 assert.equal(calculateAccountBalance(bank,[],[],[linked]),4500);
 assert.equal(getGoalSavedAmount(goal.id,[linked]),500);
 assert.deepEqual(getMonthlySummary([]),{income:0,expenses:0,net:0,savingsRate:null,count:0,incomeCount:0,expenseCount:0});
});

test("manual contribution decreases its account and edit/delete recalculate derived balance",()=>{
 const savings={id:"account-savings",name:"Savings",type:"savings",openingBalance:2000,archived:false,createdAt};
 const original={...c1,accountId:savings.id}, edited={...original,amount:700};
 assert.equal(calculateAccountBalance(savings,[],[],[original]),1500);
 assert.equal(calculateAccountBalance(savings,[],[],[edited]),1300);
 assert.equal(calculateAccountBalance(savings,[],[],[]),2000);
 assert.equal(getGoalSavedAmount(goal.id,[original]),500);
});

test("savings contributions remain outside expenses, budgets, and 50/30/20",()=>{
 const transactions=[];
 assert.equal(getMonthlySummary(transactions).expenses,0);
 assert.equal(calculateBudgetProgress(0,1000).spent,0);
 assert.deepEqual(getPlannerData(transactions,"2026-09",{needs:50,wants:30,savings:20}).actuals,{needs:0,wants:0,savings:0,unassigned:0});
});

test("calendar lists savings separately without affecting daily financial totals",()=>{
 const data=buildCalendarMonth([],"2026-09",[],[c1]); const day=data.byDate.get("2026-09-28");
 assert.equal(day.savingsGoalContributions.length,1); assert.equal(day.income,0); assert.equal(day.expenses,0); assert.equal(data.summary.net,0);
});
