import test from "node:test";
import assert from "node:assert/strict";
import { buildForecastEvents, calculateRequiredContribution, estimateGoalCompletionDate, FIXED_FORECAST_MONTHS, getAggregateMonthlyForecast, getCurrentYearAverageSpending, getForecastEndDate, getForecastMonths, getLatestActualMonthlyIncome, getMonthlyForecastSummary, getProjectedAvailableBalanceTrend, projectAccountBalances, simulateGoalContributionScenario } from "../src/app/utils/forecast.js";

const today="2026-09-28",createdAt="2026-01-01T00:00:00.000Z";
const schedule={frequency:"monthly",interval:1,startDate:"2026-10-01",endDate:null,processedThrough:today,active:true,pausedAt:null,createdAt,note:""};
const tx=(id,type,amount,accountId,date="2026-10-01")=>({id,description:id,tag:type==="income"?"salary":"housing",amount,type,accountId,...schedule,startDate:date});
const transfer={id:"rt",fromAccountId:"bank",toAccountId:"savings",amount:1000,...schedule,startDate:"2026-10-05"};
const goal={id:"goal-550e8400-e29b-41d4-a716-446655440000",name:"Japan",targetAmount:6000,targetDate:null,linkedAccountId:"savings",icon:"✈️",note:"",archived:false,createdAt};
const goalRule={id:"rg",goalId:goal.id,accountId:"bank",amount:500,createTransfer:true,...schedule,startDate:"2026-10-05"};
const contribution={id:"goal-contribution-11111111-1111-4111-8111-111111111111",goalId:goal.id,amount:2000,date:today,accountId:"savings",note:"",createdAt};
const bank={id:"bank",name:"Bank",type:"bank",openingBalance:2000,archived:false,createdAt};
const savings={id:"savings",name:"Savings",type:"savings",openingBalance:0,archived:false,createdAt};

test("forecast builds recurring events without mutating actual arrays",()=>{
 const actual=[];const events=buildForecastEvents({transactionRules:[tx("Salary","income",5000,"bank"),tx("Rent","expense",1500,"bank","2026-10-03")],transferRules:[transfer],goalContributionRules:[goalRule],goals:[goal],today,endDate:"2026-10-31"});
 assert.equal(events.length,4);assert.deepEqual(actual,[]);assert.deepEqual(events.map(item=>item.kind),["transaction","transaction","transfer","goal-contribution"]);
});

test("same-day ordering is income, expense, transfer, goal contribution",()=>{
 const events=buildForecastEvents({transactionRules:[tx("Expense","expense",1,"bank"),tx("Income","income",1,"bank")],transferRules:[{...transfer,startDate:"2026-10-01"}],goalContributionRules:[{...goalRule,startDate:"2026-10-01"}],goals:[goal],today,endDate:"2026-10-01"});
 assert.deepEqual(events.map(item=>item.kind==="transaction"?item.subtype:item.kind),["income","expense","transfer","goal-contribution"]);
});

test("paused rules are excluded",()=>assert.equal(buildForecastEvents({transactionRules:[{...tx("Salary","income",5000,"bank"),active:false}],today,endDate:"2026-10-31"}).length,0));

test("account projection preserves transfer isolation and detects negative balances",()=>{
 const events=buildForecastEvents({transactionRules:[tx("Salary","income",5000,"bank"),tx("Rent","expense",1500,"bank","2026-10-03")],transferRules:[transfer],goalContributionRules:[],goals:[goal],today,endDate:"2026-10-31"});
 const result=projectAccountBalances([bank,savings],[],[],events);assert.equal(result.final.bank,4500);assert.equal(result.final.savings,1000);
 const negative=projectAccountBalances([{...bank,openingBalance:100}],[],[],[{kind:"transaction",subtype:"expense",date:"2026-10-01",amount:200,accountId:"bank",sourceRuleId:"x"}]);assert.equal(negative.warnings[0].balance,-100);
});

test("fixed forecast covers exactly the next 12 calendar months",()=>{
 const months=getForecastMonths(today);
 assert.equal(FIXED_FORECAST_MONTHS,12);
 assert.equal(months.length,12);
 assert.equal(months[0],"2026-10");
 assert.equal(months.at(-1),"2027-09");
 assert.equal(getForecastEndDate(today,FIXED_FORECAST_MONTHS),"2027-09-28");
});

test("next-month cash flow uses only the first forecast month",()=>{
 const rows=getAggregateMonthlyForecast([],today,1,4000,3000);
 assert.deepEqual(rows,[{month:"2026-10",income:4000,expenses:3000,net:1000,transfers:0,goalContributions:0}]);
});

test("available balance carries monthly projected savings forward",()=>{
 const trend=getProjectedAvailableBalanceTrend(2000,[
  {month:"2026-10",net:1000},
  {month:"2026-11",net:-250},
  {month:"2026-12",net:500},
 ]);
 assert.deepEqual(trend,[
  {month:"2026-10",balance:3000},
  {month:"2026-11",balance:2750},
  {month:"2026-12",balance:3250},
 ]);
});

test("account projections ignore recurring activity without a known account",()=>{
 const events=buildForecastEvents({transactionRules:[{...tx("Unknown","expense",500,undefined),accountId:undefined}],today,endDate:"2026-10-31"});
 assert.equal(events[0].accountId,null);
 assert.equal(projectAccountBalances([bank],[],[],events).final.bank,bank.openingBalance);
});

