// public/assets/app.js
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TZ,
  DEFAULT_LOCATION,
  APP_TITLE,
  ACCESS_TOKEN
} from "./config.js";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================================
   Labels
========================================= */

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

/* =========================================
   Helpers
========================================= */

export function pad2(n){ return String(n).padStart(2, "0"); }
export function $(id){ return document.getElementById(id); }

export function setTitle(sub){
  document.title = sub ? `${sub} • ${APP_TITLE}` : APP_TITLE;
}

export function waLink(text){
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppShare(text){
  window.open(waLink(text), "_blank");
}

/* =========================================
   URL params
========================================= */

export function getMonthParam(){
  const params = new URLSearchParams(window.location.search);
  const month = params.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;

  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth()+1)}`;
}

export function getAccessParam(){
  const params = new URLSearchParams(window.location.search);
  return params.get("access") || "";
}

export function validateAccessToken(access){
  return access && access === ACCESS_TOKEN;
}

/* =========================================
   Date / Time (TZ safe)
========================================= */

export function monthLabel(yyyy_mm){
  const [y,m] = yyyy_mm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m-1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    month:"long",
    year:"numeric"
  }).format(d);
}

export function formatTime12(dateISO){
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(dateISO));
}

export function formatTime24(dateISO){
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateISO));
}

export function formatGregorian(dateISO){
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateISO));
}

export function formatHijriUmmAlQura(dateISO){
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateISO));
}

function ymdTZ(iso){
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year:"numeric",
    month:"2-digit",
    day:"2-digit"
  }).format(new Date(iso));
}

export function isTodayTZ(iso){
  return ymdTZ(iso) === ymdTZ(new Date());
}

export function endLabel(endISO, startISO){
  return ymdTZ(endISO) !== ymdTZ(startISO)
    ? " (اليوم التالي)"
    : "";
}

/* =========================================
   ISO builder (+03:00 Riyadh)
========================================= */

export function toISOFromDateAndTime(dateStr, timeStr){
  return `${dateStr}T${timeStr}:00+03:00`;
}

function addDaysToDateStr(dateStr, days){
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth()+1)}-${pad2(dt.getUTCDate())}`;
}

export function computeEndISO(dateStr, startTime, endTime){
  const toMin = (t)=>{
    const [h,m] = t.split(":").map(Number);
    return h*60 + (m||0);
  };

  const sMin = toMin(startTime);
  const eMin = toMin(endTime);

  const startISO = toISOFromDateAndTime(dateStr, startTime);
  const endDateStr = (eMin <= sMin)
    ? addDaysToDateStr(dateStr,1)
    : dateStr;

  const endISO = toISOFromDateAndTime(endDateStr, endTime);

  return { startISO, endISO };
}

/* =========================================
   ICS
========================================= */

function toICSDateUTC(date){
  const y = date.getUTCFullYear();
  const mo = pad2(date.getUTCMonth()+1);
  const da = pad2(date.getUTCDate());
  const h = pad2(date.getUTCHours());
  const mi = pad2(date.getUTCMinutes());
  return `${y}${mo}${da}T${h}${mi}00Z`;
}

function escapeICS(s){
  return (s||"")
    .replace(/\\/g,"\\\\")
    .replace(/\n/g,"\\n")
    .replace(/,/g,"\\,")
    .replace(/;/g,"\\;");
}

export function downloadICS({ meal, startsAtISO, endsAtISO, hostsText, notes }){
  const start = new Date(startsAtISO);
  const end   = new Date(endsAtISO);

  const description = [
    `🍽️ ${mealLabel(meal)}`,
    `📍 ${DEFAULT_LOCATION}`,
    hostsText ? `👥 ${hostsText}` : "",
    notes ? `📝 ${notes}` : ""
  ].filter(Boolean).join("\n");

  const uid = `meal-${start.getTime()}@${location.host}`;
  const dtstamp = toICSDateUTC(new Date());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dawriya Rest//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toICSDateUTC(start)}`,
    `DTEND:${toICSDateUTC(end)}`,
    `SUMMARY:${escapeICS(APP_TITLE+" - "+mealLabel(meal))}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(DEFAULT_LOCATION)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${mealLabel(meal)}-${start.toISOString().slice(0,10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =========================================
   Skeleton
========================================= */

export function renderSkeleton(targetEl, count=6){
  const wrap = document.createElement("div");
  wrap.className = "cardsGrid";

  for(let i=0;i<count;i++){
    const card = document.createElement("div");
    card.className = "skel-card";
    card.innerHTML = `
      <div class="skel-row">
        <div class="skel-left">
          <div class="skeleton skel-chip"></div>
          <div class="skeleton skel-title" style="margin-top:12px"></div>
          <div class="skeleton skel-line" style="width:85%"></div>
          <div class="skeleton skel-line" style="width:75%"></div>
          <div class="skeleton skel-line" style="width:60%"></div>
        </div>
        <div class="skel-actions">
          <div class="skeleton skel-btn"></div>
          <div class="skeleton skel-btn"></div>
        </div>
      </div>
      <div class="skel-hosts">
        <div class="skeleton skel-line" style="width:30%;margin-top:0"></div>
        <div class="skeleton skel-line" style="width:80%"></div>
      </div>
    `;
    wrap.appendChild(card);
  }

  targetEl.innerHTML = "";
  targetEl.appendChild(wrap);
}
