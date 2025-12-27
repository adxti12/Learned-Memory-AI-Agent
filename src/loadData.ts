import fs from "fs";

export function loadJSON<T>(path: string): T {
  const raw = fs.readFileSync(path, "utf-8");
  return JSON.parse(raw);
}
