BOOKFAIR DIGITAL — FULL ADMIN UPDATE

REPLACE THESE EXACT FILES IN YOUR GITHUB REPOSITORY ROOT:

1. admin.html
2. admin.js
3. firebase.js
4. index.html

This update includes:
- Online Orders
- Order details
- Bank slip View Slip
- Total Orders
- Pending Orders
- Today Revenue
- This Month Revenue
- Total Revenue
- Payment status updates
- Student Management
- Excel import/export
- Book management

Firestore collection expected:
orders/{orderNumber}

Firebase Storage path expected:
order-slips/{orderNumber}-{filename}

Revenue counts only Paid and Completed orders.

IMPORTANT:
The updated index.html is required for new website orders to be written to Firestore.
The updated firebase.js exports Firebase Storage support.
Make sure Firestore/Storage rules allow the intended admin/store operations before production use.
