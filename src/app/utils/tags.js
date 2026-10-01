const definition = (id, name, type, icon, budgetGroup, values) => ({ id, name, type, icon, budgetGroup, values: values.split("|") });

const definitions = [
    definition("food-dining", "Food & Dining", "expense", "🍔", "wants", "Restaurants|Fast Food|Cafes / Coffee|Breakfast|Lunch|Dinner|Snacks|Drinks / Beverages|Desserts|Takeaway|Food Delivery|Street Food|Food Court|Groceries|Convenience Store Food|Work Meals|School / University Meals|Social Dining|Outing Food & Drinks|Special Occasion Dining"),
    definition("transport", "Transport", "expense", "🚗", "needs", "Public Transport|Bus|Train|MRT / LRT|Monorail|Taxi|Ride Hailing|Fuel / Petrol|Parking|Tolls|Vehicle Maintenance|Vehicle Repairs|Tyres|Car Wash|Road Tax|Vehicle Insurance|Vehicle Accessories|Car Rental|Motorcycle|Bicycle|Micromobility / E-Scooter|Transport Pass|Intercity Transport"),
    definition("housing-home", "Housing & Home", "expense", "🏠", "needs", "Rent|Mortgage|Property Maintenance|Home Repairs|Renovation|Furniture|Appliances|Home Decorations|Kitchenware|Household Supplies|Cleaning Supplies|Cleaning Services|Laundry|Pest Control|Security|Storage|Moving / Relocation|Property Management Fees"),
    definition("utilities", "Utilities", "expense", "💡", "needs", "Electricity|Water|Gas|Internet|Mobile Plan|Landline|Sewerage|Waste / Garbage|Utility Deposits|Other Utilities"),
    definition("shopping", "Shopping", "expense", "🛍️", "wants", "Clothing|Shoes|Bags|Accessories|Electronics|Computer Hardware|Phone Accessories|Household Items|Furniture|Appliances|Stationery|Books|Collectibles|Online Shopping|Marketplace Purchases|Gifts|General Shopping|Miscellaneous Shopping"),
    definition("entertainment-leisure", "Entertainment & Leisure", "expense", "🎮", "wants", "Movies / Cinema|Gaming|Video Games|Arcades|Concerts|Events|Exhibitions|Conventions|Theme Parks|Karaoke|Nightlife|Bars / Clubs|Hobbies|Photography|Music|Arts & Crafts|Sports Activities|Outdoor Activities|Recreation|Outings|Social Gatherings|Meetup Activities|Tickets / Admissions"),
    definition("travel", "Travel", "expense", "✈️", "wants", "Flights|Hotels|Hostels|Airbnb / Vacation Rental|Travel Transport|Airport Transport|Car Rental|Travel Food|Attractions|Tours|Travel Insurance|Visa Fees|Passport Fees|Luggage|Travel Gear|SIM / Roaming|Currency Exchange Fees|Souvenirs"),
    definition("health-medical", "Health & Medical", "expense", "🏥", "needs", "Doctor / Clinic|Hospital|Emergency Care|Medication|Pharmacy|Dental|Optical / Eyewear|Specialist|Physiotherapy|Rehabilitation|Medical Tests|Vaccinations|Medical Equipment|Mental Health|Counselling|Health Screening|Medical Insurance"),
    definition("fitness-wellness", "Fitness & Wellness", "expense", "💪", "wants", "Gym|Fitness Membership|Sports|Sports Equipment|Personal Trainer|Yoga|Supplements|Massage|Spa|Wellness|Meditation"),
    definition("personal-care", "Personal Care", "expense", "🧴", "wants", "Haircut|Haircare|Skincare|Cosmetics|Grooming|Toiletries|Beauty Services|Nail Care|Fragrance|Personal Hygiene"),
    definition("education", "Education", "expense", "🎓", "needs", "Tuition|University Fees|College Fees|School Fees|Courses|Online Courses|Certifications|Exam Fees|Textbooks|Reference Books|Stationery|Study Software|Educational Subscriptions|School Supplies|Training|Workshops|Seminars"),
    definition("work-professional", "Work & Professional", "expense", "💼", "needs", "Office Supplies|Work Equipment|Work Software|Professional Memberships|Certifications|Business Travel|Client Meals|Networking|Conferences|Coworking Space|Printing|Professional Services|Work Clothing|Reimburseable Expenses"),
    definition("business", "Business", "expense", "🏢", "needs", "Inventory|Supplies|Equipment|Rent|Utilities|Payroll|Contractor Payments|Marketing|Advertising|Shipping|Delivery|Software|Hosting|Domains|Cloud Services|Professional Fees|Legal Fees|Accounting Fees|Business Insurance|Taxes|Banking Fees|Client Expenses|Miscellaneous Operating Expenses"),
    definition("technology", "Technology", "expense", "💻", "needs", "Computer|Laptop|Phone|Tablet|Monitor|Peripherals|Accessories|Cables / Adapters|Storage Devices|Networking Equipment|Software|Apps|SaaS|Cloud Services|Hosting|Domains|Cybersecurity|Antivirus|Repairs|Upgrades"),
    definition("subscriptions-memberships", "Subscriptions & Memberships", "expense", "📺", "wants", "Video Streaming|Music Streaming|Gaming Subscription|Software Subscription|Cloud Storage|News / Media|AI Services|Productivity Tools|Gym Membership|Clubs|Professional Memberships|Education Subscriptions|Delivery Memberships|Other Recurring Services"),
    definition("family", "Family", "expense", "👨‍👩‍👧", "needs", "Parents|Children|Childcare|School Expenses|Elder Care|Family Support|Family Meals|Family Activities|Family Travel|Family Medical|Family Gifts|Household Contribution"),
    definition("relationships-social", "Relationships & Social", "expense", "🫶", "wants", "Dating|Social Outings|Meals with Friends|Gatherings|Parties|Weddings|Birthdays|Celebrations|Gifts|Group Activities"),
    definition("pets", "Pets", "expense", "🐶", "needs", "Pet Food|Veterinary|Medication|Grooming|Pet Supplies|Toys|Boarding|Training|Pet Insurance|Adoption Fees"),
    definition("gifts-donations", "Gifts & Donations", "expense", "🎁", "wants", "Birthday Gifts|Wedding Gifts|Holiday Gifts|Family Gifts|Friend Gifts|Charity|Donations|Religious Giving|Crowdfunding|Community Support"),
    definition("insurance", "Insurance", "expense", "🛡️", "needs", "Health Insurance|Life Insurance|Vehicle Insurance|Home Insurance|Travel Insurance|Personal Accident Insurance|Pet Insurance|Business Insurance|Other Insurance"),
    definition("taxes-government", "Taxes & Government", "expense", "🏛️", "needs", "Income Tax|Property Tax|Road Tax|Government Fees|License Fees|Passport|Visa|Fines|Penalties|Registration Fees|Administrative Fees"),
    definition("banking-fees", "Banking & Fees", "expense", "🏦", "needs", "Bank Fees|ATM Fees|Transfer Fees|Foreign Exchange Fees|Service Charges|Late Fees|Card Fees|Annual Fees|Payment Processing Fees|Interest Charges"),
    definition("debt-loans", "Debt & Loans", "expense", "💳", "savings", "Credit Card Payment|Credit Card Interest|Personal Loan|Student Loan|Vehicle Loan|Mortgage|Buy Now Pay Later|Family Loan|Business Loan|Loan Interest|Debt Repayment|Other Financing"),
    definition("savings", "Savings", "expense", "💰", "savings", "General Savings|Emergency Fund|Travel Fund|House Fund|Vehicle Fund|Education Fund|Wedding Fund|Technology Fund|Retirement Fund|Short-Term Goal|Long-Term Goal"),
    definition("investments", "Investments", "expense", "📈", "savings", "Stocks|ETFs|Mutual Funds|Unit Trusts|Bonds|Fixed Deposits|Cryptocurrency|REITs|Retirement Investments|Brokerage Fees|Investment Fees|Investment Contributions"),
    definition("income", "Income", "income", "💵", null, "Salary|Wages|Internship Income|Freelance|Contract Work|Side Hustle|Business Income|Sales|Commission|Bonus|Overtime|Tips|Allowance|Stipend|Scholarship|Grant|Award / Prize|Gift Received|Refund|Reimbursement|Cashback|Rental Income|Dividend Income|Interest Income|Capital Gains|Royalties|Affiliate Income|Marketplace Sales|Selling Used Items|Other Income"),
    definition("transfers-internal", "Transfers & Internal Money Movement", "both", "↔️", null, "Account Transfer|Savings Transfer|Credit Card Payment|Cash Withdrawal|Cash Deposit|Wallet Top-Up|E-Wallet Withdrawal|Investment Account Transfer"),
    definition("other", "Other", "both", "📦", "unassigned", "Miscellaneous Expense|Miscellaneous Income|Uncategorized|One-Off Expense|Unknown / Imported Category"),
];

