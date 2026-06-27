import type { BusinessCategory } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    businessCategory?: BusinessCategory | null;
    isEmailVerified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      businessCategory: BusinessCategory | null;
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    businessCategory?: BusinessCategory | null;
    isEmailVerified?: boolean;
  }
}
