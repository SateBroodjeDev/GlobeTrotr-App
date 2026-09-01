import { CATEGORIES, type Trip } from "./types";
import { convert, formatMoney, type Rates } from "./services";

export function downloadCsv(trip: Trip, base: string, rates: Rates) {
  const rows = [
    ["Datum", "Omschrijving", "Categorie", "Bedrag", "Valuta", `Bedrag (${base})`, "Betaald door", "Declarabel"],
    ...trip.expenses.map((e) => [
      e.date,
      e.title,
      CATEGORIES.find((c) => c.id === e.category)?.label ?? e.category,
      e.amount.toFixed(2),
      e.currency,
      convert(e.amount, e.currency, base, rates).toFixed(2),
      e.paidBy,
      e.billable ? "ja" : "nee",
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(trip.name)}-uitgaven.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function openPdf(
  trip: Trip,
  base: string,
  rates: Rates,
  brand: { brandName: string; domain: string },
) {
  const total = trip.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const billable = trip.expenses
    .filter((e) => e.billable)
    .reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);

  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<title>Declaratie — ${escapeHtml(trip.name)}</title>
<style>
 body{font-family:ui-sans-serif,system-ui,Helvetica,Arial;margin:40px;color:#12211f}
 h1{font-size:22px;margin:0 0 4px}
 .muted{color:#68807c;font-size:12px}
 .brand{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f9b8e;padding-bottom:12px;margin-bottom:24px}
 table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}
 th{text-align:left;background:#f1f6f5;padding:8px;border-bottom:1px solid #d8e5e2}
 td{padding:8px;border-bottom:1px solid #eef3f2}
 tfoot td{font-weight:700;border-top:2px solid #0f9b8e}
 .sched li{margin-bottom:4px;font-size:12px}
 @media print{@page{margin:16mm}}
</style></head><body>
<div class="brand"><div><h1>${escapeHtml(brand.brandName)}</h1>
<div class="muted">${escapeHtml(brand.domain)}</div></div>
<div class="muted">Gegenereerd ${new Date().toLocaleDateString("nl-NL")}</div></div>
<h1>${escapeHtml(trip.name)}</h1>
<div class="muted">${trip.start} t/m ${trip.end} · ${trip.stops.length} bestemmingen</div>
<h3>Reisschema</h3><ul class="sched">${trip.itinerary
    .map((i) => `<li><b>${i.day}</b> — ${escapeHtml(i.title)}${i.notes ? ` <span class="muted">(${escapeHtml(i.notes)})</span>` : ""}</li>`)
    .join("")}</ul>
<h3>Uitgaven & declaratie</h3>
<table><thead><tr><th>Datum</th><th>Omschrijving</th><th>Categorie</th><th>Origineel</th><th>${base}</th><th>Declarabel</th></tr></thead>
<tbody>${trip.expenses
    .map(
      (e) => `<tr><td>${e.date}</td><td>${escapeHtml(e.title)}</td><td>${
        CATEGORIES.find((c) => c.id === e.category)?.label ?? e.category
      }</td><td>${e.amount.toFixed(2)} ${e.currency}</td><td>${formatMoney(
        convert(e.amount, e.currency, base, rates),
        base,
      )}</td><td>${e.billable ? "ja" : "—"}</td></tr>`,
    )
    .join("")}</tbody>
<tfoot><tr><td colspan="4">Totaal</td><td>${formatMoney(total, base)}</td><td>${formatMoney(billable, base)}</td></tr></tfoot>
</table>
<p class="muted">Budget: ${formatMoney(trip.budget, base)} · Restant: ${formatMoney(trip.budget - total, base)}</p>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
