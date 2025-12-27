export type InvoiceFields = {
  invoiceNumber?: string;
  invoiceDate?: string;
  vendorName?: string;
  total?: number;
  tax?: number;
};

export type LineItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

export type Invoice = {
  invoiceId: string;
  vendor: string;
  fields: Record<string, any>;
  confidence: number;
  rawText: string;
};


export interface InvoiceResult {
  normalizedInvoice: Invoice;
  proposedCorrections: any[];
  requiresHumanReview: boolean;
  reasoning: string;
  confidenceScore: number;
  memoryUpdates: string[];
  auditTrail: { step: string; timestamp: string; details: string }[];
}


export interface NormalizedInvoice {
  invoiceId: string;
  vendor: string;
  fields: Invoice["fields"];
  confidence: number;
  rawText?: string;
}

export interface Correction {
  invoiceId: string;
  field: string;
  value: any;
}


export interface ProcessedInvoice {
  normalizedInvoice: Invoice;
  proposedCorrections: any[];
  requiresHumanReview: boolean;
  reasoning: string;
  confidenceScore: number;
  memoryUpdates: string[];
  auditTrail: { step: string; timestamp: string; details: string }[];
}


export interface VendorMemoryEntry {
  field: string;
  value: any;
  pattern?: string; // regex string of what triggered this memory
}


export type HumanCorrection = {
  field: string;
  from: any;
  to: any;
  reason: string;
};

export type HumanCorrectionEntry = {
  invoiceId: string;
  vendor: string;
  corrections: HumanCorrection[];
  finalDecision: "approved" | "rejected";
};

export type VendorMemory = {
  vendor: string;
  targetField: string;
  confidence: number;
  usageCount: number;
  lastValue: any;
};

export type AuditStep = {
  step: "recall" | "apply" | "decide" | "learn";
  timestamp: string;
  details: string;
};

export type ProcessResult = {
  normalizedInvoice: Invoice;
  proposedCorrections: string[];
  requiresHumanReview: boolean;
  reasoning: string;
  confidenceScore: number;
  memoryUpdates: string[];
  auditTrail: AuditStep[];
};
