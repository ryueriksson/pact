import { z } from "zod";

const businessCategorySchema = z.enum(["FREELANCER", "LANDLORD", "AGENCY"]);

/** Strong password: 12+ chars with at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email").max(254),
  password: passwordSchema,
  businessCategory: businessCategorySchema,
});

export const changePasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset link is invalid"),
  password: passwordSchema,
});

// ─── Proposals ────────────────────────────────────────────────────────────────

export const sectionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["TEXT", "PRICING", "IMAGE", "DIVIDER", "HEADING"]),
  order: z.number().int().min(0),
  content: z.record(z.unknown()),
});

export const createProposalSchema = z.object({
  title: z.string().min(2, "Title required").max(120),
  clientName: z.string().min(2, "Client name required").max(100),
  clientEmail: z.string().email("Valid client email required"),
  depositAmount: z.number().int().min(100).optional(), // min $1.00
  currency: z.string().length(3).default("usd"),
  contractBody: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
});

export const updateProposalSchema = createProposalSchema.partial();

// ─── Client Actions ───────────────────────────────────────────────────────────

export const signContractSchema = z.object({
  signerName: z.string().min(2, "Full name required"),
  signerEmail: z.string().email("Valid email required"),
  signatureData: z.string().min(1, "Signature required"), // base64 PNG
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type SignContractInput = z.infer<typeof signContractSchema>;