const slug = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const preservedIds = {
    "food-dining|Restaurants":"food", "food-dining|Groceries":"groceries", "transport|Public Transport":"transport",
    "transport|Fuel / Petrol":"fuel", "transport|Parking":"parking-tolls", "transport|Vehicle Maintenance":"vehicle",
    "housing-home|Rent":"housing", "utilities|Other Utilities":"utilities", "utilities|Internet":"phone-internet",
    "shopping|General Shopping":"shopping", "entertainment-leisure|Recreation":"entertainment", "entertainment-leisure|Outings":"outings",
    "subscriptions-memberships|Other Recurring Services":"subscriptions", "fitness-wellness|Fitness Membership":"fitness",
    "travel|Travel Transport":"travel", "health-medical|Doctor / Clinic":"healthcare", "insurance|Other Insurance":"insurance",
    "education|Courses":"education", "work-professional|Work Equipment":"work", "business|Miscellaneous Operating Expenses":"business-expense",
    "technology|Software":"technology", "family|Family Support":"family", "pets|Pet Supplies":"pets",
    "gifts-donations|Donations":"gifts-donations", "debt-loans|Debt Repayment":"debt-loans", "investments|Investment Contributions":"investments",
    "savings|General Savings":"savings", "income|Salary":"salary", "income|Freelance":"freelance", "income|Business Income":"business-income",
    "income|Bonus":"bonus", "income|Refund":"refund", "income|Dividend Income":"investment-income", "income|Rental Income":"rental-income",
    "income|Allowance":"allowance", "income|Other Income":"other-income", "other|Uncategorized":"other",
};
const keywordOverrides = {
    food:["restaurant","cafe","coffee","lunch","dinner","breakfast","takeaway","delivery","eating out","food"], groceries:["supermarket","grocery","groceries","market","food shopping","household food"], transport:["grab","taxi","bus","train","lrt","mrt","public transport","commute","transportation"],
    fuel:["petrol","gasoline","diesel","fuel station"], "parking-tolls":["parking","toll","touch n go","highway"],
    vehicle:["car","motorcycle","motorbike","maintenance","service","repair","tyre","tire","road tax"], housing:["rent","rental","mortgage","housing","home"],
    utilities:["electricity","electric","water","gas","utility","utilities","power"], "phone-internet":["phone","mobile","internet","wifi","broadband","data plan","telco"],
    shopping:["clothes","clothing","fashion","electronics","online shopping","purchase"], entertainment:["movie","cinema","gaming","games","concert","hobby","hobbies","entertainment"],
    subscriptions:["netflix","spotify","youtube","disney","subscription","membership","software subscription"], fitness:["gym","fitness","sport","sports","workout","exercise"],
    travel:["flight","hotel","holiday","vacation","trip","travel","airbnb","hostel"], healthcare:["doctor","clinic","hospital","medical","medicine","pharmacy","dental","dentist","healthcare","health"],
    insurance:["insurance","health insurance","life insurance","car insurance","premium"], education:["university","college","school","tuition","course","courses","textbook","books","education","study"],
    work:["work","office","professional","equipment","work expense","business trip"], "business-expense":["business","company","client","supplies","business expense","operating expense"],
    technology:["software","app","apps","hosting","domain","cloud","computer","laptop","technology","saas"], family:["family","parents","children","child","kids","childcare"],
    pets:["pet","pets","dog","cat","vet","veterinary","pet food","grooming"], "gifts-donations":["gift","gifts","birthday","present","donation","charity"],
    "debt-loans":["loan","loans","debt","repayment","credit card","financing"], investments:["investment","investing","stocks","shares","crypto","cryptocurrency","etf","fund"],
    savings:["saving","savings","emergency fund","save money"], salary:["salary","paycheck","pay","wages","employment"], freelance:["freelance","freelancing","contract","contractor","gig","side job"],
    "business-income":["business","revenue","sales","company income"], bonus:["bonus","incentive","commission"], refund:["refund","reimbursement","cashback","returned money"],
    "investment-income":["dividend","dividends","interest","investment income","capital gains"], "rental-income":["rental income","rent received","tenant","property income"], allowance:["allowance","pocket money","stipend"],
    outings:["outing","hangout","day out","social","friends","gathering","meetup"],
};
const iconOverrides = {
    food:"🍔", groceries:"🛒", transport:"🚗", fuel:"⛽", "parking-tolls":"🅿️", vehicle:"🚘", housing:"🏠", utilities:"💡", "phone-internet":"📱",
    shopping:"🛍️", entertainment:"🎮", outings:"🌆", subscriptions:"📺", fitness:"💪", travel:"✈️", healthcare:"🏥", insurance:"🛡️", education:"🎓",
    work:"💼", "business-expense":"🏢", technology:"💻", family:"👨‍👩‍👧", pets:"🐶", "gifts-donations":"🎁", "debt-loans":"💳", investments:"📈", savings:"💰",
    salary:"💵", freelance:"💼", "business-income":"🏢", bonus:"🎁", refund:"↩️", "investment-income":"📈", "rental-income":"🏠", allowance:"💰", "other-income":"💵", other:"📦",
};

