/** Imports may use colons, spreadsheet tabs or plain feature lines. */
export function productSpecRows(value: unknown): Array<[string, string]> {
  return String(value ?? "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const separator = /\t+|:\s*| {2,}/.exec(line);
    if (separator && separator.index > 0) {
      return [line.slice(0, separator.index).trim(), line.slice(separator.index + separator[0].length).trim()];
    }
    return ["Caracteristici", line];
  });
}
