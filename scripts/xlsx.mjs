// Minimal .xlsx reader: unzip (stored/deflate) + SpreadsheetML parsing.
// Enough for the flat sheets this project imports; not a general-purpose library.
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

// ── zip ─────────────────────────────────────────────────────────────────────
function findEndOfCentralDirectory(buf) {
  const min = Math.max(0, buf.length - 66_000);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("Not a zip file: end-of-central-directory record not found");
}

/** @returns {Map<string, Buffer>} entry name → uncompressed bytes */
export function unzip(path) {
  const buf = readFileSync(path);
  const eocd = findEndOfCentralDirectory(buf);
  const entryCount = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);

  const files = new Map();

  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Bad central directory header at ${offset}`);
    }
    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString("utf8", offset + 46, offset + 46 + nameLength);

    // Re-read the lengths from the local header — its extra field can differ.
    const localNameLength = buf.readUInt16LE(localOffset + 26);
    const localExtraLength = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buf.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) files.set(name, Buffer.from(raw));
    else if (method === 8) files.set(name, inflateRawSync(raw));
    else throw new Error(`Unsupported compression method ${method} for ${name}`);

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

// ── XML ─────────────────────────────────────────────────────────────────────
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, code) => {
    if (code[0] === "#") {
      const value = code[1] === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return ENTITIES[code] ?? match;
  });
}

/**
 * Every `<t>…</t>` text run inside a chunk of XML, concatenated.
 * The attribute group is lazy so that self-closing tags (`<t/>`) do not let the
 * body match run on to the next closing tag.
 */
function textRuns(xml) {
  let out = "";
  const re = /<t\b([^>]*?)(?:\/>|>([\s\S]*?)<\/t>)/g;
  let m;
  while ((m = re.exec(xml))) out += decodeXml(m[2] ?? "");
  return out;
}

function sharedStrings(xml) {
  const items = [];
  const re = /<si\b([^>]*?)(?:\/>|>([\s\S]*?)<\/si>)/g;
  let m;
  while ((m = re.exec(xml))) items.push(textRuns(m[2] ?? ""));
  return items;
}

function columnIndex(ref) {
  const letters = /^([A-Z]+)/.exec(ref)?.[1] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Read the first worksheet as a dense grid of strings.
 * @returns {string[][]} grid[rowIndex][colIndex], both zero-based
 */
export function readSheet(path, sheetFile = "xl/worksheets/sheet1.xml") {
  const files = unzip(path);
  const strings = files.has("xl/sharedStrings.xml")
    ? sharedStrings(files.get("xl/sharedStrings.xml").toString("utf8"))
    : [];

  const sheetXml = files.get(sheetFile);
  if (!sheetXml) throw new Error(`${sheetFile} not found in ${path}`);
  const xml = sheetXml.toString("utf8");

  const grid = [];
  const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
  let rowMatch;

  while ((rowMatch = rowRe.exec(xml))) {
    const rowIndex = Number(/\br="(\d+)"/.exec(rowMatch[1])?.[1] ?? "0") - 1;
    if (rowIndex < 0) continue;
    const row = [];

    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch;

    while ((cellMatch = cellRe.exec(rowMatch[2] ?? ""))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? "A1";
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";

      let value = "";
      if (type === "s") {
        const index = Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "-1");
        value = strings[index] ?? "";
      } else if (type === "inlineStr") {
        value = textRuns(body);
      } else if (type === "str") {
        value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
      } else {
        value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
      }

      row[columnIndex(ref)] = value;
    }

    grid[rowIndex] = row;
  }

  // Fill holes so callers can index freely.
  const width = grid.reduce((max, row) => Math.max(max, row?.length ?? 0), 0);
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] ?? [];
    for (let c = 0; c < width; c++) row[c] ??= "";
    grid[r] = row;
  }

  return grid;
}
