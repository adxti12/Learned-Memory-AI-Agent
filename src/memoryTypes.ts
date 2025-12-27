export interface VendorMemory {
    vendor: string;
    sourceLabel: string;   // e.g. "Leistungsdatum"
    targetField: string;   // e.g. "serviceDate"
    confidence: number;
    usageCount: number;
  }
  