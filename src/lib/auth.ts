import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { canAccessLeases, canAccessProposals } from "@/lib/business-categories";
import { authConfig } from "@/lib/auth.config";

async function loadBusinessCategory(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessCategory: true },
  });
  return user?.businessCategory ?? null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            businessCategory: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const passwordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          businessCategory: user.businessCategory,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const baseToken = await authConfig.callbacks.jwt({ token, user, trigger, session });

      if (user?.id && user.businessCategory === undefined) {
        baseToken.businessCategory = await loadBusinessCategory(user.id);
      }

      return baseToken;
    },
  },
});

/** Helper: get current session user or throw */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user as { id: string; email: string; name?: string | null };
}

/** Helper: get current user record from the database */
export async function requireUser() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      businessCategory: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/** Helper: require user with proposal feature access */
export async function requireProposalAccess() {
  const user = await requireUser();
  if (!canAccessProposals(user.businessCategory)) {
    throw new Error("Forbidden");
  }
  return user;
}

/** Helper: require user with lease feature access */
export async function requireLeaseAccess() {
  const user = await requireUser();
  if (!canAccessLeases(user.businessCategory)) {
    throw new Error("Forbidden");
  }
  return user;
}
