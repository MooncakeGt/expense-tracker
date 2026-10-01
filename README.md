# Expense Tracker

A browser-based personal finance tracker built with Next.js. It provides tools for recording transactions, organizing spending, managing accounts and savings goals, planning budgets, and reviewing financial trends.

## Live Demo

https://mooncakegt.github.io/expense-tracker/

## Features

- Monthly and yearly dashboard summaries with financial charts
- Account management, available balance tracking, and transfers between accounts
- Monthly and yearly transaction history views
- Transaction search, filters, and sorting
- Main categories and subcategories
- User-created custom categories
- Built-in category renaming, hiding, and icon customization
- Image uploads for category icons
- Recurring transactions and recurring transfers
- Savings goals and savings contributions
- Finance calendar view
- Overall and category-based monthly budgets
- 50/30/20 budget planner
- Cash-flow and savings goal forecasting
- CSV import and export
- Full JSON backup and restore
- Browser LocalStorage persistence
- Malaysian Ringgit (MYR) currency formatting
- Static deployment to GitHub Pages

## Tech Stack

- Next.js 16
- React 19
- JavaScript
- Bootstrap 5
- Chart.js
- react-chartjs-2
- PapaParse
- Zod
- LocalStorage API

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm test
npm run lint
npm run build
```

The production build creates a static export suitable for GitHub Pages.

## Deployment

Pushes to the `main` branch deploy the application to GitHub Pages through the existing GitHub Actions workflow in `.github/workflows/deploy.yml`.

## Data & Privacy

Financial data is stored locally in the browser and is not sent to a backend or automatically synchronized across devices. Export a full JSON backup before clearing browser data, resetting the application, or moving to another browser or device.
