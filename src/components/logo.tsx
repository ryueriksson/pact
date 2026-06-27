import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="#0284C7" />
      {/* Letter P stem */}
      <path
        d="M12 30V11H20.5C24.09 11 27 13.91 27 17.5C27 21.09 24.09 24 20.5 24H12"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Signature flourish */}
      <path
        d="M14 30 Q20 26 28 29"
        stroke="#BAE6FD"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 group ${className}`.trim()}>
      <LogoMark size={36} />
      <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-sky-700 transition-colors">
        Pact
      </span>
    </Link>
  );
}

export function LogoWhite({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark size={36} />
      <span className="font-bold text-xl tracking-tight text-white">Pact</span>
    </Link>
  );
}
