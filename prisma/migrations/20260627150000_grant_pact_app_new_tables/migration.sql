-- Ensure pact_app can access tables created after the initial security grant.
GRANT ALL ON ALL TABLES IN SCHEMA public TO pact_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO pact_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pact_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pact_app;