test("linked goal contribution moves accounts once while increasing goal forecast separately",()=>{
 const events=buildForecastEvents({goalContributionRules:[goalRule],goals:[goal],today,endDate:"2026-10-31"});const result=projectAccountBalances([bank,savings],[],[],events);
 assert.equal(events.length,1);assert.equal(result.final.bank,1500);assert.equal(result.final.savings,500);
});

test("unlinked projected goal contribution reduces only its source account",()=>{
 const rule={...goalRule,createTransfer:false};
 const events=buildForecastEvents({goalContributionRules:[rule],goals:[goal],today,endDate:"2026-10-31"});
 const result=projectAccountBalances([bank,savings],[],[],events);
 assert.equal(result.final.bank,1500);
 assert.equal(result.final.savings,0);
});

test("credit-card projected purchase and payment preserve liability semantics",()=>{
 const card={id:"card",name:"Visa",type:"credit-card",openingBalance:0,archived:false,createdAt};const events=[{kind:"transaction",subtype:"expense",date:"2026-10-01",amount:2000,accountId:"card",sourceRuleId:"purchase"},{kind:"transfer",date:"2026-10-02",amount:2000,fromAccountId:"bank",toAccountId:"card",sourceRuleId:"pay"}];const result=projectAccountBalances([bank,card],[],[],events);assert.equal(result.final.card,0);assert.equal(result.final.bank,0);
});

test("monthly summaries keep transfers and contributions outside net",()=>{
 const events=buildForecastEvents({transactionRules:[tx("Salary","income",5000,"bank"),tx("Rent","expense",1500,"bank")],transferRules:[transfer],goalContributionRules:[goalRule],goals:[goal],today,endDate:"2026-10-31"});const month=getMonthlyForecastSummary(events)[0];assert.equal(month.income,5000);assert.equal(month.expenses,1500);assert.equal(month.net,3500);assert.equal(month.transfers,1000);assert.equal(month.goalContributions,500);
});

test("goal ETA uses exact scheduled occurrences and multiple rules",()=>{
 const eta=estimateGoalCompletionDate(goal,[contribution],[goalRule],today);assert.equal(eta.date,"2027-05-05");
 const yearly={...goalRule,id:"yearly",amount:1000,frequency:"yearly",startDate:"2027-01-01"};assert.ok(estimateGoalCompletionDate(goal,[contribution],[goalRule,yearly],today).date<eta.date);
});

test("goal ETA handles completed and missing schedules",()=>{
 assert.equal(estimateGoalCompletionDate(goal,[{...contribution,amount:6000}],[],today).status,"completed");assert.equal(estimateGoalCompletionDate(goal,[contribution],[],today).status,"none");
});

test("what-if simulation supports higher and lower monthly plans without changing rules",()=>{
 const before=JSON.stringify(goalRule),higher=simulateGoalContributionScenario(goal,[contribution],[goalRule],today,750),lower=simulateGoalContributionScenario(goal,[contribution],[goalRule],today,250);assert.ok(higher.scenario.date<higher.base.date);assert.ok(lower.scenario.date>lower.base.date);assert.equal(JSON.stringify(goalRule),before);
});

test("required contribution calculator reports exact increase and invalid dates",()=>{
 const result=calculateRequiredContribution(goal,[contribution],[],today,"2027-05-28");assert.equal(result.valid,true);assert.equal(result.opportunities,8);assert.equal(result.exact,500);assert.equal(calculateRequiredContribution(goal,[contribution],[],today,today).valid,false);
});

test("latest income baseline uses the most recent month containing actual income",()=>{
 const actual=[
  {type:"income",amount:3000,date:"2026-01-10"},
  {type:"income",amount:2000,date:"2026-08-10"},
  {type:"income",amount:500,date:"2026-08-20"},
  {type:"expense",amount:999,date:"2026-09-20"},
  {type:"income",amount:9000,date:"2026-10-01"},
 ];
 assert.deepEqual(getLatestActualMonthlyIncome(actual,today),{month:"2026-08",total:2500});
 assert.deepEqual(getLatestActualMonthlyIncome([],today),{month:null,total:0});
});

test("current-year expense average uses only months containing actual expenses",()=>{
 const actual=[
  {type:"expense",amount:3000,date:"2026-01-10"},
  {type:"expense",amount:6000,date:"2026-09-20"},
  {type:"income",amount:5000,date:"2026-09-20"},
  {type:"expense",amount:999,date:"2025-12-31"},
  {type:"expense",amount:999,date:"2026-09-29"},
 ];
 assert.deepEqual(getCurrentYearAverageSpending(actual,today),{year:2026,total:9000,activeMonths:2,average:4500});
 assert.deepEqual(getCurrentYearAverageSpending([],today),{year:2026,total:0,activeMonths:0,average:0});
});

test("aggregate forecast applies actual baselines without recurring expense double counting",()=>{
 const events=[
  {kind:"transaction",subtype:"income",date:"2026-11-01",amount:5000},
  {kind:"transaction",subtype:"expense",date:"2026-11-02",amount:1500},
  {kind:"transfer",date:"2026-11-03",amount:1000},
  {kind:"goal-contribution",date:"2026-11-04",amount:500},
 ];
 const rows=getAggregateMonthlyForecast(events,"2026-10-01",FIXED_FORECAST_MONTHS,4000,3000);
 assert.equal(rows.length,12);
 assert.equal(rows[0].month,"2026-11");
 assert.equal(rows.at(-1).month,"2027-10");
 assert.ok(rows.every(row=>row.expenses===3000));
 assert.ok(rows.every(row=>row.income===4000));
 assert.equal(rows[0].net,1000);
 assert.equal(rows[0].transfers,1000);
 assert.equal(rows[0].goalContributions,500);
});
