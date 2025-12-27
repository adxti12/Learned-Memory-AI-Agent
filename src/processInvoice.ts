import { recallMemory } from "./recallMemory";
import { updateMemory } from "./memory";
import { Invoice } from "./types";

// ------------------------------
// Fields that must NEVER be recalled from memory
// ------------------------------
const NON_RECALLABLE_FIELDS = new Set([
  "netTotal",
  "taxTotal",
  "grossTotal",
  "lineItems"
]);

// ------------------------------
// Helper: Set nested field
// ------------------------------
function setNestedField(obj: any, path: string, value: any) {
  const parts = path.split(/[\.\[\]]/).filter(Boolean);
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = isNaN(Number(parts[parts.length - 1]))
    ? parts[parts.length - 1]
    : Number(parts[parts.length - 1]);

  current[lastKey] = value;
}

// ------------------------------
function isDuplicate(rawText?: string): boolean {
  return !!rawText?.toLowerCase().includes("duplicate submission");
}

function isVatInclusive(rawText?: string): boolean {
  return !!rawText?.toLowerCase().includes("mwst");
}

// ------------------------------
// Main
// ------------------------------
export function processInvoice(invoice: Invoice, humanCorrections: any[]) {
  const auditTrail: any[] = [];
  const memoryUpdates: string[] = [];

  // ------------------------------
  // Duplicate
  // ------------------------------
  if (isDuplicate(invoice.rawText)) {
    return {
      normalizedInvoice: invoice,
      proposedCorrections: [],
      requiresHumanReview: true,
      reasoning: "Duplicate invoice detected",
      confidenceScore: invoice.confidence * 0.6,
      memoryUpdates: [],
      auditTrail: [
        {
          step: "duplicate",
          timestamp: new Date().toISOString(),
          details: "Duplicate submission detected"
        }
      ]
    };
  }

  // ------------------------------
  // Recall memory (SAFE)
  // ------------------------------
  const vendorMemory = recallMemory(invoice.vendor);

  for (const field of Object.keys(vendorMemory)) {
    if (NON_RECALLABLE_FIELDS.has(field)) continue;

    setNestedField(invoice.fields, field, vendorMemory[field]);

    auditTrail.push({
      step: "recall",
      timestamp: new Date().toISOString(),
      details: `Applied memory for ${field}`
    });
  }

  // ------------------------------
  // Apply human corrections
  // ------------------------------
  for (const { field, to } of humanCorrections) {
    setNestedField(invoice.fields, field, to);
    updateMemory(invoice.vendor, field, to);

    memoryUpdates.push(`Learned '${field}' from human correction`);
  }

  // ------------------------------
  // VAT-inclusive correction (ONLY MwSt)
  // ------------------------------
  if (
    isVatInclusive(invoice.rawText) &&
    invoice.fields.netTotal != null &&
    invoice.fields.taxRate != null
  ) {
    const net = invoice.fields.netTotal;
    const tax = Number((net * invoice.fields.taxRate).toFixed(2));
    const gross = Number((net + tax).toFixed(2));

    invoice.fields.taxTotal = tax;
    invoice.fields.grossTotal = gross;
    auditTrail.push({
        step: "vat",
        timestamp: new Date().toISOString(),
        details: "MwSt detected → recalculated VAT-inclusive totals"
      });
    }

  // ------------------------------
  // Compute missing totals
  // ------------------------------
  if (
    invoice.fields.netTotal != null &&
    invoice.fields.taxRate != null &&
    invoice.fields.taxTotal == null
  ) {
    invoice.fields.taxTotal = Number(
      (invoice.fields.netTotal * invoice.fields.taxRate).toFixed(2)
    );
  }

  if (
    invoice.fields.netTotal != null &&
    invoice.fields.taxTotal != null &&
    invoice.fields.grossTotal == null
  ) {
    invoice.fields.grossTotal = Number(
      (invoice.fields.netTotal + invoice.fields.taxTotal).toFixed(2)
    );
  }

  return {
    normalizedInvoice: invoice,
    proposedCorrections: [],
    requiresHumanReview: false,
    reasoning: memoryUpdates.length ? "Memory applied" : "No changes needed",
    confidenceScore: Math.min(invoice.confidence + 0.02, 1),
    memoryUpdates,
    auditTrail
  };
}
