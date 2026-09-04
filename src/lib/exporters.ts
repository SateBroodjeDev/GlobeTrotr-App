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

/** Volledige back-up van de werkruimte als JSON */
export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(name)}-backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Printklare reisgids: schema per dag, bestemmingen, paklijst en navigatielinks */
export function openGuide(
  trip: Trip,
  base: string,
  rates: Rates,
  brand: { brandName: string; domain: string },
) {
  const total = trip.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base, rates), 0);
  const days = [...new Set(trip.itinerary.map((i) => i.day))].sort();
  const nav = (lat: number, lon: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<title>Reisgids — ${escapeHtml(trip.name)}</title>
<style>
 body{font-family:ui-sans-serif,system-ui,Helvetica,Arial;margin:36px;color:#12211f}
 h1{font-size:26px;margin:0 0 4px}
 h2{font-size:15px;margin:24px 0 8px;border-bottom:1px solid #d8e5e2;padding-bottom:4px}
 .muted{color:#68807c;font-size:12px}
 .cover{border-bottom:3px solid #0f9b8e;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
 ul{margin:0;padding-left:18px} li{font-size:12px;margin-bottom:4px}
 .day{margin-bottom:10px} .day b{font-size:13px}
 .grid{display:flex;flex-wrap:wrap;gap:8px}
 .chip{border:1px solid #d8e5e2;border-radius:8px;padding:6px 10px;font-size:12px}
 a{color:#0f9b8e}
 @media print{@page{margin:14mm} a{text-decoration:none}}
</style></head><body>
<div class="cover"><div><h1>${escapeHtml(trip.name)}</h1>
<div class="muted">${trip.start} t/m ${trip.end} · ${trip.stops.length} bestemmingen · budget ${formatMoney(trip.budget, base)}</div></div>
<div class="muted">${escapeHtml(brand.brandName)}<br>${escapeHtml(brand.domain)}</div></div>

<h2>Route & navigatie</h2>
<div class="grid">${trip.stops
    .map(
      (s, i) =>
        `<div class="chip"><b>${i + 1}. ${escapeHtml(s.name)}</b> <span class="muted">${escapeHtml(
          s.country,
        )}</span><br><a href="${nav(s.lat, s.lon)}">Navigeer met Google Maps</a></div>`,
    )
    .join("")}</div>

<h2>Dag voor dag</h2>
${days
    .map(
      (d) =>
        `<div class="day"><b>${d}</b><ul>${trip.itinerary
          .filter((i) => i.day === d)
          .map(
            (i) =>
              `<li>${escapeHtml(i.title)}${i.notes ? ` <span class="muted">— ${escapeHtml(i.notes)}</span>` : ""}</li>`,
          )
          .join("")}</ul></div>`,
    )
    .join("")}

${
    trip.packing?.length
      ? `<h2>Paklijst</h2><ul>${trip.packing
          .map((p) => `<li>${p.done ? "☑" : "☐"} ${escapeHtml(p.label)}</li>`)
          .join("")}</ul>`
      : ""
  }

<h2>Budget</h2>
<p class="muted">Uitgegeven ${formatMoney(total, base)} van ${formatMoney(trip.budget, base)} · restant ${formatMoney(
    trip.budget - total,
    base,
  )}</p>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
