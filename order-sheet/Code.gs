/**
 * Order receiver for the MDH catalogue site.
 * Saves every order to the "Orders" tab of this Google Sheet (one row per item)
 * and, if NOTIFY_EMAIL is set, emails you the order.
 *
 * Setup: see README.md in the repo, section "Receiving orders".
 */

const NOTIFY_EMAIL = "theindianwholesaleclub@gmail.com";   // your email, e.g. "you@example.com" — leave "" for no email
const SHEET_NAME   = "Orders";

const HEADERS = [
  "Order no", "Placed at", "Name", "Company", "Phone", "Email", "Delivery address",
  "Product", "Pack size", "Boxes", "Price per box (USD)", "Line total (USD)",
  "Order total boxes", "Order total (USD)", "Notes"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const o = JSON.parse(e.postData.contents);
    if (!o || !o.ref || !Array.isArray(o.items) || !o.items.length || o.items.length > 200) {
      return reply({ ok: false, error: "Invalid order" });
    }

    const sheet = getSheet();
    if (alreadySaved(sheet, o.ref)) return reply({ ok: true, ref: o.ref, duplicate: true });

    const c = o.customer || {};
    const placed = new Date(o.placedAt || Date.now());
    const rows = o.items.map(it => [
      clean(o.ref), placed, clean(c.name), clean(c.company), clean(c.phone), clean(c.email), clean(c.address),
      clean(it.product), clean(it.size), Number(it.boxes) || 0, Number(it.price) || 0, Number(it.lineTotal) || 0,
      Number(o.totalBoxes) || 0, Number(o.totalValue) || 0, clean(c.notes)
    ]);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        `New order ${o.ref} — $${(Number(o.totalValue) || 0).toFixed(2)} from ${clean(c.name)}`,
        String(o.summary || "").slice(0, 20000) + "\n\nSheet: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      );
    }
    return reply({ ok: true, ref: o.ref });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web-app URL in a browser shows this, so you can check it is live.
function doGet() {
  return reply({ ok: true, message: "Order receiver is running." });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function alreadySaved(sheet, ref) {
  const n = sheet.getLastRow() - 1;
  if (n < 1) return false;
  return sheet.getRange(2, 1, n, 1).getValues().some(r => r[0] === ref);
}

// Stops values starting with = + - @ from being treated as formulas.
function clean(v) {
  const s = String(v == null ? "" : v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
