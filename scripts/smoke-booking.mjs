#!/usr/bin/env node
/**
 * Smoke E2E (node): booking → deposit → calendar → messages → cancel fee → fx.
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
  // Offset aleatorio para no chocar con smokes previos en el mismo proceso
  const offset = 40 + Math.floor(Math.random() * 80);
  const check_in = isoPlus(offset);
  const check_out = isoPlus(offset + 3);
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
    `[smoke] confirm OK payment=${getBody.payment?.status ?? "none"} deposit=${getBody.payment?.deposit_amount ?? "?"}`,
  );

  const pageRes = await fetch(
    `${BASE}/confirmacion/${encodeURIComponent(code)}`,
  );
  if (!pageRes.ok) {
    console.error("[smoke] FAIL confirmacion page", pageRes.status);
    process.exit(1);
  }
  console.log(`[smoke] confirmacion page ${pageRes.status}`);

  const depRes = await fetch(
    `${BASE}/api/public/booking/${encodeURIComponent(code)}/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: true, kind: "deposit" }),
    },
  );
  const depBody = await depRes.json().catch(() => ({}));
  if (!depRes.ok) {
    console.error("[smoke] FAIL deposit mock", depRes.status, depBody);
    process.exit(1);
  }
  const depStatus =
    depBody.payment?.status || depBody.reservation?.payment_status;
  if (depStatus !== "deposit_paid" && depBody.deposit?.due !== 0) {
    console.error("[smoke] FAIL deposit status", depStatus, depBody);
    process.exit(1);
  }
  console.log(
    `[smoke] deposit OK status=${depStatus} amount=${depBody.deposit?.amount} balance_due=${depBody.deposit?.balance_due}`,
  );

  const calRes = await fetch(
    `${BASE}/api/public/availability/calendar?from=${check_in}&to=${check_out}&category=vista`,
  );
  const calBody = await calRes.json().catch(() => ({}));
  if (!calRes.ok || !Array.isArray(calBody.nights)) {
    console.error("[smoke] FAIL calendar", calRes.status, calBody);
    process.exit(1);
  }
  console.log(
    `[smoke] calendar OK nights=${calBody.nights.length} blocked=${calBody.summary?.blocked_nights}`,
  );

  const msgRes = await fetch(
    `${BASE}/api/public/messages/${encodeURIComponent(code)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Smoke message hello" }),
    },
  );
  const msgBody = await msgRes.json().catch(() => ({}));
  if (!msgRes.ok || !msgBody.thread?.messages?.length) {
    console.error("[smoke] FAIL messages", msgRes.status, msgBody);
    process.exit(1);
  }
  console.log(`[smoke] messages OK count=${msgBody.thread.messages.length}`);

  const cancelRes = await fetch(
    `${BASE}/api/public/booking/${encodeURIComponent(code)}/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "guest_cancel", confirm: true }),
    },
  );
  const cancelBody = await cancelRes.json().catch(() => ({}));
  if (!cancelRes.ok || cancelBody.fee == null) {
    console.error("[smoke] FAIL cancel fee", cancelRes.status, cancelBody);
    process.exit(1);
  }
  console.log(
    `[smoke] cancel fee OK amount=${cancelBody.fee.fee_amount} tier=${cancelBody.fee.tier_id}`,
  );

  const fxRes = await fetch(`${BASE}/api/public/fx?amount_cop=410000`);
  const fxBody = await fxRes.json().catch(() => ({}));
  if (!fxRes.ok || !fxBody.isStub) {
    console.error("[smoke] FAIL fx stub", fxRes.status, fxBody);
    process.exit(1);
  }
  console.log(`[smoke] fx stub OK provider=${fxBody.provider}`);

  const loftsRes = await fetch(`${BASE}/lofts`);
  if (!loftsRes.ok) {
    console.error("[smoke] FAIL /lofts", loftsRes.status);
    process.exit(1);
  }
  console.log(`[smoke] /lofts ${loftsRes.status}`);
  console.log("[smoke] PASS");
}

main().catch((err) => {
  console.error("[smoke] FAIL", err);
  process.exit(1);
});
