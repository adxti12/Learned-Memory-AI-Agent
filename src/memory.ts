import fs from "fs";
import path from "path";

type VendorMemory = {
  [vendor: string]: {
    [fieldPath: string]: any;
  };
};

const MEMORY_PATH = path.join(__dirname, "vendorMemory.json");

let vendorMemory: VendorMemory = {};

// ------------------------------
// Load memory from disk
// ------------------------------
export function loadMemory() {
  if (fs.existsSync(MEMORY_PATH)) {
    vendorMemory = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf-8"));
  } else {
    vendorMemory = {};
  }
}

// ------------------------------
// Save memory to disk
// ------------------------------
export function saveMemory() {
  fs.writeFileSync(
    MEMORY_PATH,
    JSON.stringify(vendorMemory, null, 2)
  );
}

// ------------------------------
// Recall memory for vendor
// ------------------------------
export function recallMemory(vendor: string) {
  return vendorMemory[vendor] || {};
}

// ------------------------------
// Update memory
// ------------------------------
export function updateMemory(
  vendor: string,
  fieldPath: string,
  value: any
) {
  if (!vendorMemory[vendor]) {
    vendorMemory[vendor] = {};
  }
  vendorMemory[vendor][fieldPath] = value;
}