export const mainCategories = definitions.map(main => Object.freeze({ id:main.id, name:main.name, type:main.type, icon:main.icon, budgetGroup:main.budgetGroup }));
export const categories = definitions.flatMap(main => main.values.map(name => {
    const id = preservedIds[`${main.id}|${name}`] || `${main.id}-${slug(name)}`;
    return Object.freeze({ id, name, subcategory: name, mainCategoryId: main.id, mainCategory: main.name, type: main.type, icon: iconOverrides[id] || main.icon,
        keywords: [...new Set([name.toLowerCase(), ...name.toLowerCase().split(/\s+|\s*\/\s*/), ...(keywordOverrides[id] || [])])], budgetGroup: main.budgetGroup,
        systemOnly: main.id === "transfers-internal" });
})).concat(Object.freeze({ id:"contribution", name:"Contribution", subcategory:"Contribution", mainCategoryId:"savings", mainCategory:"Savings", type:"expense", icon:"🎯", keywords:["contribution","savings contribution","goal contribution","allocation"], budgetGroup:"savings", systemOnly:true }));

const legacyAliases = Object.freeze({
    bills:"utilities", rent:"housing", "food & dining":"food", food:"food", transport:"transport", shopping:"shopping", work:"work",
    salary:"salary", other:"other", entertainment:"entertainment", vehicle:"vehicle", healthcare:"healthcare", "phone & internet":"phone-internet",
});

