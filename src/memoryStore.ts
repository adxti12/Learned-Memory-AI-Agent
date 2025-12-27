import fs from "fs";
import { VendorMemory } from "./types";

const FILE = "./memory.json";

export function loadMemory(): { vendorMemory: VendorMemory[] } {
  if (!fs.existsSync(FILE)) {
    return { vendorMemory: [] };
  }
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function saveMemory(mem: { vendorMemory: VendorMemory[] }) {
  fs.writeFileSync(FILE, JSON.stringify(mem, null, 2));
}
