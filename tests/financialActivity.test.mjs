import test from "node:test";
import assert from "node:assert/strict";
import { applyActivityFilters, createFinancialActivities, getActivitiesForPeriod, groupActivitiesByMonth, sortActivities } from "../src/app/utils/financialActivity.js";
import { getCategoryById, searchCategories } from "../src/app/utils/tags.js";

const createdAt="2026-09-01T00:00:00.000Z";
const accounts=[{id:"bank",name:"Maybank",type:"bank",openingBalance:0,archived:false,createdAt}];
const goals=[{id:"goal-1",name:"Japan Trip",icon:"\u2708\ufe0f"}];
const transactions=[{id:"tx-1",description:"Salary",tag:"salary",amount:5000,type:"income",date:"2026-09-25",accountId:"bank"}];
const contributions=[{id:"contribution-1",goalId:"goal-1",amount:500,date:"2026-09-20",accountId:"bank",note:"Holiday fund",createdAt}];

test("unified activity includes contributions without duplicating transaction storage",()=>{
 const activities=createFinancialActivities(transactions,contributions,goals,accounts);
 assert.equal(activities.length,2);
 assert.equal(transactions.length,1);
 const savings=activities.find(item=>item.activityKind==="savings-contribution");
 assert.equal(savings.type,"savings-contribution");
 assert.equal(savings.tag,"contribution");
 assert.equal(savings.goalName,"Japan Trip");
 assert.equal(savings.accountName,"Maybank");
});

test("contributions participate in monthly/yearly browsing, search, type, and account filters",()=>{
 const activities=createFinancialActivities(transactions,contributions,goals,accounts);
 assert.equal(getActivitiesForPeriod(activities,"monthly","2026-09",2026).length,2);
 assert.equal(getActivitiesForPeriod(activities,"yearly","2025-01",2026).length,2);
 assert.equal(applyActivityFilters(activities,{search:"holiday"}).length,1);
 assert.equal(applyActivityFilters(activities,{search:"maybank"}).length,1);
 assert.equal(applyActivityFilters(activities,{type:"savings-contribution"}).length,1);
 assert.equal(applyActivityFilters(activities,{tag:"contribution"}).length,1);
 assert.equal(applyActivityFilters(activities,{accountId:"bank"}).length,2);
});

test("Contribution is a system-only built-in category",()=>{
 const category=getCategoryById("contribution");
 assert.deepEqual({name:category.name,type:category.type,icon:category.icon,systemOnly:category.systemOnly},{name:"Contribution",type:"expense",icon:"🎯",systemOnly:true});
 assert.equal(searchCategories("contribution","expense").some(item=>item.id==="contribution"),false);
 assert.equal(searchCategories("contribution","expense",[],[],["contribution"]).some(item=>item.id==="contribution"),true);
});

test("unified activities sort and group chronologically without changing financial types",()=>{
 const activities=createFinancialActivities(transactions,contributions,goals,accounts);
 assert.equal(sortActivities(activities,"newest")[0].sourceId,"tx-1");
 const groups=groupActivitiesByMonth(activities,"newest");
 assert.equal(groups.length,1);
 assert.equal(groups[0].activities.length,2);
 assert.equal(groups[0].activities.filter(item=>item.activityKind==="transaction").length,1);
});
