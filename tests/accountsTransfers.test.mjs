import test from "node:test";
import assert from "node:assert/strict";
import { validateAccountInput, parseStoredAccounts } from "../src/app/utils/accountSchema.js";
import { LIABILITY_ACCOUNT_TYPES, GENERAL_ACCOUNT_ID, calculateAccountBalance, calculateAllAccountBalances, getAllAccounts, getGeneralAccount, getAccountTotals, isLiabilityAccount, resolveAccount } from "../src/app/utils/accounts.js";
import { validateTransferInput, parseStoredTransfers } from "../src/app/utils/transferSchema.js";
import { buildCalendarMonth, getMonthlySummary } from "../src/app/utils/dashboard.js";
import { EMPTY_VALUE, MINUS_SIGN, SAVINGS_ALLOCATION_SYMBOL, TRANSFER_SYMBOL } from "../src/app/utils/display.js";

const createdAt = "2026-09-28T00:00:00.000Z";
const bank = { id:"account-bank", name:"Maybank", type:"bank", openingBalance:5000, archived:false, createdAt };
const savings = { id:"account-savings", name:"Savings", type:"savings", openingBalance:0, archived:false, createdAt };
const card = { id:"account-card", name:"Visa", type:"credit-card", openingBalance:0, archived:false, createdAt };
const transfer = { id:"transfer-1", fromAccountId:bank.id, toAccountId:savings.id, amount:1000, date:"2026-09-28", note:"Save", createdAt };

test("account validation, fallback, and partial storage recovery", () => {
 assert.equal(validateAccountInput({...bank,openingBalance:"5000"}).success,true);
 assert.equal(resolveAccount(undefined,[]).id,"general");
 assert.deepEqual(parseStoredAccounts(JSON.stringify([bank,{bad:true}])).map(x=>x.id),[bank.id]);
});

test("General customization persists with its permanent ID and cannot be archived", () => {
 const customized={id:GENERAL_ACCOUNT_ID,name:"Daily Wallet",type:"cash",openingBalance:250,archived:true,createdAt};
 const restored=parseStoredAccounts(JSON.stringify([customized,customized]));
 assert.equal(restored.length,1);
 assert.deepEqual(getGeneralAccount(restored),{...customized,archived:false,system:true});
 assert.equal(getAllAccounts(restored).filter(account=>account.id===GENERAL_ACCOUNT_ID).length,1);
 assert.equal(resolveAccount(undefined,restored).name,"Daily Wallet");
 assert.equal(calculateAccountBalance(getGeneralAccount(restored),[],[]),250);
});

test("asset transfers change balances without changing analytics", () => {
 assert.equal(calculateAccountBalance(bank,[],[transfer]),4000);
 assert.equal(calculateAccountBalance(savings,[],[transfer]),1000);
 assert.deepEqual(getMonthlySummary([]),{income:0,expenses:0,net:0,savingsRate:null,count:0,incomeCount:0,expenseCount:0});
});

test("credit-card purchases increase owed and payments reduce it", () => {
 const laptop={id:"1",description:"Laptop",tag:"technology",amount:2000,type:"expense",date:"2026-09-28",accountId:card.id};
 const payment={...transfer,id:"transfer-2",toAccountId:card.id,amount:2000};
 assert.equal(calculateAccountBalance(card,[laptop],[]),2000);
 assert.equal(calculateAccountBalance(card,[laptop],[payment]),0);
 assert.equal(calculateAccountBalance(bank,[laptop],[payment]),3000);
 const totals=getAccountTotals(calculateAllAccountBalances([bank,card],[laptop],[payment]));
 assert.equal(totals.creditOwed,0);
 assert.equal(getMonthlySummary([laptop]).expenses,2000);
});

test("loan and mortgage accounts validate and use liability balance semantics", () => {
 const supported=["personal-loan","student-loan","vehicle-loan","mortgage","other-debt"];
 assert.deepEqual(LIABILITY_ACCOUNT_TYPES,["credit-card",...supported]);
 for(const type of supported){
  assert.equal(validateAccountInput({...bank,id:`account-${type}`,type}).success,true);
  assert.equal(isLiabilityAccount(type),true);
 }
 const loan={...bank,id:"account-loan",name:"Car loan",type:"vehicle-loan",openingBalance:10000};
 const charge={id:"loan-charge",description:"Loan fee",tag:"other",amount:500,type:"expense",date:"2026-09-28",accountId:loan.id};
 const repayment={...transfer,id:"loan-payment",toAccountId:loan.id,amount:1500};
 assert.equal(calculateAccountBalance(loan,[charge],[repayment]),9000);
});

test("Total Debt uses liability balances only and counts repayments and transfers once", () => {
 const loan={...bank,id:"account-loan",name:"Personal loan",type:"personal-loan",openingBalance:10000};
 const cardPurchase={id:"card-purchase",description:"Purchase",tag:"shopping",amount:200,type:"expense",date:"2026-09-28",accountId:card.id};
 const bankDebtCategory={id:"bank-debt-tag",description:"Debt category only",tag:"debt-loans",amount:100,type:"expense",date:"2026-09-28",accountId:bank.id};
 const cardPayment={...transfer,id:"card-payment",toAccountId:card.id,amount:50};
 const loanPayment={...transfer,id:"loan-payment",toAccountId:loan.id,amount:1500};
 const totals=getAccountTotals(calculateAllAccountBalances([bank,card,loan],[cardPurchase,bankDebtCategory],[cardPayment,loanPayment]));
 assert.equal(totals.available,3350);
 assert.equal(totals.totalDebt,8650);
 assert.equal(totals.creditOwed,150);
 const overpaid=getAccountTotals([{account:card,balance:-100},{account:loan,balance:1000}]);
 assert.equal(overpaid.totalDebt,1000);
});

test("transfer validation and partial storage recovery", () => {
 assert.equal(validateTransferInput({...transfer,amount:"1000"}).success,true);
 assert.equal(validateTransferInput({...transfer,toAccountId:bank.id}).success,false);
 assert.equal(validateTransferInput({...transfer,amount:0}).success,false);
 assert.equal(parseStoredTransfers(JSON.stringify([transfer,{bad:true}])).length,1);
});

test("calendar lists transfers separately without changing totals", () => {
 const calendar=buildCalendarMonth([],"2026-09",[transfer]);
 const day=calendar.byDate.get("2026-09-28");
 assert.equal(day.transfers.length,1); assert.equal(day.income,0); assert.equal(day.expenses,0);
});

test("shared display symbols use the intended Unicode code points",()=>{
 assert.equal(EMPTY_VALUE,"\u2014");
 assert.equal(MINUS_SIGN,"\u2212");
 assert.equal(TRANSFER_SYMBOL,"\u2194");
 assert.equal(SAVINGS_ALLOCATION_SYMBOL,"\u25C6");
 assert.notEqual(MINUS_SIGN, String.fromCodePoint(0x00e2, 0x02c6, 0x2019));
});
