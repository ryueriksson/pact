import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { ConnectStripeButton } from "@/components/connect-stripe-button";
import { ChangeBusinessCategoryForm } from "@/components/change-business-category-form";
import { ManageBillingButton } from "@/components/manage-billing-button";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { stripe?: string; error?: string; upgrade?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      plan: true,
      stripeCustomerId: true,
      stripeConnectId: true,
      stripeConnectOnboarded: true,
      businessCategory: true,
    },
  });

  if (!user) redirect("/login");
  if (!user.businessCategory) redirect("/onboarding");

  const isPro = user.plan === "PRO";
  const isConnected = !!user.stripeConnectId && user.stripeConnectOnboarded;
  const isPending   = !!user.stripeConnectId && !user.stripeConnectOnboarded;
  const stripeConfigured = isStripeConfigured();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and payout details.</p>
      </div>

      {/* Status banners */}
      {searchParams.upgrade === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          Welcome to Pro! Transaction fees are now waived on all your deals.
        </div>
      )}
      {searchParams.stripe === "connected" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          Stripe connected successfully! You can now receive payments directly.
        </div>
      )}
      {searchParams.stripe === "incomplete" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          Stripe onboarding isn&apos;t complete yet. Finish setup to start receiving payments.
        </div>
      )}
      {searchParams.error === "stripe_not_configured" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          Stripe is not configured on this server. Add <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> to your <code className="font-mono text-xs">.env</code> and restart the dev server.
        </div>
      )}
      {searchParams.error && searchParams.error !== "stripe_not_configured" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          Something went wrong connecting Stripe. Please try again.
        </div>
      )}

      {/* Account */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Account</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Name</p>
              <p className="text-sm text-gray-500 mt-0.5">{user.name ?? "—"}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Email</p>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Plan</p>
              <p className="text-sm text-gray-500 mt-0.5">{user.plan}</p>
            </div>
            {user.plan === "FREE" && (
              <a
                href="/upgrade"
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
              >
                Upgrade to Pro →
              </a>
            )}
            {user.plan === "PRO" && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-semibold">
                  Pro
                </span>
                {user.stripeCustomerId && <ManageBillingButton />}
              </div>
            )}
          </div>
          <ChangeBusinessCategoryForm currentCategory={user.businessCategory} />
        </div>
      </div>

      {/* Stripe Connect — Payouts */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Payouts</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Connect your Stripe account to receive deposits and rent directly.
            </p>
          </div>
          {/* Stripe logo */}
          <svg className="flex-shrink-0" width="52" height="22" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.23c0-1.85-1.07-2.58-2.06-2.58zM40.69 20.3c-1.96 0-3.96-.54-4.96-1.09l.07-3.36c1.11.63 2.6 1.13 4.34 1.13 1.36 0 2.02-.55 2.02-1.4 0-.93-.74-1.4-2.46-1.96-2.95-.94-4.54-2.41-4.54-4.87 0-2.72 2.2-4.87 5.88-4.87 1.86 0 3.29.35 4.26.84v3.31c-.87-.54-2.23-1.04-3.88-1.04-1.19 0-1.81.52-1.81 1.29 0 .81.69 1.19 2.41 1.81 2.98 1.02 4.63 2.5 4.63 4.99-.01 2.76-2.12 5.22-5.96 5.22zm-15.05-.09V5.53l4.31-.01v14.69h-4.31zm.15-16.51a2.32 2.32 0 0 1 0-4.64 2.32 2.32 0 0 1 0 4.64zM19.5 20.21l-.09-1.67c-.93 1.2-2.3 1.87-4.15 1.87-3.41 0-5.99-2.89-5.99-7.39 0-4.81 2.6-7.61 6.1-7.61 1.64 0 2.9.6 3.84 1.63V.14h4.31v20.07H19.5zm-.29-9.92c-.56-.7-1.38-1.15-2.38-1.15-1.69 0-2.86 1.36-2.86 3.55 0 2.17 1.15 3.55 2.86 3.55 1 0 1.82-.46 2.38-1.16v-4.79zM6.41 20.21l-.09-1.96c-.95 1.33-2.35 2.16-4.34 2.16C.79 20.41 0 19.23 0 17.75c0-2.64 2.07-4.15 6.54-4.15h.94v-.51c0-1.32-.51-1.93-2.1-1.93-1.33 0-2.73.48-3.79 1.09l.06-3.37A10.03 10.03 0 0 1 6.29 7.9c3.56 0 5.43 1.64 5.43 4.88v7.43H6.41zm-.33-5.02c-2.17 0-2.91.68-2.91 1.66 0 .74.47 1.22 1.34 1.22 1 0 1.57-.73 1.57-1.92v-.96z" fill="#635BFF"/>
          </svg>
        </div>

        <div className="px-6 py-6">
          {!stripeConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-5">
              Stripe payouts are not available until <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> is set in your environment.
            </div>
          )}

          {isConnected ? (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-bold uppercase tracking-wide">Connected</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Stripe account connected</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Account ID: <span className="font-mono">{user.stripeConnectId}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Platform fee</span>
                  <span className="font-semibold text-gray-900">
                    {isPro ? "Waived on Pro" : "1% per transaction"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payout schedule</span>
                  <span className="font-semibold text-gray-900">Daily</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Stripe processing fee</span>
                  <span className="font-semibold text-gray-900">2.9% + 30¢ (card) · 0.8% capped $5 (ACH)</span>
                </div>
              </div>

              <ConnectStripeButton isConnected={true} disabled={!stripeConfigured} />
            </div>
          ) : isPending ? (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-amber-600 text-sm font-bold uppercase tracking-wide">Pending</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Onboarding incomplete</p>
                  <p className="text-xs text-gray-400 mt-0.5">Finish setup to start receiving payments.</p>
                </div>
              </div>
              <ConnectStripeButton isConnected={false} isPending={true} disabled={!stripeConfigured} />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { title: "Instant setup", desc: "2 min onboarding via Stripe" },
                  { title: "Direct payouts", desc: "Money goes straight to your bank" },
                  { title: "Card or ACH", desc: "Tenants choose how to pay" },
                ].map((f) => (
                  <div key={f.title} className="bg-gray-50 rounded-xl p-4 text-center">                    <p className="text-xs font-bold text-gray-800">{f.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-sky-700 leading-relaxed">
                  <strong>How it works:</strong> When a tenant or client pays through their link,
                  the money goes directly to your Stripe account.
                  {isPro
                    ? " On Pro, Pact does not charge a platform fee — only Stripe processing applies."
                    : " Pact takes a 1% platform fee. Stripe charges 2.9% + 30¢ for cards or 0.8% (max $5) for ACH bank transfers."}
                </p>
              </div>

              <ConnectStripeButton isConnected={false} disabled={!stripeConfigured} />
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <h2 className="font-bold text-red-600">Danger zone</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Delete account</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Permanently delete your account and all data. Cannot be undone.
            </p>
          </div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
