import type { NextAuthConfig } from "next-auth";
import type { BusinessCategory } from "@prisma/client";

/** Edge-safe auth config — no Prisma or Node-only imports */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
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
      }
      if (trigger === "update" && newSession && "businessCategory" in newSession) {
        session.user.businessCategory = newSession.businessCategory;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
