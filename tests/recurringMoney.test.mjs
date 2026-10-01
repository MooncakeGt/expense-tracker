import test from "node:test";
import assert from "node:assert/strict";
import { generateRecurringGoalContributions, generateRecurringTransfers } from "../src/app/utils/recurringMoney.js";
import { occurrenceAt } from "../src/app/utils/recurring.js";

const base={amount:500,frequency:"monthly",interval:1,startDate:"2026-01-31",endDate:null,processedThrough:null,active:true,pausedAt:null,note:"Save",createdAt:"2026-01-01T00:00:00.000Z"};
const transferRule={...base,id:"recurring-transfer-1",fromAccountId:"bank",toAccountId:"savings"};
const goal={id:"goal-550e8400-e29b-41d4-a716-446655440000",name:"Trip",targetAmount:6000,targetDate:null,linkedAccountId:"savings",icon:"✈️",note:"",archived:false,createdAt:base.createdAt};
const goalRule={...base,id:"recurring-goal-contribution-1",goalId:goal.id,accountId:"bank",createTransfer:true};

test("recurring transfers reuse month-end and leap-year anchoring",()=>{
 assert.deepEqual([0,1,2,3].map(index=>occurrenceAt(transferRule,index)),["2026-01-31","2026-02-28","2026-03-31","2026-04-30"]);
 const leap={...transferRule,frequency:"yearly",startDate:"2028-02-29"};
 assert.deepEqual([0,1,4].map(index=>occurrenceAt(leap,index)),["2028-02-29","2029-02-28","2032-02-29"]);
});

test("generates due recurring transfers once and advances checkpoint",()=>{
 let n=0;const first=generateRecurringTransfers([transferRule],[],"2026-03-31",()=>`id-${++n}`);
 assert.deepEqual(first.transfers.map(item=>item.date),["2026-01-31","2026-02-28","2026-03-31"]);
 assert.equal(first.rules[0].processedThrough,"2026-03-31");
 const second=generateRecurringTransfers(first.rules,first.transfers,"2026-03-31",()=>`id-${++n}`);
 assert.equal(second.generatedCount,0);
});

test("paused transfer rules generate nothing and resume checkpoints skip backfill",()=>{
 assert.equal(generateRecurringTransfers([{...transferRule,active:false}],[],"2026-03-31").generatedCount,0);
 const resumed={...transferRule,processedThrough:"2026-03-31",startDate:"2026-01-31"};
 assert.deepEqual(generateRecurringTransfers([resumed],[],"2026-04-30",()=>"one").transfers.map(item=>item.date),["2026-04-30"]);
});

test("recurring goal contribution creates one contribution and one linked transfer",()=>{
 const result=generateRecurringGoalContributions([{...goalRule,startDate:"2026-09-01"}],[goal],[],[],"2026-09-20",()=>"11111111-1111-4111-8111-111111111111");
 assert.equal(result.contributions.length,1);assert.equal(result.transfers.length,1);
 assert.equal(result.contributions[0].transferId,result.transfers[0].id);
 const again=generateRecurringGoalContributions(result.rules,[goal],result.contributions,result.transfers,"2026-09-20",()=>"22222222-2222-4222-8222-222222222222");
 assert.equal(again.generatedCount,0);assert.equal(again.transfers.length,1);
});

test("missing linked account creates contribution without inventing a transfer",()=>{
 const result=generateRecurringGoalContributions([{...goalRule,startDate:"2026-09-01"}],[{...goal,linkedAccountId:null}],[],[],"2026-09-20",()=>"11111111-1111-4111-8111-111111111111");
 assert.equal(result.contributions.length,1);assert.equal(result.transfers.length,0);assert.equal(result.contributions[0].transferId,undefined);
});

test("archived goals and paused goal rules do not generate",()=>{
 assert.equal(generateRecurringGoalContributions([{...goalRule,startDate:"2026-09-01"}],[{...goal,archived:true}],[],[],"2026-09-20").generatedCount,0);
 assert.equal(generateRecurringGoalContributions([{...goalRule,startDate:"2026-09-01",active:false}],[goal],[],[],"2026-09-20").generatedCount,0);
});
