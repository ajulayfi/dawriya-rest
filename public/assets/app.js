import { SUPABASE_URL, SUPABASE_ANON_KEY, ACCESS_TOKEN, TZ, DEFAULT_LOCATION, APP_TITLE } from "./config.js";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const mealLabel = (m) => ({
  futoor: "فطور",
  ghada: "غدا",
  asha: "عشا",
  suhoor: "سحور",
}[m] || m);

export function pad2(n){ return String(n).padStart(2, "0"); }

export function formatTime12(dateISO){
  const d = new Date(dateISO);
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(d);
}

export function formatGregorian(dateISO){
  const d = new Date(dateISO);
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

export function formatHijriUmmAlQura(dateISO){
  const d = new Date(dateISO);
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d);
}

export function monthLabel(yyyy_mm){
  const [y,m] = yyyy_mm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m-1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat("ar-SA", { timeZone: TZ, month:"long", year:"numeric" }).format(d);
}

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

export function waLink(text){
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function toISOFromDateAndTime(dateStr, timeStr){
  return `${dateStr}T${timeStr}:00+03:00`;
}

export function computeEndISO(dateStr, startTime, endTime){
  const startISO = toISOFromDateAndTime(dateStr, startTime);
  const start = new Date(startISO);

  let endDateStr = dateStr;
  if (endTime <= startTime){
    const d = new Date(start.getTime() + 24*60*60*1000);
    endDateStr = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }
  const endISO = toISOFromDateAndTime(endDateStr, endTime);
  return { startISO, endISO };
}

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

export function validateAccessToken(access){
  return access && access === ACCESS_TOKEN;
}

export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for (const c of children){
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function setTitle(sub){
  document.title = sub ? `${sub} • ${APP_TITLE}` : APP_TITLE;
}
