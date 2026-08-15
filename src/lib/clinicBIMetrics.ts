/**
 * Klinika BI — barcha ko'rsatkichlarni real ma'lumotdan hisoblaydi.
 * Hech qanday demo/soxta qiymat ishlatilmaydi; ma'lumot bo'lmasa 0 qaytadi.
 */
import type { ClinicBIData } from "@/hooks/useClinicBI";
import { BIRange, buildSeries, delta, inRange, num, prevRange, sum, toDate } from "./clinicBI";

const NO_SHOW = ["no_show", "no-show", "noshow"];
const isNoShow = (s: any) => NO_SHOW.includes(String(s || "").toLowerCase());
const isCancelled = (s: any) => String(s || "").toLowerCase() === "cancelled";
const isCompleted = (s: any) => String(s || "").toLowerCase() === "completed";

export interface BIMetrics {
  range: BIRange;
  // moliyaviy
  grossRevenue: number;
  invoiceRevenue: number;
  appointmentRevenue: number;
  expenses: number;
  netRevenue: number;
  outstanding: number;
  discounts: number;
  taxes: number;
  refunds: number;
  revenueDelta: number | null;
  prevGross: number;
  // qabullar
  appts: any[];
  prevAppts: any[];
  apptDelta: number | null;
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  noShow: number;
  noShowRate: number;
  // bemorlar
  uniquePatients: number;
  newPatients: number;
  returningPatients: number;
  activePatients: number;
  dormantPatients: number;
  retention: { window: string; value: number }[];
  // operatsion
  avgWaitMinutes: number;
  maxWaitMinutes: number;
  avgDurationMinutes: number;
  doctorUtilization: number;
  bedOccupancy: number;
  bedsTotal: number;
  bedsOccupied: number;
  avgStayDays: number;
  labCount: number;
  labLate: number;
  labTurnaroundHours: number;
  pharmacySales: number;
  pharmacyStockValue: number;
  // ranking
  series: { name: string; daromad: number; qabullar: number }[];
  revenueSources: { name: string; value: number }[];
  doctorRows: DoctorRow[];
  departmentRows: DepartmentRow[];
  serviceRows: ServiceRow[];
  radiology: { name: string; count: number; revenue: number }[];
  insurance: { total: number; approved: number; rejected: number; paid: number; outstanding: number; companies: number };
  ai: { requests: number; credits: number; topService: string; errors: number };
  marketing: { impressions: number; clicks: number; conversions: number; ctr: number };
  channels: { name: string; value: number }[];
  satisfaction: { avg: number; nps: number; total: number; positive: number; negative: number; complaints: number };
  noShowByDoctor: { name: string; value: number }[];
  noShowByHour: { name: string; value: number }[];
  waitByDay: { name: string; value: number }[];
  heatmap: { day: number; hour: number; value: number }[];
  alerts: BIAlert[];
}

export interface DoctorRow {
  id: string; name: string; specialty: string;
  appts: number; completed: number; cancelled: number; noShow: number;
  patients: number; revenue: number; avgCheck: number; rating: number;
  reviews: number; utilization: number; repeatRate: number; services: number;
}

export interface DepartmentRow {
  id: string; name: string; patients: number; queue: number; beds: number;
  occupied: number; occupancy: number; doctors: number; revenue: number; expenses: number; profit: number;
}

export interface ServiceRow {
  id: string; name: string; count: number; revenue: number; price: number;
  growth: number | null; doctors: number;
}

export interface BIAlert {
  level: "critical" | "warning" | "info" | "success";
  title: string;
  detail: string;
}

const round = (v: number, p = 1) => Math.round(v * 10 ** p) / 10 ** p;

