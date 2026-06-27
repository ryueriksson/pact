import type { BusinessCategory } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    businessCategory?: BusinessCategory | null;
  }

  interface Session {
    user: {
      id: string;
      businessCategory: BusinessCategory | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    businessCategory?: BusinessCategory | null;
  }
}
