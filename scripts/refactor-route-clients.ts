// One-shot refactor: move module-level `const supabase[X] = createClient(...)`
// calls inside each exported route handler. Idempotent — running again on an
// already-refactored file is a no-op.
//
// Run: npx ts-node scripts/refactor-route-clients.ts

import * as fs from "fs";
import * as path from "path";

const ROUTES_DIR = path.join(process.cwd(), "app", "api");

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && p.endsWith("route.ts")) yield p;
  }
}

const moduleClientRe =
  /^(const\s+supabase\w*\s*=\s*createClient\([^)]*\)\s*;?\s*\n)/gm;

const handlerStartRe =
  /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{\s*\n/g;

let touched = 0;

for (const file of walk(ROUTES_DIR)) {
  const orig = fs.readFileSync(file, "utf8");
  // Find module-level client declarations
  const clientLines: string[] = [];
  let stripped = orig;
  let m: RegExpExecArray | null;

  // Reset regex state
  moduleClientRe.lastIndex = 0;
  while ((m = moduleClientRe.exec(orig)) !== null) {
    clientLines.push(m[1].trim());
  }
  if (clientLines.length === 0) continue;

  // Remove the module-level lines
  stripped = orig.replace(moduleClientRe, "");

  // Insert into each handler
  handlerStartRe.lastIndex = 0;
  const indent = "  ";
  const injection =
    "\n" + clientLines.map((l) => indent + l).join("\n") + "\n";

  const next = stripped.replace(
    handlerStartRe,
    (match) => match + injection.trimStart() + "\n"
  );

  if (next !== orig) {
    fs.writeFileSync(file, next);
    console.log(`✔ refactored ${path.relative(process.cwd(), file)}`);
    touched++;
  }
}

console.log(`\n${touched} file(s) refactored.`);
