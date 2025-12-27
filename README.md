# Invoice Memory System
A vendor-aware invoice processing system that learns from human corrections and past invoices to improve normalization accuracy over time.

<img width="562" height="718" alt="image" src="https://github.com/user-attachments/assets/6ea7bd3c-c77f-45b5-bcfd-590d50911ff9" />

# What It Does

Normalizes invoice fields
Applies vendor-specific memory
Detects VAT-inclusive pricing using raw text (e.g. MwSt. inkl.)
Flags duplicate invoices safely
Records all decisions in an audit trail

# Files

index.ts
Entry point. Loads invoices, applies corrections, prints results.

processInvoice.ts
Core logic: memory recall, VAT handling, duplicate detection, corrections, audit trail.

memory.ts
Stores and updates vendor-specific learned data.

recallMemory.ts
Fetches stored memory for a vendor.

types.ts
Shared invoice and line-item type definitions.
