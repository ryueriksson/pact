import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Return a JSON error response */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Return a JSON success response */
export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
