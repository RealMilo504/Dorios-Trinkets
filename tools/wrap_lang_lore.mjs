import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const argumentsList = process.argv.slice(2);
const checkOnly = argumentsList.includes("--check");
const limitIndex = argumentsList.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(argumentsList[limitIndex + 1]) : 44;

if (!Number.isInteger(limit) || limit < 10) {
    throw new Error("--limit must be an integer greater than or equal to 10");
}

const textsDirectory = resolve("RP", "texts");
const files = (await readdir(textsDirectory)).filter((name) => name.endsWith(".lang"));
const visibleText = (value) => value.replace(/§./gu, "").trim();

function wrapSegment(segment) {
    if (visibleText(segment).length <= limit) return [segment.trimEnd()];

    const leadingWhitespace = segment.match(/^\s*/u)?.[0] ?? "";
    const content = segment.slice(leadingWhitespace.length);
    const formatPrefix = content.match(/^(?:§.)+/u)?.[0] ?? "";
    const plainContent = content.slice(formatPrefix.length).trim();
    const words = plainContent.split(/\s+/u).filter(Boolean);
    const lines = [];
    let current = `${leadingWhitespace}${formatPrefix}`;

    for (const word of words) {
        const separator = visibleText(current).length > 0 ? " " : "";
        const candidate = `${current}${separator}${word}`;
        if (visibleText(candidate).length <= limit || visibleText(current).length === 0) {
            current = candidate;
            continue;
        }

        lines.push(current.trimEnd());
        current = `${leadingWhitespace}${formatPrefix}${word}`;
    }

    if (current.trim()) lines.push(current.trimEnd());
    return lines;
}

let changedEntries = 0;
let longest = 0;
const violations = [];

for (const fileName of files) {
    const filePath = resolve(textsDirectory, fileName);
    const source = await readFile(filePath, "utf8");
    const newline = source.includes("\r\n") ? "\r\n" : "\n";
    const lines = source.split(/\r?\n/u);
    let fileChanged = false;

    const output = lines.map((line, physicalLineIndex) => {
        if (!line.startsWith("item.dorios:") || !line.includes("\\n")) return line;

        const equalsIndex = line.indexOf("=");
        if (equalsIndex < 0) return line;
        const key = line.slice(0, equalsIndex + 1);
        const value = line.slice(equalsIndex + 1);
        const wrapped = value
            .split(/\s*\\n\s*/u)
            .flatMap(wrapSegment);
        const nextLine = `${key}${wrapped.join(" \\n")}`;

        for (const segment of wrapped) {
            const length = visibleText(segment).length;
            longest = Math.max(longest, length);
            if (length > limit) {
                violations.push(`${fileName}:${physicalLineIndex + 1} (${length}) ${visibleText(segment)}`);
            }
        }

        if (nextLine !== line) {
            fileChanged = true;
            changedEntries += 1;
        }
        return nextLine;
    });

    if (fileChanged && !checkOnly) {
        await writeFile(filePath, output.join(newline), "utf8");
    }
}

if (violations.length > 0) {
    console.error(`Found ${violations.length} lore line(s) above ${limit} visible characters:`);
    console.error(violations.join("\n"));
    process.exitCode = 1;
} else {
    const action = checkOnly ? "checked" : "formatted";
    console.log(`${action}: ${files.length} locale files, ${changedEntries} changed entries, maximum ${longest}/${limit}`);
}
