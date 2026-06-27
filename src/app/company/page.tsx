import Link from "next/link";
import Image from "next/image";
import { Logo, LogoMark } from "@/components/logo";

export const metadata = {
  title: "Company — K.K. RYU",
  description: "K.K. RYU (株式会社RYU) is a Japanese software company building Pact — the simplest way to send a proposal, collect a signature, and get paid.",
};

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-gray-900 antialiased">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAFAF9]/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/company" className="text-gray-900 font-semibold">Company</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-[#0D3547] text-white relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[600px] font-bold leading-none select-none pointer-events-none" style={{ fontFamily: 'var(--font-noto-serif-jp), serif', color: 'white' }}>
            龍
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 flex flex-col md:flex-row items-center gap-16">
          {/* Logo mark */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <Image
                src="/ryu-mark.png"
                alt="龍 — RYU brush mark"
                width={400}
                height={270}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* Company name + tagline */}
          <div>
            <p className="text-sky-300 text-xs font-bold tracking-[0.2em] uppercase mb-4">株式会社 RYU</p>
            <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">K.K. RYU</h1>
            <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-lg">
              A Japanese software company building tools that make the business of doing business — signing, paying, moving forward — frictionless.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { ja: "勇", en: "BRAVE" },
                { ja: "険", en: "RISK" },
                { ja: "強", en: "STRENGTH" },
              ].map((v) => (
                <div key={v.en} className="flex items-center gap-2 border border-white/20 rounded-full px-4 py-2 bg-white/5">
                  <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}>{v.ja}</span>
                  <span className="text-white/80 text-xs font-bold tracking-widest">{v.en}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How we work ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-sky-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">How we work</p>
            <h2 className="text-4xl font-black text-gray-900">Three principles.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                ja: "勇",
                en: "Brave",
                body: "We build things that scare us a little — because that's the only way to make something that matters.",
              },
              {
                ja: "険",
                en: "Risk",
                body: "Calculated risk is a feature, not a bug. Every worthwhile product started as a bet someone was willing to make.",
              },
              {
                ja: "強",
                en: "Strength",
                body: "Quiet strength: reliable, well-made, and built to last. No noise. Just things that work.",
              },
            ].map((v) => (
              <div key={v.en} className="text-center">
                <div
                  className="text-[#0D3547] text-7xl mb-4 block"
                  style={{ fontFamily: 'var(--font-noto-serif-jp), serif', lineHeight: 1 }}
                >
                  {v.ja}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{v.en}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#F5F3EF]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-sky-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">Products</p>
            <h2 className="text-4xl font-black text-gray-900">What we build.</h2>
          </div>

          {/* Pact */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <LogoMark size={64} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-gray-900">Pact</h3>
                  <span className="text-xs bg-sky-100 text-sky-700 font-bold px-2.5 py-1 rounded-full">Live</span>
                </div>
                <p className="text-gray-500 mb-5 leading-relaxed">
                  Send your client one link — they read, sign, and pay. Pact combines proposals, e-signature, and Stripe payments into a single shareable URL. Built for freelancers, agencies, and landlords who want to close deals without juggling five tools.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Proposals", "E-signature", "Stripe payments", "Lease management", "Client portal"].map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-sky-100"
                >
                  Visit Pact →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0D3547]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sky-300 text-xs font-bold tracking-[0.2em] uppercase mb-4">Get in touch</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            We&apos;d love to hear from you.
          </h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Questions about Pact, partnership inquiries, or just want to say hello — reach out anytime.
          </p>
          <a
            href="mailto:use.pact.features@gmail.com"
            className="inline-flex items-center gap-3 bg-white text-[#0D3547] hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl"
          >
            <span></span>
            use.pact.features@gmail.com
          </a>
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
