import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F5F8] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <LogoMark size={56} />
          </div>
        </div>

        <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-3">Error 404</p>
        <h1 className="text-4xl font-black text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-2">
          This page doesn&apos;t exist, the link has expired, or you don&apos;t have access.
        </p>
        <p className="text-gray-400 text-sm mb-10">
          If you&apos;re looking for a proposal or lease link, ask the sender to share it again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-sky-100"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl font-bold text-sm transition-colors text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
