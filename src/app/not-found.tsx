import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F5F8] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <LogoMark size={48} />
        </div>
        <h1 className="text-6xl font-black text-gray-900 mb-3">404</h1>
        <p className="text-gray-500 text-lg mb-8">
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-violet-100"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
