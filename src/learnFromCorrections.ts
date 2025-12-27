import { Invoice, VendorMemory, HumanCorrectionEntry } from "./types";
import { loadMemory, saveMemory } from "./memoryStore";

export function learnFromCorrections(
  invoice: Invoice,
  human: HumanCorrectionEntry
): string[] {
  const updates: string[] = [];
  const memory = loadMemory();

  for (const corr of human.corrections) {
    let existing = memory.vendorMemory.find(
      m =>
        m.vendor === invoice.vendor &&
        m.targetField === corr.field
    );

    if (existing) {
      existing.usageCount += 1;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.lastValue = corr.to;
    } else {
      const mem: VendorMemory = {
        vendor: invoice.vendor,
        targetField: corr.field,
        confidence: 0.7,
        usageCount: 1,
        lastValue: corr.to
      };
      memory.vendorMemory.push(mem);
    }

    updates.push(
      `Learned '${corr.field}' from human correction: ${corr.from} → ${corr.to}`
    );
  }

  saveMemory(memory);
  return updates;
}
