import Link from "next/link";

const PACT_BLUE = "#0284C7";
const PACT_BLUE_LIGHT = "#BAE6FD";

function PactIcon({
  size = 20,
  stem = "white",
  flourish = PACT_BLUE_LIGHT,
  strokeWidth = 2.8,
}: {
  size?: number;
  stem?: string;
  flourish?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 30V11H20.5C24.09 11 27 13.91 27 17.5C27 21.09 24.09 24 20.5 24H12"
        stroke={stem}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 30 Q20 26 28 29"
        stroke={flourish}
        strokeWidth={strokeWidth * 0.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill={PACT_BLUE} />
      <path
        d="M12 30V11H20.5C24.09 11 27 13.91 27 17.5C27 21.09 24.09 24 20.5 24H12"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 30 Q20 26 28 29"
        stroke={PACT_BLUE_LIGHT}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoMarkOnDark({ size = 36 }: { size?: number }) {
  const iconSize = Math.round(size * 0.55);

  return (
    <div
      className="flex items-center justify-center rounded-xl bg-white/20"
      style={{ width: size, height: size }}
    >
      <PactIcon size={iconSize} strokeWidth={3} />
    </div>
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
      <LogoMarkOnDark size={36} />
      <span className="font-bold text-xl tracking-tight text-white">Pact</span>
    </Link>
  );
}
