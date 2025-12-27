export function setByPath(obj: any, path: string, value: any) {
    const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let curr = obj;
  
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!(key in curr)) {
        curr[key] = isNaN(Number(parts[i + 1])) ? {} : [];
      }
      curr = curr[key];
    }
  
    curr[parts[parts.length - 1]] = value;
  }
  