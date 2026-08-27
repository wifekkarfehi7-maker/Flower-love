export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Downloads rows as a real CSV file (UTF-8 BOM so Arabic text opens correctly in Excel). */
export function exportToCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  const content = "﻿" + [header, ...lines].join("\r\n");
  triggerDownload(content, "text/csv", filename);
}

/**
 * Downloads rows as an .xls file using the HTML-table trick (Excel, Google
 * Sheets, and Numbers all open an HTML table saved with an .xls extension
 * as a real worksheet). Avoids pulling in a full spreadsheet library just
 * for a guest list export.
 */
export function exportToExcel<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const headerCells = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const bodyRows = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(row))}</td>`).join("")}</tr>`)
    .join("");

  const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  triggerDownload(content, "application/vnd.ms-excel", filename);
}
