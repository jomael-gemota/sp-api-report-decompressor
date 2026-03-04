const express = require("express");
const multer = require("multer");
const zlib = require("zlib");
const path = require("path");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

function tryGunzip(buffer) {
  return new Promise((resolve) => {
    zlib.gunzip(buffer, (err, result) => {
      if (err) resolve(null);
      else resolve(result);
    });
  });
}

/**
 * Recursively flatten a nested object into dot-notation keys.
 * { a: { b: 1 } } → { "a.b": 1 }
 * Arrays at leaf level are JSON-stringified.
 */
function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = value === null || value === undefined ? "" : value;
    }
  }
  return result;
}

/**
 * Walk a JSON structure and return the largest array of objects found.
 * SP-API reports nest the actual data inside keys like
 * "salesAndTrafficByDate", "salesAndTrafficByAsin", etc.
 */
function findDataArray(obj) {
  let best = null;
  let bestLen = 0;

  function walk(node) {
    if (Array.isArray(node)) {
      if (
        node.length > bestLen &&
        node.length > 0 &&
        typeof node[0] === "object" &&
        node[0] !== null
      ) {
        best = node;
        bestLen = node.length;
      }
    } else if (node !== null && typeof node === "object") {
      for (const value of Object.values(node)) {
        walk(value);
      }
    }
  }

  walk(obj);
  return best;
}

/**
 * Convert an array of objects into a CSV string.
 * Collects all unique column names from every row first to handle
 * rows with different shapes.
 */
function jsonArrayToCsv(rows) {
  const flatRows = rows.map((row) => flattenObject(row));

  const columnSet = new Set();
  for (const row of flatRows) {
    for (const key of Object.keys(row)) {
      columnSet.add(key);
    }
  }
  const columns = Array.from(columnSet);

  const escapeCsvField = (val) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = columns.map(escapeCsvField).join(",");
  const dataLines = flatRows.map((row) =>
    columns.map((col) => escapeCsvField(row[col])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

function tsvToCsv(text) {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      if (!line.trim()) return "";
      const fields = line.split("\t");
      return fields
        .map((field) => {
          const trimmed = field.trim();
          if (
            trimmed.includes(",") ||
            trimmed.includes('"') ||
            trimmed.includes("\n")
          ) {
            return '"' + trimmed.replace(/"/g, '""') + '"';
          }
          return trimmed;
        })
        .join(",");
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

function textToCsv(text) {
  // 1. Try JSON
  try {
    const json = JSON.parse(text);

    // Top-level array of objects → convert directly
    if (Array.isArray(json) && json.length > 0 && typeof json[0] === "object") {
      return jsonArrayToCsv(json);
    }

    // Object with nested data array (typical SP-API structure)
    if (typeof json === "object" && json !== null) {
      const dataArray = findDataArray(json);
      if (dataArray) {
        return jsonArrayToCsv(dataArray);
      }
      // Single object with no nested array — flatten it into one row
      return jsonArrayToCsv([json]);
    }
  } catch {
    // Not JSON — continue to TSV / plain text handling
  }

  // 2. Tab-delimited
  const firstLine = text.split("\n")[0] || "";
  if (firstLine.includes("\t")) {
    return tsvToCsv(text);
  }

  // 3. Already CSV or plain text — return as-is
  return text;
}

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const raw = req.file.buffer;
    let text;

    const decompressed = await tryGunzip(raw);
    if (decompressed) {
      text = decompressed.toString("utf-8");
    } else {
      text = raw.toString("utf-8");
    }

    const csv = textToCsv(text);

    const originalName = req.file.originalname || "report";
    const baseName = path.basename(originalName, path.extname(originalName));
    const outputName = `${baseName}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
    res.setHeader("X-Original-Filename", req.file.originalname);
    res.setHeader("X-Was-Compressed", decompressed ? "true" : "false");
    res.setHeader("X-Output-Filename", outputName);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
