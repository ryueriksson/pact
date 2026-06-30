import { requireUser, signOut } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import {
  canAccessLeases,
  getNavItems,
  getPrimaryCreateHref,
} from "@/lib/business-categories";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = isAdminEmail(user.email);
  if (!user.businessCategory && !isAdmin) redirect("/onboarding");

  const nav = getNavItems(user.businessCategory);
  if (isAdmin) {
    nav.splice(nav.length - 1, 0, { href: "/admin", label: "Admin" });
  }
  const createHref = getPrimaryCreateHref(user.businessCategory);
  const createLabel = canAccessLeases(user.businessCategory) ? "New Lease" : "New Proposal";

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-[#F6F5F8] flex">
      <MobileNav
        initials={initials}
        name={user.name ?? ""}
        email={user.email ?? ""}
        nav={nav}
        createHref={createHref}
        createLabel={createLabel}
      />

      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col fixed h-full shadow-sm">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <LogoMark size={32} />
            <span className="font-black text-lg text-gray-900 tracking-tight">Pact</span>
          </Link>
        </div>

        <div className="px-4 py-4">
          <Link
            href={createHref}
            className="flex items-center justify-center gap-2 w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-sky-100"
          >
            <span className="text-base leading-none">+</span> {createLabel}
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-sky-50 hover:text-sky-700 font-medium transition-all group"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name ?? "Account"}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
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

      <main className="flex-1 md:ml-60 min-h-screen pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
