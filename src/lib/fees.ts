/** User-facing copy for payout fees on rent/deposits */
export function getLeasePayoutFeeMessage(monthlyRent: string, isPro: boolean): string {
  const amount = parseFloat(monthlyRent || "0").toLocaleString();
  const rentLine = `Tenant pays $${amount}/month.`;

  if (isPro) {
    return `${rentLine} No Pact fee on Pro — only Stripe's processing fee (~2.9% + 30¢ for cards) is deducted from each payout.`;
  }

  return `${rentLine} Pact's 1% platform fee plus Stripe's processing fee (~2.9% + 30¢ for cards) are deducted from each payout.`;
}
