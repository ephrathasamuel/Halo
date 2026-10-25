/**
 * Escape a CSV field: quote if it contains commas, quotes, or newlines.
 * @param {*} value
 * @returns {string}
 */
function escapeField(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Export rows as a CSV string.
 * @param {Array<Object>} rows
 * @param {Array<{key: string, label: string}>} columns
 * @returns {string}
 */
export function exportCsv(rows, columns) {
  const header = columns.map((c) => escapeField(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeField(row[c.key])).join(',')
  );
  return [header, ...body].join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 * @param {string} csvString
 * @param {string} filename
 */
export function downloadCsv(csvString, filename) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