export const normalizeTag = tag => typeof tag === "string" && tag.trim() ? tag.trim() : "other";
export const getMainCategoryById = id => mainCategories.find(main => main.id === id);
const applyBuiltInOverride = (category, overrides = {}) => { const override=overrides[category.id];return override?{...category,defaultName:category.name,name:override.customName||category.name,hidden:override.hidden===true}:category; };
export const getAllCategories = (customCategories = [], overrides = {}) => [...categories.map(category => applyBuiltInOverride(category, overrides)), ...customCategories];
export const getActiveCategories = (customCategories = [], overrides = {}) => getAllCategories(customCategories, overrides).filter(category => !category.archived && !category.hidden);
export const getCategoryById = (id, customCategories = [], overrides = {}) => getAllCategories(customCategories, overrides).find(category => category.id === id);
export const getCategoryByName = (name, customCategories = [], mainCategoryId, overrides = {}) => { const key=String(name).trim().toLowerCase();return [...customCategories,...categories.map(category=>applyBuiltInOverride(category,overrides))].find(category => (!mainCategoryId || (category.mainCategoryId || "other") === mainCategoryId) && (category.name.toLowerCase()===key||category.defaultName?.toLowerCase()===key)); };
export const getCategoryForTag = (tag, customCategories = [], overrides = {}) => {
    const value = normalizeTag(tag), key = value.toLowerCase();
    return getCategoryById(value, customCategories, overrides) || getCategoryById(key, customCategories, overrides) || getCategoryByName(value, customCategories, undefined, overrides) || getCategoryById(legacyAliases[key], customCategories, overrides);
};
export const getMainCategoryForTag = (tag, customCategories = [], overrides = {}) => getMainCategoryById(getCategoryForTag(tag, customCategories, overrides)?.mainCategoryId) || getMainCategoryById("other");
export const getCategoryDisplay = (tag, customCategories = [], overrides = {}) => {
    if (String(tag).startsWith("main:")) { const main=getMainCategoryById(String(tag).slice(5));return main?`${main.icon} ${main.name}`:normalizeTag(tag); }
    const category = getCategoryForTag(tag, customCategories, overrides);
    return category ? `${category.icon} ${category.name}${category.archived ? " (Archived)" : ""}` : normalizeTag(tag);
};
export const getCategoryName = (tag, customCategories = [], overrides = {}) => {
    if (String(tag).startsWith("main:")) return getMainCategoryById(String(tag).slice(5))?.name || normalizeTag(tag);
    const category = getCategoryForTag(tag, customCategories, overrides);
    return category ? `${category.name}${category.archived ? " (Archived)" : ""}` : normalizeTag(tag);
};
export const getCategoryPathDisplay = (tag, customCategories = [], overrides = {}) => { const category=getCategoryForTag(tag,customCategories,overrides);return category?`${category.mainCategory} › ${category.name}`:normalizeTag(tag); };
export const isCategoryCompatible = (category, type) => category && (category.type === type || category.type === "both");
export const getMainCategoriesForType = type => mainCategories.filter(main => main.id !== "transfers-internal" && (type === "both" || main.type === type || main.type === "both"));
export const getCategoriesForType = (type, customCategories = [], includeIds = [], mainCategoryId, overrides = {}) => getAllCategories(customCategories, overrides)
    .filter(category => isCategoryCompatible(category, type) && (!mainCategoryId || category.mainCategoryId === mainCategoryId)
        && (!category.systemOnly || includeIds.includes(category.id)) && (!category.archived || includeIds.includes(category.id)) && (!category.hidden || includeIds.includes(category.id)));
