import type { BusinessCategory } from "@prisma/client";

export type BusinessCategoryOption = {
  value: BusinessCategory;
  label: string;
  description: string;
  examples: string;
  icon: string;
};

export const BUSINESS_CATEGORIES: BusinessCategoryOption[] = [
  {
    value: "FREELANCER",
    label: "Freelancer or consultant",
    description: "Send proposals, get contracts signed, and collect deposits.",
    examples: "Photographers, designers, developers, writers, coaches",
    icon: "📸",
  },
  {
    value: "AGENCY",
    label: "Agency or studio",
    description: "Manage client proposals and payments for your team.",
    examples: "Creative agencies, dev shops, marketing studios",
    icon: "🏢",
  },
  {
    value: "LANDLORD",
    label: "Landlord or property manager",
    description: "Send leases, collect signatures, deposits, and monthly rent.",
    examples: "Homeowners, landlords, property managers",
    icon: "🏠",
  },
];

export function canAccessProposals(category: BusinessCategory | null | undefined) {
  return category === "FREELANCER" || category === "AGENCY";
}

export function canAccessLeases(category: BusinessCategory | null | undefined) {
  return category === "LANDLORD";
}

export function getPrimaryCreateHref(category: BusinessCategory | null | undefined) {
  if (canAccessLeases(category)) return "/leases/new";
  return "/proposals/new";
}

export function getNavItems(category: BusinessCategory | null | undefined) {
  const items = [{ href: "/dashboard", label: "Dashboard", icon: "⊞" }];

  if (canAccessProposals(category)) {
    items.push(
      { href: "/proposals", label: "Proposals", icon: "📄" },
      { href: "/proposals/new", label: "New Proposal", icon: "✦" },
    );
  }

  if (canAccessLeases(category)) {
    items.push(
      { href: "/leases", label: "Leases", icon: "🏠" },
      { href: "/leases/new", label: "New Lease", icon: "🔑" },
    );
  }

  items.push({ href: "/settings", label: "Settings", icon: "⚙️" });
  return items;
}

export function getCategoryLabel(category: BusinessCategory | null | undefined) {
  return BUSINESS_CATEGORIES.find((c) => c.value === category)?.label ?? "Not set";
}
