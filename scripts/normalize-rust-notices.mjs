import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const target = path.resolve(
  process.argv[2] ?? "THIRD_PARTY_RUST_LICENSES.html",
);
if (!existsSync(target)) {
  throw new Error(`Rust dependency notice report does not exist: ${target}`);
}

const original = readFileSync(target, "utf8");
for (const marker of [
  "Token Pass Swith Rust dependency licenses",
  "<section>",
  "Used by:",
]) {
  if (!original.includes(marker)) {
    throw new Error(`Rust dependency notice report is missing: ${marker}`);
  }
}

const normalized = original
  .replace(/\r\n?/gu, "\n")
  .replace(/[ \t]+$/gmu, "")
  .replace(/\n*$/u, "\n");

if (normalized !== original) {
  writeFileSync(target, normalized, "utf8");
}

console.log(`Normalized Rust dependency notices: ${target}`);
