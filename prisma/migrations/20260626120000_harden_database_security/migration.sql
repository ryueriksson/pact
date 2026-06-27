-- Harden database security for Prisma-only access via pact_app.
-- Blocks Supabase PostgREST (anon/authenticated) from reading app tables.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProposalSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeaseContract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeasePayment" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Proposal" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ProposalSection" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Contract" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Payment" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Account" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Session" FROM anon, authenticated;
REVOKE ALL ON TABLE public."VerificationToken" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Lease" FROM anon, authenticated;
REVOKE ALL ON TABLE public."LeaseContract" FROM anon, authenticated;
REVOKE ALL ON TABLE public."LeasePayment" FROM anon, authenticated;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM anon, authenticated;

ALTER ROLE pact_app BYPASSRLS;

GRANT ALL ON ALL TABLES IN SCHEMA public TO pact_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO pact_app;
