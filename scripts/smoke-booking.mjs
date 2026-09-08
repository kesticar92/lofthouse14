#!/usr/bin/env node
/**
 * Smoke E2E (node): booking local → confirmación (+ opcional pay mock).
 *
 * Uso:
 *   node scripts/smoke-booking.mjs
 *   BASE_URL=http://127.0.0.1:43127 node scripts/smoke-booking.mjs
 */

const BASE = (process.env.BASE_URL || "http://127.0.0.1:43127").replace(
  /\/$/,
  "",
);

function isoPlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const check_in = isoPlus(21);
  const check_out = isoPlus(24);
  console.log(`[smoke] BASE=${BASE}`);
  console.log(`[smoke] booking ${check_in} → ${check_out}`);

  const createRes = await fetch(`${BASE}/api/public/booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      check_in,
      check_out,
      guests: 2,
      lofts: 1,
      guest_name: "Smoke Test",
      guest_phone: "+570000000000",
      guest_email: "smoke@example.com",
      category_id: "vista",
      also_whatsapp: false,
    }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    console.error("[smoke] FAIL create", createRes.status, createBody);
    process.exit(1);
  }
  const code =
    createBody.reservation_code ||
    createBody.reservation?.reservation_code;
  if (!code) {
    console.error("[smoke] FAIL no reservation_code", createBody);
    process.exit(1);
  }
  console.log(`[smoke] created ${code} mode=${createBody.mode}`);

  const getRes = await fetch(
    `${BASE}/api/public/booking/${encodeURIComponent(code)}`,
  );
  const getBody = await getRes.json().catch(() => ({}));
  if (!getRes.ok) {
    console.error("[smoke] FAIL confirm lookup", getRes.status, getBody);
    process.exit(1);
  }
  console.log(
    `[smoke] confirm OK payment=${getBody.payment?.status ?? "none"} invoice=${getBody.invoice_draft ? "yes" : "no"}`,
  );

  const pageRes = await fetch(
    `${BASE}/confirmacion/${encodeURIComponent(code)}`,
  );
  if (!pageRes.ok) {
    console.error("[smoke] FAIL confirmacion page", pageRes.status);
    process.exit(1);
  }
  console.log(`[smoke] confirmacion page ${pageRes.status}`);

  const payRes = await fetch(
    `${BASE}/api/public/booking/${encodeURIComponent(code)}/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: true }),
    },
  );
  const payBody = await payRes.json().catch(() => ({}));
  if (!payRes.ok) {
    console.error("[smoke] FAIL pay mock", payRes.status, payBody);
    process.exit(1);
  }
  console.log(`[smoke] pay mock OK status=${payBody.payment?.status}`);

  const fxRes = await fetch(`${BASE}/api/public/fx?amount_cop=410000`);
  const fxBody = await fxRes.json().catch(() => ({}));
  if (!fxRes.ok || !fxBody.isStub) {
    console.error("[smoke] FAIL fx stub", fxRes.status, fxBody);
    process.exit(1);
  }
  console.log(`[smoke] fx stub OK provider=${fxBody.provider}`);
  console.log("[smoke] PASS");
}

main().catch((err) => {
  console.error("[smoke] FAIL", err);
  process.exit(1);
});
