const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

function safeHref(value: string): string | null {
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function inline(text: string): string {
  const links: string[] = [];
  const escaped = escapeHtml(text.replace(/\[([^\]\n]+)\]\(([^\s)]+)\)/g, (_, label: string, target: string) => {
    const href = safeHref(target);
    if (!href) return label;
    links.push(`<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`);
    return `\u0000LINK${links.length - 1}\u0000`;
  }));
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\u0000LINK(\d+)\u0000/g, (_, index: string) => links[Number(index)] ?? "");
}

/** One safe renderer for the browser and crawlable HTML. Raw HTML is text. */
export function renderArticleHtml(content: unknown): string {
  const lines = String(content ?? "").replace(/\u0000/g, "").split(/\r?\n/);
  const output: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) output.push(`<ul>${list.map(item => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (/^[-*] /.test(line)) { list.push(line.slice(2)); continue; }
    flushList();
    if (!line) continue;
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) { output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); continue; }
    if (line.startsWith("|") && /^\|?[\s:|-]+\|\s*$/.test(lines[index + 1]?.trim() || "")) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(cell => inline(cell.trim()));
      const header = cells(line);
      const rows: string[] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(`<tr>${cells(lines[index]).map(cell => `<td>${cell}</td>`).join("")}</tr>`); index++;
      }
      index--;
      output.push(`<div class="overflow-x-auto"><table><thead><tr>${header.map(cell => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`);
      continue;
    }
    output.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return output.join("");
}
