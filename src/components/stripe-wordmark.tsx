type Props = {
  /** Purple on light backgrounds; white on dark/colored backgrounds */
  variant?: "color" | "white";
  height?: number;
  className?: string;
};

/** Official Stripe wordmark — fixed aspect ratio so it never squishes in flex layouts. */
export function StripeWordmark({ variant = "color", height = 22, className = "" }: Props) {
  const src = variant === "white" ? "/stripe-wordmark-white.svg" : "/stripe-wordmark.svg";
  const width = Math.round(height * 2.4);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={`block flex-shrink-0 ${className}`}
      style={{ width, height, minWidth: width }}
    />
  );
}
