import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import process from "node:process";
import prettier from "prettier";

const allowedLicenses = new Set([
  "0BSD",
  "Apache-2.0",
  "Apache-2.0 OR MIT",
  "BSD-3-Clause",
  "ISC",
  "MIT",
  "MIT AND ISC",
  "MIT OR Apache-2.0",
]);

const pnpmArgs = ["licenses", "list", "--prod", "--json"];
const command = process.env.npm_execpath
  ? [process.execPath, [process.env.npm_execpath, ...pnpmArgs]]
  : process.platform === "win32"
    ? [
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", `pnpm.cmd ${pnpmArgs.join(" ")}`],
      ]
    : ["pnpm", pnpmArgs];
const output = execFileSync(command[0], command[1], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});
const report = JSON.parse(output);
const detectedLicenses = Object.keys(report).sort();
const rejectedLicenses = detectedLicenses.filter(
  (license) => !allowedLicenses.has(license),
);

if (rejectedLicenses.length > 0) {
  console.error(
    `Unreviewed npm production licenses: ${rejectedLicenses.join(", ")}`,
  );
  process.exit(1);
}

const packageCount = Object.values(report).reduce(
  (total, packages) => total + packages.length,
  0,
);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stableMetadata(value) {
  if (Array.isArray(value)) {
    return value
      .map(stableMetadata)
      .sort((left, right) =>
        compareText(JSON.stringify(left), JSON.stringify(right)),
      );
  }
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "paths")
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, nestedValue]) => [key, stableMetadata(nestedValue)]),
  );
}

const portableReport = Object.fromEntries(
  detectedLicenses.map((license) => [
    license,
    report[license]
      .map(stableMetadata)
      .sort((left, right) =>
        compareText(
          `${left.name ?? ""}\0${JSON.stringify(left)}`,
          `${right.name ?? ""}\0${JSON.stringify(right)}`,
        ),
      ),
  ]),
);
const outputIndex = process.argv.indexOf("--output");
if (outputIndex !== -1) {
  const outputPath = process.argv[outputIndex + 1];
  if (!outputPath) throw new Error("--output requires a file path");
  const formattedReport = await prettier.format(
    JSON.stringify(portableReport),
    {
      parser: "json",
    },
  );
  writeFileSync(outputPath, formattedReport, "utf8");
}

console.log(
  `Reviewed ${packageCount} npm production packages across ${detectedLicenses.length} license expressions.`,
);
