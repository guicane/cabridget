# Domain Model Glossary

- **Month**: A specific calendar month (e.g., "June 2026") that groups bills, income, and investment snapshots.
- **Investment**: An asset or account whose value is tracked over time. This broadly includes savings accounts, pensions, current accounts, and traditional investments.
- **Investment Value**: The latest manual entry of an investment's worth on the last day of the month.
- **Income**: A manually entered record of money received during a specific month, which includes a source (e.g. "Salary", "Bonus") and amount. A month can have multiple distinct income entries.
- **Recurring Bill**: A template for a bill that is expected every month (e.g., Rent, Netflix).
- **Monthly Bill**: A concrete instance of a bill for a specific month, generated from a Recurring Bill template.
- **Credit Card**: A credit account (e.g., "Amex") that is paid in full each month.
- **Credit Card Statement**: The manually entered balance of a Credit Card for a specific month.
- **Complete Month**: A derived state where a month is considered complete once every active Investment has an Investment Value, AND every active Credit Card has a Credit Card Statement entered for that month.
- **Cash Flow**: A derived calculation for a month: `Total Income` - `Total Monthly Bills` - `Total Credit Card Statements`.
- **Net Worth**: A derived calculation for a month: `Total Investment Values` - `Total Credit Card Statements`.
*(Note: The generic 'LedgerEntry' concept has been removed in favor of explicit Income, Monthly Bill, and Credit Card Statement models)*
