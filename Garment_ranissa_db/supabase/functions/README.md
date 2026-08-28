# Garment Ranissa ERP - PostgreSQL Functions

This directory contains all PostgreSQL functions used by the ERP backend.

The SQL code is organized into logical layers to improve maintainability, scalability, and transactional integrity.

---

## Folder Structure

```
functions/

utility/
inventory/
production/
costing/
accounting/

transactions/

workflows/
```

---

# Utility

Reusable helper functions.

Examples

- generate_document_number()
- round_currency()
- get_financial_year()
- validate_company()

These functions should never modify business documents.

---

# Inventory

Inventory related reusable functions.

Examples

- inventory_in()
- inventory_out()
- get_available_stock()
- get_stock_balance()

These functions operate only on inventory.

---

# Production

Production specific reusable functions.

Examples

- consume_raw_material()
- produce_finished_goods()
- calculate_machine_cost()

---

# Costing

Cost calculation functions.

Examples

- calculate_bom_cost()
- calculate_average_cost()
- calculate_operation_cost()

---

# Accounting

Accounting helper functions.

Examples

- create_journal()
- create_journal_line()
- post_journal()

---

# Transactions

Contains complete ERP business transactions.

A transaction function is responsible for executing an entire business process inside a single PostgreSQL transaction.

Examples

- process_goods_receipt()
- process_delivery_note()
- process_purchase_invoice()
- process_sales_invoice()
- process_stock_transfer()

A transaction function may call multiple utility functions internally.

Application code should always call transaction functions instead of performing multiple SQL operations.

---

# Workflows

Workflow functions perform document state transitions.

Examples

- approve_purchase_order()
- approve_sales_order()
- approve_production_order()
- close_production_order()
- cancel_purchase_order()

Workflow functions do not perform business calculations.

---

# Development Rules

1. Edge Functions must never execute multi-step business transactions.

2. Business transactions belong inside the transactions folder.

3. Utility functions should be reusable and independent.

4. Every business transaction must be atomic.

5. Never update inventory directly from an Edge Function.

6. Never create accounting entries directly from an Edge Function.

7. Edge Functions should call exactly one transaction function whenever possible.

8. Every transaction should either COMMIT completely or ROLLBACK completely.

---

# Architecture

Frontend

↓

Edge Function

↓

Transaction Function

↓

Utility Functions

↓

Database

This architecture ensures transactional integrity and keeps business logic centralized inside PostgreSQL.
