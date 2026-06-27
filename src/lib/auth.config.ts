import type { NextAuthConfig } from "next-auth";
import type { BusinessCategory } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";

/** Edge-safe auth config — no Prisma or Node-only imports */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh session daily when active
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        if (user.businessCategory !== undefined) {
          token.businessCategory = user.businessCategory;
        }
      } else if (trigger === "update" && session && "businessCategory" in session) {
        token.businessCategory = session.businessCategory;
      }
      return token;
    },
    async session({ session, token, trigger, newSession }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.businessCategory =
          (token.businessCategory as BusinessCategory | undefined) ?? null;
        session.user.isEmailVerified = !!token.isEmailVerified;
      }
      if (trigger === "update" && newSession && "businessCategory" in newSession) {
        session.user.businessCategory = newSession.businessCategory;
      }
      if (trigger === "update" && newSession && "isEmailVerified" in newSession) {
        session.user.isEmailVerified = !!newSession.isEmailVerified;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
