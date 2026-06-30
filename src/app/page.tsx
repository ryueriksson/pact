import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-gray-900 antialiased">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAFAF9]/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/company" className="hover:text-gray-900 transition-colors">Company</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-sky-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute -bottom-20 -left-32 w-[500px] h-[500px] bg-sky-200 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
            Built for freelancers, landlords & agencies
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 mb-6 leading-[1.08]">
            Close deals with
            <span className="relative ml-3">
              <span className="relative z-10 text-sky-600">one link.</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 9C60 3 120 1 150 2C180 3 240 7 298 9" stroke="#BAE6FD" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop juggling DocuSign, spreadsheets, and payment apps.
            Send one link — clients sign proposals and pay deposits, tenants sign leases and set up rent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5"
            >
              Start for free →
            </Link>
            <span className="text-sm text-gray-400">No credit card required · Free forever plan</span>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="relative max-w-3xl mx-auto px-6 mt-16">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
                pact.so/p/abc123xyz
              </div>
            </div>
            {/* Mockup content */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Brand Identity Project</h3>
                  <p className="text-sm text-gray-400">Prepared for Acme Corp</p>
                </div>
                <div className="flex gap-2">
                  {["Review","Sign","Pay"].map((s, i) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${i === 0 ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-400"}`}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded-full w-full" />
                <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                <div className="h-3 bg-gray-100 rounded-full w-3/5" />
              </div>
              <div className="mt-6 p-4 bg-sky-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-sky-500 font-medium">Deposit due</p>
                  <p className="text-2xl font-black text-sky-700">$1,500</p>
                </div>
                <div className="bg-sky-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md shadow-sky-200">
                  Review & Sign →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / Social proof ─────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
            Built for independent professionals
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-40 grayscale">
            {["Designer", "Developer", "Landlord", "Consultant", "Agency", "Property manager"].map((role) => (
              <span key={role} className="text-sm font-bold text-gray-600 tracking-tight">{role}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Everything you need to close deals & manage leases
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Proposals for freelancers. Leases, deposits, and recurring rent for landlords. One platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: "bg-sky-50 border-sky-100",
                iconBg: "bg-sky-100",
                title: "Proposals & leases",
                desc: "Freelancers build polished proposals. Landlords upload lease PDFs or use built-in templates — all in one place.",
              },
              {
                color: "bg-sky-50 border-sky-100",
                iconBg: "bg-sky-100",
                title: "Built-in e-signature",
                desc: "Clients and tenants sign directly in their browser. Timestamp, IP address, and signature captured automatically.",
              },
              {
                color: "bg-sky-50 border-sky-100",
                iconBg: "bg-sky-100",
                title: "Stripe payments",
                desc: "Collect proposal deposits or lease security deposits. Landlords can set up automatic monthly rent collection via Stripe.",
              },
              {
                color: "bg-fuchsia-50 border-fuchsia-100",
                iconBg: "bg-fuchsia-100",
                title: "One shareable link",
                desc: "One link per proposal or lease — review, sign, pay. No logins required for clients or tenants.",
              },
              {
                color: "bg-blue-50 border-blue-100",
                iconBg: "bg-blue-100",
                title: "Automatic notifications",
                desc: "Get notified when someone views, signs, or pays. Know exactly where every deal and lease stands.",
              },
              {
                color: "bg-emerald-50 border-emerald-100",
                iconBg: "bg-emerald-100",
                title: "Unified dashboard",
                desc: "Track proposals and leases — draft, sent, signed, paid, active — with full payment history in one view.",
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-2xl border p-6 ${f.color}`}>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              From quote to cash — or lease to rent
            </h2>
            <p className="text-gray-500 text-lg">Three steps. Works for clients and tenants alike.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-sky-200 via-sky-200 to-purple-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  step: "01",
                  title: "Create your document",
                  desc: "Build a proposal with pricing, or set up a lease with rent, deposit, and dates.",
                  color: "bg-sky-600",
                },
                {
                  step: "02",
                  title: "Send one link",
                  desc: "Your client or tenant gets an email with a single link. No account required on their end.",
                  color: "bg-sky-700",
                },
                {
                  step: "03",
                  title: "Sign & get paid",
                  desc: "They review, sign, and pay — deposit for proposals, deposit + recurring rent for leases.",
                  color: "bg-purple-600",
                },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className={`w-16 h-16 ${s.color} text-white rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-5 shadow-lg`}>
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</div>
              <div className="text-5xl font-black text-gray-900 mb-1">$0</div>
              <div className="text-sm text-gray-400 mb-8">Forever free</div>
              <ul className="space-y-3 mb-8">
                {[
                  "3 proposals or leases per month",
                  "E-signature included",
                  "Payment collection (1% fee)",
                  "Email notifications",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs flex-shrink-0">+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center border-2 border-gray-200 text-gray-700 hover:border-sky-300 hover:text-sky-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-sky-600 border-2 border-sky-600 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most popular
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

              <div className="relative">
                <div className="text-xs font-bold text-sky-200 uppercase tracking-widest mb-3">Pro</div>
                <div className="text-5xl font-black text-white mb-1">$29</div>
                <div className="text-sm text-sky-200 mb-8">per month</div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited proposals & leases",
                    "Custom contract templates",
                    "No transaction fees",
                    "Recurring rent collection",
                    "Priority support",
                    "Team members (coming soon)",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-sky-100">
                      <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">+</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center bg-white text-sky-700 hover:bg-sky-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include SSL security, automatic backups, and 99.9% uptime.
          </p>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-sky-600 to-sky-700 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to simplify proposals & leases?
            </h2>
            <p className="text-sky-200 text-lg mb-8">
              Join freelancers, landlords, and agencies who get paid faster with Pact.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-sky-700 hover:bg-sky-50 px-10 py-4 rounded-xl font-black text-lg transition-all shadow-2xl"
            >
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Logo />
            <p className="text-xs text-gray-400 mt-1">
              Powered by{" "}
              <Link href="/company" className="hover:text-gray-600 transition-colors font-medium">
                K.K. RYU
              </Link>
              {" "}· 株式会社RYU
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <a href="mailto:use.pact.features@gmail.com" className="hover:text-gray-600 transition-colors">Support</a>
            <Link href="/company" className="hover:text-gray-600 transition-colors">Company</Link>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} 株式会社RYU
          </p>
        </div>
      </footer>

    </div>
  );
}