export const searchCategories = (query, type, extraTags = [], customCategories = [], includeIds = [], mainCategoryId, overrides = {}) => {
    const search = String(query).trim().toLowerCase();
    const extraCategories = extraTags.filter(tag => !getCategoryForTag(tag, customCategories, overrides)).map(tag => ({ id:tag, name:tag, type, icon:"", keywords:[], mainCategoryId:"other", mainCategory:"Other" }));
    return [...getCategoriesForType(type, customCategories, includeIds, mainCategoryId, overrides), ...extraCategories.filter(category => !mainCategoryId || category.mainCategoryId === mainCategoryId)]
        .filter(category => !search || category.name.toLowerCase().includes(search) || category.defaultName?.toLowerCase().includes(search) || category.keywords.some(keyword => keyword.includes(search)));
};
export const isCustomCategory = id => typeof id === "string" && id.startsWith("custom-");
const referencesCategory = (tag, id, customCategories) => tag === id || getCategoryForTag(tag, customCategories)?.id === id;

export const getCategoryReferenceCounts = (id, {
    transactions = [], recurringRules = [], budgets = {}, plannerSettings = {}, customCategories = [],
} = {}) => {
    const counts = {
        transactions: transactions.filter(item => referencesCategory(item.tag, id, customCategories)).length,
        recurringRules: recurringRules.filter(item => referencesCategory(item.tag, id, customCategories)).length,
        budgets: Object.values(budgets).filter(budget => Object.keys(budget?.categories || {}).some(tag => referencesCategory(tag, id, customCategories))).length,
        plannerOverrides: Object.keys(plannerSettings?.categoryOverrides || {}).filter(tag => referencesCategory(tag, id, customCategories)).length,
    };
    return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
};

export const categoryHasReferences = (id, transactions = [], recurringRules = [], budgets = {}, plannerSettings = {}, customCategories = []) =>
    getCategoryReferenceCounts(id, { transactions, recurringRules, budgets, plannerSettings, customCategories }).total > 0;
