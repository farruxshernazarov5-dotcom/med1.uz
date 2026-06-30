/**
 * /admin/hambi-readiness — Standalone "HAMBI Integration Ready" gate.
 * Wraps the existing IntegrationAuditModule and shows the final readiness verdict.
 */
import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";

const IntegrationAuditModule = lazy(
  () => import("@/components/admin/hambi/IntegrationAuditModule"),
);

export default function HambiReadinessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>HAMBI Integration Readiness · MED1.UZ Admin</title>
        <meta
          name="description"
          content="Real-time HAMBI × MED1.UZ integration readiness check across API, AI, payments, webhooks and security."
        />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">
            Enterprise Integration
          </p>
          <h1 className="mt-1 text-3xl font-semibold">
            HAMBI Integration Readiness
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Avtomatik audit — 20+ checkpoint bo'yicha API, AI, to'lov, webhook,
            xavfsizlik va hujjatlar holatini real-time tekshiradi. Hammasi yashil
            bo'lganda <span className="text-emerald-300">HAMBI Integration Ready</span>{" "}
            statusi chiqadi.
          </p>
        </header>
        <Suspense
          fallback={
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              Audit ishga tushirilmoqda…
            </div>
          }
        >
          <IntegrationAuditModule />
        </Suspense>
      </div>
    </div>
  );
}
