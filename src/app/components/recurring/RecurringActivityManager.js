import RecurringManager from "../RecurringManager";
import RecurringMoneyManager from "./RecurringMoneyManager";
export default function RecurringActivityManager({transactionProps,moneyProps}){return <section className="card mt-4" aria-labelledby="recurring-activity-heading"><div className="card-body"><h2 id="recurring-activity-heading" className="h4 mb-4">Recurring Activity</h2><RecurringManager {...transactionProps} embedded/><hr className="my-4"/><RecurringMoneyManager {...moneyProps} embedded/></div></section>;}
