import fs from "fs";
import path from "path";

import { processInvoice } from "./processInvoice";
import { loadMemory, saveMemory } from "./memory";
import { Invoice } from "./types";

// ------------------------------
// Load persistent memory
// ------------------------------
loadMemory();

// ------------------------------
// Load extracted invoices
// ------------------------------
const invoicesPath = path.join(
  __dirname,
  "../data/invoices_extracted_full.json"
);

const invoices: Invoice[] = JSON.parse(
  fs.readFileSync(invoicesPath, "utf-8")
);

// ------------------------------
// Load human corrections
// ------------------------------
const correctionsPath = path.join(
  __dirname,
  "../data/human_corrections_full.json"
);

const humanCorrections = JSON.parse(
  fs.readFileSync(correctionsPath, "utf-8")
);

// ------------------------------
// Process invoices sequentially
// ------------------------------
for (const invoice of invoices) {
  const correctionsForInvoice =
    humanCorrections.find(
      (h: any) => h.invoiceId === invoice.invoiceId
    )?.corrections ?? [];

  const result = processInvoice(invoice, correctionsForInvoice);

  console.log("\n===============================");
  console.log("Processed:", invoice.invoiceId);
  console.log(JSON.stringify(result, null, 2));
}

// ------------------------------
// Persist memory after run
// ------------------------------
saveMemory();
