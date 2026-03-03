// public/assets/app.js
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  ACCESS_TOKEN,
  TZ,
  DEFAULT_LOCATION,
  APP_TITLE
} from "./config.js";

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// Labels
// -----------------------------
export const MEAL_LABEL = {
  futoor: "فطور",
  ghada: "غدا",
  asha: "عشا",
  suhoor: "سحور",
};

export const MEAL_ICON = {
  futoor: "🌅",
  ghada: "☀️",
  asha: "🌙",
  suhoor: "⭐",
};

export function mealLabel(m){ return MEAL_LABEL[m] || m; }
export function mealIcon(m){ return MEAL_ICON[m] || "🍽️"; }

// -----------------------------
// Basic helpers
// -----------------------------
export function pad2(n){ return String(n).padStart(2, "0"); }

export function getMonthParam(){
  const params = new URLSearchParams(window.location.search);
  const month = params.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth()+1)}`;
}

export function monthLabel(yyyy_mm){
  const [y,m] = yyyy_mm.split("-").map(Number);
  // midday UTC avoids edge cases
  const d = new Date(Date.UTC(y, m-1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    month:"long",
    year:"numeric"
  }).format(d);
}

export function waLink(text){
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function validateAccessToken(access){
  return access && access === ACCESS_TOKEN;
}

export function getAccessParam(){
  const params = new URLSearchParams(window.location.search);
  return params.get("access") || "";
}

export function setTitle(sub){
  document.title = sub ? `${sub} • ${APP_TITLE}` : APP_TITLE;
}

// -----------------------------
// Date/time formatting (TZ-aware)
// -----------------------------
export function formatTime12(iso){
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(iso));
}

export function formatGregorian(iso){
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat("ar-SA", { weekday:"long", timeZone: TZ }).format(d);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(d);
  const [y,m,da] = ymd.split("-");
  return `${weekday} ${da}/${m}/${y}`;
}

export function formatHijriUmmAlQura(iso){
  try{
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(iso));
  }catch{
    return "—";
  }
}

export function isTodayTZ(iso){
  const a = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(iso));
  const b = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  return a === b;
}

/**
 * Small suffix for end time when event crosses midnight
 * Example: "٧:٠٠ م – ٩:٠٠ ص (اليوم التالي)"
 */
export function endLabel(endISO, startISO){
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(startISO));
  const e = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(endISO));
  return (e !== s) ? " (اليوم التالي)" : "";
}

// -----------------------------
// Time building (safe midnight crossing)
// -----------------------------
export function toISOFromDateAndTime(dateStr, timeStr){
  // keep fixed +03:00 for Riyadh
  return `${dateStr}T${timeStr}:00+03:00`;
}

function addDaysToDateStr(dateStr, days){
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 0, 0, 0));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function computeEndISO(dateStr, startTime, endTime){
  const toMin = (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return (h * 60) + (m || 0);
  };

  const sMin = toMin(startTime);
  const eMin = toMin(endTime);

  const startISO = toISOFromDateAndTime(dateStr, startTime);
  const endDateStr = (eMin <= sMin) ? addDaysToDateStr(dateStr, 1) : dateStr;
  const endISO = toISOFromDateAndTime(endDateStr, endTime);

  return { startISO, endISO };
}

// -----------------------------
// ICS
// -----------------------------
function toICSDateUTC(date){
  const y = date.getUTCFullYear();
  const mo = pad2(date.getUTCMonth()+1);
  const da = pad2(date.getUTCDate());
  const h = pad2(date.getUTCHours());
  const mi = pad2(date.getUTCMinutes());
  return `${y}${mo}${da}T${h}${mi}00Z`;
}

function escapeICS(s){
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function downloadICS({ meal, startsAtISO, endsAtISO, hostsText, notes }){
  const start = new Date(startsAtISO);
  const end = new Date(endsAtISO);
  const title = `${mealLabel(meal)} ${DEFAULT_LOCATION}`;

  const descriptionLines = [];
  if (hostsText) descriptionLines.push(`الداعين: ${hostsText}`);
  if (notes) descriptionLines.push(`ملاحظة: ${notes}`);
  const description = descriptionLines.join("\n");

  const uid = `meal-${start.getTime()}-${Math.random().toString(16).slice(2)}@${location.host || "local"}`;
  const dtstamp = toICSDateUTC(new Date());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dawriya Rest//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toICSDateUTC(start)}`,
    `DTEND:${toICSDateUTC(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(DEFAULT_LOCATION)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS("تذكير بدورية الاستراحة")}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS("الدعوة بعد 3 ساعات")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${mealLabel(meal)}-${start.toISOString().slice(0,10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// -----------------------------
// UI helpers (central)
// -----------------------------
export function lockScroll(lock){
  document.body.classList.toggle("lockScroll", !!lock);
}

export function toast(areaEl, msg, kind=""){
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = msg;
  areaEl.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

export function skeletonMealsHTML(count=3){
  const rows = [];
  for (let i=0;i<count;i++){
    rows.push(`
      <div class="skel-card">
        <div class="skel-row">
          <div class="skel-left">
            <div class="skeleton skel-title"></div>
            <div class="skeleton skel-line" style="width:88%"></div>
            <div class="skeleton skel-line" style="width:72%"></div>
            <div class="skeleton skel-line" style="width:60%"></div>
          </div>
          <div class="skel-actions">
            <div class="skeleton skel-btn"></div>
            <div class="skeleton skel-btn"></div>
          </div>
        </div>
        <div class="skel-hosts">
          <div class="skeleton skel-line" style="width:35%"></div>
          <div class="skeleton skel-line" style="width:78%"></div>
        </div>
      </div>
    `);
  }
  return `<div class="cardsGrid">${rows.join("")}</div>`;
}