export function computeBI(d: ClinicBIData, range: BIRange): BIMetrics {
  const prev = prevRange(range);

  const appts = d.appointments.filter((a) => inRange(a.appointment_date, range));
  const prevAppts = d.appointments.filter((a) => inRange(a.appointment_date, prev));

  const invIn = d.invoices.filter((i) => inRange(i.invoice_date || i.created_at, range));
  const invPrev = d.invoices.filter((i) => inRange(i.invoice_date || i.created_at, prev));

  const invoiceRevenue = sum(invIn, (i) => num(i.paid_amount));
  const appointmentRevenue = sum(appts.filter((a) => isCompleted(a.status)), (a) => num(a.total_price));
  const grossRevenue = invoiceRevenue + appointmentRevenue;

  const prevGross = sum(invPrev, (i) => num(i.paid_amount)) +
    sum(prevAppts.filter((a) => isCompleted(a.status)), (a) => num(a.total_price));

  const finIn = d.finance.filter((f) => inRange(f.transaction_date || f.created_at, range));
  const expenses = sum(finIn.filter((f) => String(f.transaction_type) === "expense"), (f) => num(f.amount));
  const refunds = sum(finIn.filter((f) => String(f.category || "").toLowerCase().includes("refund")), (f) => num(f.amount));
  const financeIncome = sum(finIn.filter((f) => String(f.transaction_type) === "income"), (f) => num(f.amount));

  const outstanding = sum(d.invoices.filter((i) => i.status !== "paid"), (i) => Math.max(0, num(i.total_amount) - num(i.paid_amount)));
  const discounts = sum(invIn, (i) => num(i.discount));
  const taxes = sum(invIn, (i) => num(i.tax));

  const completed = appts.filter((a) => isCompleted(a.status)).length;
  const confirmed = appts.filter((a) => a.status === "confirmed").length;
  const pending = appts.filter((a) => a.status === "pending").length;
  const cancelled = appts.filter((a) => isCancelled(a.status)).length;
  const noShow = appts.filter((a) => isNoShow(a.status)).length;

  // Bemorlar
  const patientIds = new Set(appts.map((a) => a.patient_id).filter(Boolean));
  const newPatients = d.patients.filter((p) => inRange(p.created_at, range)).length;
  const apptCountByPatient = new Map<string, number>();
  d.appointments.forEach((a) => {
    if (!a.patient_id) return;
    apptCountByPatient.set(a.patient_id, (apptCountByPatient.get(a.patient_id) || 0) + 1);
  });
  const returningPatients = Array.from(patientIds).filter((p) => (apptCountByPatient.get(p as string) || 0) > 1).length;

  const now = new Date();
  const lastVisit = new Map<string, number>();
  d.appointments.forEach((a) => {
    const t = toDate(a.appointment_date)?.getTime();
    if (!a.patient_id || !t) return;
    lastVisit.set(a.patient_id, Math.max(lastVisit.get(a.patient_id) || 0, t));
  });
  const activePatients = Array.from(lastVisit.values()).filter((t) => now.getTime() - t <= 90 * 864e5).length;
  const dormantPatients = Array.from(lastVisit.values()).filter((t) => now.getTime() - t > 180 * 864e5).length;

  const retention = [7, 30, 90, 180].map((w) => {
    const base = Array.from(lastVisit.keys());
    if (!base.length) return { window: `${w} kun`, value: 0 };
    const kept = base.filter((p) => {
      const visits = d.appointments.filter((a) => a.patient_id === p).map((a) => toDate(a.appointment_date)?.getTime() || 0).sort();
      if (visits.length < 2) return false;
      for (let i = 1; i < visits.length; i++) if (visits[i] - visits[i - 1] <= w * 864e5) return true;
      return false;
    }).length;
    return { window: `${w} kun`, value: round((kept / base.length) * 100) };
  });

  // Navbat / kutish vaqti
  const queueIn = d.queue.filter((q) => inRange(q.created_at, range));
  const waits = queueIn.map((q) => {
    const c = toDate(q.created_at)?.getTime();
    const called = toDate(q.called_at)?.getTime();
    if (c && called && called > c) return (called - c) / 60000;
    return num(q.estimated_wait_minutes);
  }).filter((v) => v > 0);
  const avgWaitMinutes = waits.length ? round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const maxWaitMinutes = waits.length ? Math.round(Math.max(...waits)) : 0;

  const durations = queueIn.map((q) => {
    const called = toDate(q.called_at)?.getTime();
    const done = toDate(q.completed_at)?.getTime();
    return called && done && done > called ? (done - called) / 60000 : 0;
  }).filter((v) => v > 0);
  const svcDur = d.services.length ? sum(d.services, (s) => num(s.duration_minutes)) / d.services.length : 0;
  const avgDurationMinutes = durations.length ? round(durations.reduce((a, b) => a + b, 0) / durations.length) : round(svcDur);

  // Bandlik: kuniga shifokor uchun 16 ta 30-daqiqali slot
  const days = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 864e5));
  const activeDoctors = d.doctors.filter((x) => x.is_active !== false);
  const capacity = Math.max(1, activeDoctors.length * days * 16);
  const doctorUtilization = round(Math.min(100, (appts.length / capacity) * 100));

  const bedsTotal = d.beds.length;
  const bedsOccupied = d.beds.filter((b) => b.status === "occupied").length;
  const bedOccupancy = bedsTotal ? round((bedsOccupied / bedsTotal) * 100) : 0;
  const stays = d.beds.map((b) => {
    const a = toDate(b.admitted_at)?.getTime();
    return a ? (now.getTime() - a) / 864e5 : 0;
  }).filter((v) => v > 0);
  const avgStayDays = stays.length ? round(stays.reduce((a, b) => a + b, 0) / stays.length) : 0;

  // Laboratoriya
  const labIn = d.labOrders.filter((l) => inRange(l.ordered_at || l.created_at, range));
  const labTurn = labIn.map((l) => {
    const o = toDate(l.ordered_at || l.created_at)?.getTime();
    const c = toDate(l.completed_at)?.getTime();
    return o && c && c > o ? (c - o) / 36e5 : 0;
  }).filter((v) => v > 0);
  const labLate = labIn.filter((l) => {
    const o = toDate(l.ordered_at || l.created_at)?.getTime();
    return l.status !== "completed" && o && now.getTime() - o > 48 * 36e5;
  }).length;

  // Dorixona
  const pharmacyStockValue = sum(d.pharmacy, (p) => num(p.quantity) * num(p.sell_price));
  const pharmacySales = sum(finIn.filter((f) => String(f.category || "").toLowerCase().includes("pharm") || String(f.category || "").toLowerCase().includes("dorixona")), (f) => num(f.amount));

  // Vaqt qatori
  const series = buildSeries(range, [
    ...appts.map((a) => ({ date: a.appointment_date, value: isCompleted(a.status) ? num(a.total_price) : 0, count: 1 })),
    ...invIn.map((i) => ({ date: i.invoice_date || i.created_at, value: num(i.paid_amount), count: 0 })),
  ]);

  // Daromad manbalari
  const srcMap = new Map<string, number>();
  const addSrc = (k: string, v: number) => { if (v > 0) srcMap.set(k, (srcMap.get(k) || 0) + v); };
  appts.filter((a) => isCompleted(a.status)).forEach((a) => {
    const s = d.services.find((x) => x.id === a.service_id);
    addSrc(s?.name || "Konsultatsiya", num(a.total_price));
  });
  addSrc("Hisob-fakturalar", invoiceRevenue);
  addSrc("Laboratoriya", sum(finIn.filter((f) => String(f.category || "").toLowerCase().includes("lab")), (f) => num(f.amount)));
  addSrc("Dorixona", pharmacySales);
  addSrc("Telemeditsina", sum(d.telemed.filter((t) => inRange(t.created_at, range)), () => 0));
  addSrc("Boshqa daromad", Math.max(0, financeIncome - pharmacySales));
  const revenueSources = Array.from(srcMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  // Shifokorlar
  const reviewsByDoctor = new Map<string, any[]>();
  d.reviews.forEach((r) => {
    if (!r.doctor_id) return;
    reviewsByDoctor.set(r.doctor_id, [...(reviewsByDoctor.get(r.doctor_id) || []), r]);
  });
  const doctorRows: DoctorRow[] = d.doctors.map((doc) => {
    const rows = appts.filter((a) => a.doctor_id === doc.id);
    const done = rows.filter((a) => isCompleted(a.status));
    const revenue = sum(done, (a) => num(a.total_price));
    const pts = new Set(rows.map((a) => a.patient_id).filter(Boolean));
    const repeat = Array.from(pts).filter((p) => (apptCountByPatient.get(p as string) || 0) > 1).length;
    const rv = reviewsByDoctor.get(doc.id) || [];
    return {
      id: doc.id,
      name: doc.full_name || "Noma'lum",
      specialty: doc.specialty || "—",
      appts: rows.length,
      completed: done.length,
      cancelled: rows.filter((a) => isCancelled(a.status)).length,
      noShow: rows.filter((a) => isNoShow(a.status)).length,
      patients: pts.size,
      revenue,
      avgCheck: done.length ? Math.round(revenue / done.length) : 0,
      rating: rv.length ? round(sum(rv, (r) => num(r.rating)) / rv.length, 2) : num(doc.avg_rating),
      reviews: rv.length || num(doc.review_count),
      utilization: round(Math.min(100, (rows.length / Math.max(1, days * 16)) * 100)),
      repeatRate: pts.size ? round((repeat / pts.size) * 100) : 0,
      services: new Set(rows.map((a) => a.service_id).filter(Boolean)).size,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Bo'limlar
  const departmentRows: DepartmentRow[] = d.departments.map((dep) => {
    const depBeds = d.beds.filter((b) => b.department_id === dep.id);
    const depQueue = queueIn.filter((q) => q.department_id === dep.id);
    const depDoctorIds = new Set(depQueue.map((q) => q.doctor_id).filter(Boolean));
    const depAppts = appts.filter((a) => depDoctorIds.has(a.doctor_id));
    const revenue = sum(depAppts.filter((a) => isCompleted(a.status)), (a) => num(a.total_price)) +
      sum(depBeds, (b) => num(b.daily_rate));
    const exp = sum(finIn.filter((f) => String(f.description || "").includes(dep.name) && f.transaction_type === "expense"), (f) => num(f.amount));
    return {
      id: dep.id,
      name: dep.name,
      patients: new Set(depQueue.map((q) => q.patient_id).filter(Boolean)).size,
      queue: depQueue.length,
      beds: depBeds.length,
      occupied: depBeds.filter((b) => b.status === "occupied").length,
      occupancy: depBeds.length ? round((depBeds.filter((b) => b.status === "occupied").length / depBeds.length) * 100) : 0,
      doctors: depDoctorIds.size,
      revenue,
      expenses: exp,
      profit: revenue - exp,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Xizmatlar
  const serviceRows: ServiceRow[] = d.services.map((s) => {
    const rows = appts.filter((a) => a.service_id === s.id);
    const prevRows = prevAppts.filter((a) => a.service_id === s.id);
    const revenue = sum(rows.filter((a) => isCompleted(a.status)), (a) => num(a.total_price));
    return {
      id: s.id,
      name: s.name,
      count: rows.length,
      revenue,
      price: num(s.price),
      growth: delta(rows.length, prevRows.length),
      doctors: new Set(rows.map((a) => a.doctor_id).filter(Boolean)).size,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Radiologiya (lab buyurtmalari kategoriyasidan)
  const modalities = [
    { name: "MRT", keys: ["mrt", "mri"] },
    { name: "KT", keys: ["kt", "ct"] },
    { name: "Rentgen", keys: ["rentgen", "x-ray", "xray"] },
    { name: "UTT", keys: ["utt", "uzi", "ultra"] },
  ];
  const radiology = modalities.map((m) => {
    const rows = labIn.filter((l) => {
      const t = `${l.test_name || ""} ${l.test_category || ""}`.toLowerCase();
      return m.keys.some((k) => t.includes(k));
    });
    return { name: m.name, count: rows.length, revenue: 0 };
  });

  // Sug'urta
  const claims = d.insuranceClaims.filter((c) => inRange(c.created_at, range));
  const insurance = {
    total: claims.length,
    approved: claims.filter((c) => ["approved", "paid"].includes(String(c.status))).length,
    rejected: claims.filter((c) => String(c.status) === "rejected").length,
    paid: sum(claims, (c) => num(c.paid_amount)),
    outstanding: sum(claims, (c) => Math.max(0, num(c.approved_amount) - num(c.paid_amount))),
    companies: new Set(claims.map((c) => c.company_id).filter(Boolean)).size,
  };

  // AI
  const aiIn = d.aiUsage.filter((a) => inRange(a.used_at, range));
  const aiByService = new Map<string, number>();
  aiIn.forEach((a) => aiByService.set(a.service_id, (aiByService.get(a.service_id) || 0) + 1));
  const topAi = Array.from(aiByService.entries()).sort((a, b) => b[1] - a[1])[0];
  const ai = {
    requests: aiIn.length,
    credits: sum(aiIn, (a) => num(a.cost_credits)),
    topService: topAi?.[0] || "—",
    errors: aiIn.filter((a) => a.status && a.status !== "success").length,
  };

  // Marketing
  const mkIn = d.marketing.filter((m) => inRange(m.date || m.created_at, range));
  const impressions = sum(mkIn, (m) => num(m.impressions));
  const clicks = sum(mkIn, (m) => num(m.clicks));
  const marketing = {
    impressions,
    clicks,
    conversions: sum(mkIn, (m) => num(m.conversions)),
    ctr: impressions ? round((clicks / impressions) * 100, 2) : 0,
  };

  // Kanallar (qabul manbasi izohlaridan)
  const chMap = new Map<string, number>();
  appts.forEach((a) => {
    const raw = `${a.notes || ""}`.toLowerCase();
    const ch = raw.includes("hambi") ? "Hambi"
      : raw.includes("telegram") ? "Telegram"
      : raw.includes("instagram") ? "Instagram"
      : raw.includes("google") ? "Google"
      : raw.includes("referral") ? "Referral"
      : "MED1.UZ";
    chMap.set(ch, (chMap.get(ch) || 0) + 1);
  });
  const channels = Array.from(chMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Qoniqish
  const rv = d.reviews.filter((r) => inRange(r.created_at, range));
  const positive = rv.filter((r) => num(r.rating) >= 4).length;
  const negative = rv.filter((r) => num(r.rating) <= 2).length;
  const satisfaction = {
    avg: rv.length ? round(sum(rv, (r) => num(r.rating)) / rv.length, 2) : 0,
    nps: rv.length ? Math.round(((rv.filter((r) => num(r.rating) === 5).length - rv.filter((r) => num(r.rating) <= 3).length) / rv.length) * 100) : 0,
    total: rv.length,
    positive,
    negative,
    complaints: d.complaints.filter((c) => inRange(c.created_at, range)).length,
  };

  // No-show kesimlari
  const noShowByDoctor = doctorRows.filter((x) => x.noShow > 0).map((x) => ({ name: x.name, value: x.noShow })).slice(0, 8);
  const hourMap = new Map<string, number>();
  appts.filter((a) => isNoShow(a.status)).forEach((a) => {
    const h = String(a.appointment_time || "").slice(0, 2) || "—";
    hourMap.set(`${h}:00`, (hourMap.get(`${h}:00`) || 0) + 1);
  });
  const noShowByHour = Array.from(hourMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

  const dayMap = new Map<string, number[]>();
  queueIn.forEach((q) => {
    const dt = toDate(q.created_at);
    if (!dt) return;
    const k = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"][dt.getDay()];
    const c = dt.getTime();
    const called = toDate(q.called_at)?.getTime();
    const w = called && called > c ? (called - c) / 60000 : num(q.estimated_wait_minutes);
    if (w > 0) dayMap.set(k, [...(dayMap.get(k) || []), w]);
  });
  const waitByDay = Array.from(dayMap.entries()).map(([name, arr]) => ({ name, value: round(arr.reduce((a, b) => a + b, 0) / arr.length) }));

  // Heatmap: hafta kuni × soat bo'yicha qabullar
  const heatMap = new Map<string, number>();
  appts.forEach((a) => {
    const dt = toDate(a.appointment_date);
    const h = parseInt(String(a.appointment_time || "").slice(0, 2), 10);
    if (!dt || isNaN(h)) return;
    const k = `${dt.getDay()}-${h}`;
    heatMap.set(k, (heatMap.get(k) || 0) + 1);
  });
  const heatmap = Array.from(heatMap.entries()).map(([k, value]) => {
    const [day, hour] = k.split("-").map(Number);
    return { day, hour, value };
  });

  const noShowRate = appts.length ? round((noShow / appts.length) * 100) : 0;
  const revenueDelta = delta(grossRevenue, prevGross);

  // Alert Center
  const alerts: BIAlert[] = [];
  if (revenueDelta !== null && revenueDelta < -10) alerts.push({ level: "critical", title: "Daromad pasaydi", detail: `Oldingi davrga nisbatan ${round(revenueDelta)}%` });
  if (noShowRate > 10) alerts.push({ level: "warning", title: "No-show yuqori", detail: `${noShowRate}% qabul kelmagan` });
  if (doctorUtilization > 85) alerts.push({ level: "warning", title: "Shifokorlar yuklamasi yuqori", detail: `Bandlik ${doctorUtilization}%` });
  if (avgWaitMinutes > 30) alerts.push({ level: "critical", title: "Kutish vaqti oshdi", detail: `O'rtacha ${avgWaitMinutes} daqiqa` });
  if (outstanding > 0 && outstanding > grossRevenue * 0.2) alerts.push({ level: "critical", title: "Qarzdorlik oshdi", detail: `To'lanmagan: ${Math.round(outstanding).toLocaleString()} so'm` });
  const lowStock = d.pharmacy.filter((p) => num(p.quantity) <= 5).length;
  if (lowStock > 0) alerts.push({ level: "critical", title: "Ombor kritik darajada", detail: `${lowStock} ta mahsulot tugayapti` });
  const expiring = d.pharmacy.filter((p) => {
    const e = toDate(p.expire_date)?.getTime();
    return e && e - now.getTime() < 60 * 864e5;
  }).length;
  if (expiring > 0) alerts.push({ level: "warning", title: "Muddati yaqin mahsulotlar", detail: `${expiring} ta pozitsiya` });
  if (revenueDelta !== null && revenueDelta > 10) alerts.push({ level: "success", title: "Daromad o'smoqda", detail: `+${round(revenueDelta)}%` });

  return {
    range,
    grossRevenue, invoiceRevenue, appointmentRevenue, expenses,
    netRevenue: grossRevenue - expenses, outstanding, discounts, taxes, refunds,
    revenueDelta, prevGross,
    appts, prevAppts, apptDelta: delta(appts.length, prevAppts.length),
    completed, confirmed, pending, cancelled, noShow, noShowRate,
    uniquePatients: patientIds.size, newPatients, returningPatients, activePatients, dormantPatients, retention,
    avgWaitMinutes, maxWaitMinutes, avgDurationMinutes, doctorUtilization,
    bedOccupancy, bedsTotal, bedsOccupied, avgStayDays,
    labCount: labIn.length, labLate,
    labTurnaroundHours: labTurn.length ? round(labTurn.reduce((a, b) => a + b, 0) / labTurn.length) : 0,
    pharmacySales, pharmacyStockValue,
    series, revenueSources, doctorRows, departmentRows, serviceRows, radiology,
    insurance, ai, marketing, channels, satisfaction,
    noShowByDoctor, noShowByHour, waitByDay, heatmap, alerts,
  };
}
