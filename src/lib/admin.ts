import { requireUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-access";

export { getAdminEmails, isAdminEmail } from "@/lib/admin-access";

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) {
    throw new Error("Forbidden");
  }
  return user;
}
