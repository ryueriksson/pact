import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",     icon: "⊞" },
  { href: "/proposals",      label: "Proposals",     icon: "📄" },
  { href: "/proposals/new",  label: "New Proposal",  icon: "✦"  },
  { href: "/settings",       label: "Settings",      icon: "⚙️" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const initials = session.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : session.user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-[#F6F5F8] flex">

      {/* ── Mobile nav (hamburger + drawer) ─────────────────── */}
      <MobileNav
        initials={initials}
        name={session.user?.name ?? ""}
        email={session.user?.email ?? ""}
      />

      {/* ── Sidebar (desktop only) ───────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col fixed h-full shadow-sm">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <LogoMark size={32} />
            <span className="font-black text-lg text-gray-900 tracking-tight">Pact</span>
          </Link>
        </div>

        {/* New proposal CTA */}
        <div className="px-4 py-4">
          <Link
            href="/proposals/new"
            className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-violet-100"
          >
            <span className="text-base leading-none">+</span> New Proposal
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-violet-50 hover:text-violet-700 font-medium transition-all group"
            >
              <span className="w-5 text-center text-base opacity-60 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{session.user?.name ?? "Account"}</p>
              <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full mt-1 text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 min-h-screen pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
