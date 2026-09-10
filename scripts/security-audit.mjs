import { spawnSync } from "node:child_process";

const ALLOWED = new Set([
  "GHSA-w3rx-r6r6-pgpr",
  "GHSA-5p2g-fcmc-qvqq",
]);

const result = spawnSync("pnpm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const raw = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
if (!raw) {
  console.error("Security audit returned no output.");
  process.exit(1);
}

let parsed;
try {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  parsed = JSON.parse(raw.slice(start, end + 1));
} catch (error) {
  console.error("Unable to parse pnpm audit JSON.");
  console.error(raw.slice(-4000));
  process.exit(1);
}

const findings = [];
function walk(value, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...path, String(index)]));
    return;
  }
  const text = JSON.stringify(value);
  const ids = [...text.matchAll(/GHSA-[a-z0-9-]+/gi)].map((m) => m[0]);
  const severity = typeof value.severity === "string" ? value.severity.toLowerCase() : undefined;
  const name = value.name || value.module_name || value.package || value.title;
  if (ids.length && severity) {
    findings.push({ ids: [...new Set(ids)], severity, name, path: path.join(".") });
  }
  for (const [key, child] of Object.entries(value)) walk(child, [...path, key]);
}
walk(parsed);

const relevant = findings.filter((f) => ["moderate", "high", "critical"].includes(f.severity));
const unique = new Map();
for (const finding of relevant) {
  const key = `${finding.name || "unknown"}:${finding.severity}:${finding.ids.sort().join(",")}`;
  unique.set(key, finding);
}
const deduped = [...unique.values()];
const blocked = deduped.filter((f) => f.ids.some((id) => !ALLOWED.has(id)));

if (blocked.length) {
  console.error("Blocking dependency vulnerabilities remain:");
  for (const finding of blocked) console.error(`- ${finding.severity} ${finding.name || "package"}: ${finding.ids.join(", ")}`);
  process.exit(1);
}

if (deduped.length) {
  console.warn("Audit contains only the two upstream image-size advisories with no installable patched release:");
  for (const finding of deduped) console.warn(`- ${finding.severity} ${finding.name || "image-size"}: ${finding.ids.join(", ")}`);
}
console.log("Dependency security gate passed: no fixable moderate/high/critical vulnerabilities remain.");
