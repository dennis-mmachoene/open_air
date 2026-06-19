import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSnapshot } from "../lib/palettes/library";

const snapshot = buildSnapshot();
const out = join(process.cwd(), "lib", "palettes", "snapshot.json");
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  `Wrote ${snapshot.count} palettes across ${snapshot.collections.length} collections to ${out}`,
);
