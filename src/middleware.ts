import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  canAccessLeases,
  canAccessProposals,
} from "@/lib/business-categories";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const category = req.auth?.user?.businessCategory ?? null;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/leases") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    req.auth &&
    (pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname === "/change-password")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const emailVerified = req.auth?.user?.isEmailVerified;
  if (
    req.auth &&
    emailVerified === false &&
    isProtected &&
    pathname !== "/verify-email"
  ) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }

  if (req.auth && pathname === "/verify-email" && emailVerified === true) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (req.auth && !category && pathname !== "/onboarding" && isProtected) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (req.auth && category && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (req.auth && category) {
    if (pathname.startsWith("/proposals") && !canAccessProposals(category)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/leases") && !canAccessLeases(category)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|p/|l/).*)",
  ],
};
