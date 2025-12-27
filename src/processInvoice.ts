import { recallMemory } from "./recallMemory";
import { updateMemory } from "./memory";
import { Invoice } from "./types";

// ------------------------------
// Helper: Set nested field given a path like "lineItems[0].sku"
// ------------------------------
function setNestedField(obj: any, path: string, value: any) {
  const parts = path.split(/[\.\[\]]/).filter(Boolean); // splits on '.' or '[' or ']'
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    const nextKey = isNaN(Number(parts[i + 1])) ? parts[i + 1] : Number(parts[i + 1]);

    if (current[key] === undefined) {
      current[key] = typeof nextKey === "number" ? [] : {}; // create array if next key is a number
    }

    current = current[key];
  }

  const lastKey = isNaN(Number(parts[parts.length - 1]))
    ? parts[parts.length - 1]
    : Number(parts[parts.length - 1]);

  current[lastKey] = value;
}

// ------------------------------
// Duplicate detection helper
// ------------------------------
function isDuplicate(rawText?: string): boolean {
  if (!rawText) return false;
  return rawText.toLowerCase().includes("duplicate submission");
}

// ------------------------------
// VAT-inclusive detection helper
// ------------------------------
function isVatInclusive(rawText?: string): boolean {
  if (!rawText) return false;

  const text = rawText.toLowerCase();
  return (
    text.includes("MwSt.")
    
  );
}

// ------------------------------
// Main processing function
// ------------------------------
export function processInvoice(invoice: Invoice, humanCorrections: any[]) {
  const auditTrail: any[] = [];
  const memoryUpdates: string[] = [];

  // ------------------------------
  // Duplicate check
  // ------------------------------
  if (isDuplicate(invoice.rawText)) {
    auditTrail.push({
      step: "duplicate",
      timestamp: new Date().toISOString(),
      details: "Duplicate submission detected from raw text"
    });

    return {
      normalizedInvoice: invoice,
      proposedCorrections: [],
      requiresHumanReview: true,
      reasoning: "Duplicate invoice detected",
      confidenceScore: invoice.confidence * 0.6,
      memoryUpdates: [],
      auditTrail
    };
  }

  // ------------------------------
  // Recall vendor memory
  // ------------------------------
  const vendorMemory = recallMemory(invoice.vendor);
  for (const field of Object.keys(vendorMemory)) {
    setNestedField(invoice.fields, field, vendorMemory[field]);

    auditTrail.push({
      step: "recall",
      timestamp: new Date().toISOString(),
      details: `Overrode ${field} using memory value ${vendorMemory[field]}`
    });
  }

  // ------------------------------
  // Apply human corrections
  // ------------------------------
  for (const correction of humanCorrections) {
    const { field, to } = correction;

    let previousValue: any = null;
    try {
      const parts = field.split(/[\.\[\]]/).filter(Boolean);
      previousValue = parts.reduce((acc: any, p: string | number) => {
        const key = isNaN(Number(p)) ? p : Number(p);
        return acc && acc[key];
      }, invoice.fields);
    } catch {}

    setNestedField(invoice.fields, field, to);

    updateMemory(invoice.vendor, field, to);

    memoryUpdates.push(`Learned '${field}' from human correction: ${previousValue} → ${to}`);

    auditTrail.push({
      step: "apply",
      timestamp: new Date().toISOString(),
      details: `Human corrected ${field}: ${previousValue} → ${to}`
    });
  }

  // ------------------------------
  // VAT-inclusive handling
  // ------------------------------
  const vatInclusive = isVatInclusive(invoice.rawText);

  if (vatInclusive && invoice.fields.grossTotal != null && invoice.fields.taxRate != null) {
    const gross = invoice.fields.grossTotal;
    const rate = invoice.fields.taxRate;

    const net = Number((gross / (1 + rate)).toFixed(2));
    const tax = Number((gross - net).toFixed(2));

    invoice.fields.netTotal = net;
    invoice.fields.taxTotal = tax;

    auditTrail.push({
      step: "vat",
      timestamp: new Date().toISOString(),
      details: "VAT-inclusive pricing detected → recomputed netTotal and taxTotal from grossTotal"
    });

    memoryUpdates.push("Learned vendor uses VAT-inclusive pricing");
  }

  // ------------------------------
  // Sanity tax calculation if missing
  // ------------------------------
  if (
    invoice.fields.netTotal != null &&
    invoice.fields.taxRate != null &&
    invoice.fields.taxTotal == null
  ) {
    invoice.fields.taxTotal = Number((invoice.fields.netTotal * invoice.fields.taxRate).toFixed(2));

    auditTrail.push({
      step: "calc",
      timestamp: new Date().toISOString(),
      details: "Computed taxTotal from netTotal and taxRate"
    });
  }

  if (
    invoice.fields.netTotal != null &&
    invoice.fields.taxTotal != null &&
    invoice.fields.grossTotal == null
  ) {
    invoice.fields.grossTotal = Number(
      (invoice.fields.netTotal + invoice.fields.taxTotal).toFixed(2)
    );

    auditTrail.push({
      step: "calc",
      timestamp: new Date().toISOString(),
      details: "Computed grossTotal from netTotal and taxTotal"
    });
  }

  // ------------------------------
  // Decision
  // ------------------------------
  auditTrail.push({
    step: "decide",
    timestamp: new Date().toISOString(),
    details: memoryUpdates.length > 0 ? "Memory applied" : "No memory changes"
  });

  return {
    normalizedInvoice: invoice,
    proposedCorrections: [],
    requiresHumanReview: false,
    reasoning: memoryUpdates.length > 0 ? "Memory applied" : "No changes needed",
    confidenceScore: Math.min(invoice.confidence + 0.02, 1),
    memoryUpdates,
    auditTrail
  };
}
