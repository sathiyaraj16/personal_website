-- ==============================================================================
-- NEXA Enterprise Productivity Workspace - Final Security Audit Remediation
-- Version: 2026-10-31 (Zero-Trust Key Continuity & Anti-Lockout-Bypass Migration)
-- Tables: public.locker_vaults, public.locker_documents, public.locker_audit_logs,
--         public.locker_auth_challenges
-- Storage: storage.buckets ('secure-locker') & storage.objects RLS
-- RPCs: public.get_locker_auth_challenge_rpc, public.verify_locker_passphrase_rpc,
--       public.change_locker_passphrase_rpc, public.recover_locker_vault_rpc,
--       public.reset_locker_vault_rpc, public.constant_time_equals
-- ==============================================================================

-- 0. Ensure pgcrypto extension is installed in schema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==============================================================================
-- 1. Table Definitions
-- ==============================================================================

-- 1.1 locker_vaults
CREATE TABLE IF NOT EXISTS public.locker_vaults (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_salt TEXT NOT NULL,
  auth_verifier TEXT NOT NULL,
  kek_salt TEXT NOT NULL,
  recovery_salt TEXT NOT NULL,
  recovery_verifier TEXT NOT NULL,
  encrypted_master_recovery_key TEXT NOT NULL,
  recovery_nonce TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  auto_lock_minutes INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.locker_vaults ENABLE ROW LEVEL SECURITY;

-- 1.2 locker_documents
CREATE TABLE IF NOT EXISTS public.locker_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  encrypted_dek TEXT NOT NULL,
  dek_nonce TEXT NOT NULL,
  data_nonce TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'document' CHECK (category IN ('document', 'credential', 'recovery_phrase', 'identity')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locker_docs_user_id ON public.locker_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_locker_docs_category ON public.locker_documents(category);
CREATE INDEX IF NOT EXISTS idx_locker_docs_created_at ON public.locker_documents(created_at DESC);

ALTER TABLE public.locker_documents ENABLE ROW LEVEL SECURITY;

-- 1.3 locker_audit_logs (Immutable append-only audit trail)
CREATE TABLE IF NOT EXISTS public.locker_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'BLOCKED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locker_audit_user_id ON public.locker_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_locker_audit_created_at ON public.locker_audit_logs(created_at DESC);

ALTER TABLE public.locker_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1.4 locker_auth_challenges (Single-use ephemeral challenges for replay prevention)
CREATE TABLE IF NOT EXISTS public.locker_auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locker_challenges_user_nonce ON public.locker_auth_challenges(user_id, challenge_nonce);

ALTER TABLE public.locker_auth_challenges ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Granular Database Table & Column Permissions
-- ==============================================================================

-- Revoke all default public/anon access
REVOKE ALL ON public.locker_vaults FROM PUBLIC, anon;
REVOKE ALL ON public.locker_documents FROM PUBLIC, anon;
REVOKE ALL ON public.locker_audit_logs FROM PUBLIC, anon;
REVOKE ALL ON public.locker_auth_challenges FROM PUBLIC, anon, authenticated;

-- Column-level permissions on locker_vaults:
-- Explicitly exclude auth_verifier and recovery_verifier from SELECT queries
REVOKE ALL ON public.locker_vaults FROM authenticated;
GRANT SELECT (
  user_id,
  auth_salt,
  kek_salt,
  recovery_salt,
  encrypted_master_recovery_key,
  recovery_nonce,
  failed_attempts,
  locked_until,
  auto_lock_minutes,
  created_at,
  updated_at
) ON public.locker_vaults TO authenticated;

-- Allow initial vault setup
GRANT INSERT ON public.locker_vaults TO authenticated;

-- Prevent direct client tampering of failed_attempts, locked_until, or verifiers
GRANT UPDATE (auto_lock_minutes, updated_at) ON public.locker_vaults TO authenticated;

-- CRITICAL FIX 1: Direct DELETE on locker_vaults is STRICTLY REVOKED for all non-superusers!
-- Authenticated users CANNOT delete their vault directly to reset failed_attempts or bypass lockout!
REVOKE DELETE ON public.locker_vaults FROM PUBLIC, anon, authenticated;

-- Permissions on locker_documents: Full user CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locker_documents TO authenticated;

-- Permissions on locker_audit_logs: STRICT APPEND-ONLY (No UPDATE, No DELETE, No TRUNCATE)
GRANT SELECT, INSERT ON public.locker_audit_logs TO authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.locker_audit_logs FROM authenticated;

-- ==============================================================================
-- 3. Row Level Security Policies
-- ==============================================================================

-- 3.1 locker_vaults Policies
DROP POLICY IF EXISTS "Users can view their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can view their own locker vault"
  ON public.locker_vaults FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can insert their own locker vault"
  ON public.locker_vaults FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locker vault" ON public.locker_vaults;
DROP POLICY IF EXISTS "Users can update non-sensitive locker vault settings" ON public.locker_vaults;
CREATE POLICY "Users can update non-sensitive locker vault settings"
  ON public.locker_vaults FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop any previous direct DELETE policies on locker_vaults
DROP POLICY IF EXISTS "Users can delete their own locker vault" ON public.locker_vaults;

-- 3.2 locker_documents Policies
DROP POLICY IF EXISTS "Users can view their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can view their own locker documents"
  ON public.locker_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can insert their own locker documents"
  ON public.locker_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can update their own locker documents"
  ON public.locker_documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can delete their own locker documents"
  ON public.locker_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3.3 locker_audit_logs Policies (Append-only: SELECT & INSERT only, NO UPDATE or DELETE)
DROP POLICY IF EXISTS "Users can view their own locker audit logs" ON public.locker_audit_logs;
CREATE POLICY "Users can view their own locker audit logs"
  ON public.locker_audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker audit logs" ON public.locker_audit_logs;
CREATE POLICY "Users can insert their own locker audit logs"
  ON public.locker_audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. Storage Configuration & Storage RLS Policies
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('secure-locker', 'secure-locker', false, 52428800, null)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own encrypted files in secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own encrypted files in secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own encrypted files in secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own encrypted files in secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own encrypted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own encrypted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own encrypted files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own encrypted files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own files in secure-locker" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

CREATE POLICY "Users can access their own encrypted files in secure-locker"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can upload their own encrypted files in secure-locker"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'secure-locker'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can update their own encrypted files in secure-locker"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'secure-locker'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can delete their own encrypted files in secure-locker"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ==============================================================================
-- 5. Cryptographic Helper: Double-HMAC Blinding Verification Strategy
-- ==============================================================================
-- Cryptographic Guarantees & Environmental Limitations:
-- In PostgreSQL PL/pgSQL within an interpreted RDBMS, unconditional hardware or CPU-instruction
-- constant-time execution cannot be guaranteed due to query planning, variable memory allocations,
-- garbage collection, and variable OS scheduling jitter.
-- To mitigate timing side-channels in software without relying on hardware-level CPU guarantees,
-- this implementation uses a vetted Double-HMAC blinding pattern:
--   1. Strict input validation: Both inputs are constrained to fixed 64-character hex strings (32 bytes raw).
--   2. Ephemeral Secret Key: An unpredictable 256-bit random key (mac_key) is generated per comparison
--      invocation via extensions.gen_random_bytes(32).
--   3. Cryptographic Blinding: Both candidate proofs are blinded by computing HMAC-SHA256(bytes, mac_key).
--   4. Timing-Attack Defense: Because mac_key is ephemeral and unknown to the attacker, the resulting
--      32-byte MAC digests are pseudorandomly distributed. Even if PostgreSQL's internal bytea = bytea
--      operator terminates early on the first differing byte, the index of that differing byte is
--      statistically independent of the secrets a and b (E[X] approx 1.0039 bytes compared).
--      This blinds any correlation between comparison duration and secret verifier content.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.constant_time_equals(a text, b text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  bytes_a bytea;
  bytes_b bytea;
  mac_key bytea;
  mac_a bytea;
  mac_b bytea;
BEGIN
  -- Strict format validation: must be 64-character lowercase hex strings (SHA-256)
  IF a IS NULL OR b IS NULL OR a !~ '^[0-9a-f]{64}$' OR b !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  bytes_a := pg_catalog.decode(a, 'hex');
  bytes_b := pg_catalog.decode(b, 'hex');

  -- Ephemeral one-time 256-bit random key blinds both digests
  mac_key := extensions.gen_random_bytes(32);
  mac_a := extensions.hmac(bytes_a, mac_key, 'sha256');
  mac_b := extensions.hmac(bytes_b, mac_key, 'sha256');

  RETURN (mac_a = mac_b);
END;
$$;

REVOKE ALL ON FUNCTION public.constant_time_equals(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.constant_time_equals(text, text) TO authenticated;

-- ==============================================================================
-- 6. RPC: Ephemeral Challenge Generation (Replay Prevention)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_locker_auth_challenge_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_challenge_nonce text;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expires_at timestamptz := v_now + pg_catalog.interval '60 seconds';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  v_challenge_nonce := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');

  DELETE FROM public.locker_auth_challenges
  WHERE user_id = v_user_id AND (expires_at < v_now OR used = true);

  INSERT INTO public.locker_auth_challenges (user_id, challenge_nonce, expires_at, used, created_at)
  VALUES (v_user_id, v_challenge_nonce, v_expires_at, false, v_now);

  RETURN pg_catalog.jsonb_build_object(
    'challenge_nonce', v_challenge_nonce,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_locker_auth_challenge_rpc() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_locker_auth_challenge_rpc() TO authenticated;

-- ==============================================================================
-- 7. RPC: Atomic Challenge Consumption & Server-Side Lockout Enforcement
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_locker_passphrase_rpc(
  p_auth_proof text,
  p_challenge_nonce text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_vault record;
  v_challenge_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_locked_until timestamptz;
  v_failed_attempts int;
  v_expected_proof text;
  v_is_match boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- Fixed-length and encoding validation for proofs (strictly 64 hex characters)
  IF p_auth_proof IS NULL OR p_auth_proof !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Malformed authentication proof. Must be a valid 64-character lowercase hex string.',
      'remaining_attempts', 0
    );
  END IF;

  IF p_challenge_nonce IS NULL OR p_challenge_nonce !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Malformed challenge nonce. Must be a valid 64-character lowercase hex string.',
      'remaining_attempts', 0
    );
  END IF;

  -- 1. Vault existence check
  SELECT * INTO v_vault
  FROM public.locker_vaults
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Locker vault not found or not initialized.'
    );
  END IF;

  -- 2. Enforce active lockout
  IF v_vault.locked_until IS NOT NULL AND v_vault.locked_until > v_now THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Vault is temporarily locked out due to repeated failed attempts.',
      'locked_until', v_vault.locked_until,
      'remaining_attempts', 0
    );
  END IF;

  -- 3. CRITICAL FIX 2: ATOMIC CHALLENGE CONSUMPTION WITH ROW LOCK (Prevents TOCTOU concurrency race)
  UPDATE public.locker_auth_challenges
  SET used = true
  WHERE user_id = v_user_id
    AND challenge_nonce = p_challenge_nonce
    AND used = false
    AND expires_at > v_now
  RETURNING id INTO v_challenge_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Authentication challenge invalid, expired, or already consumed. Replay blocked.',
      'remaining_attempts', 0
    );
  END IF;

  -- 4. Compute expected HMAC-SHA256 proof using stored auth_verifier
  v_expected_proof := pg_catalog.encode(
    extensions.hmac(
      pg_catalog.convert_to(p_challenge_nonce, 'UTF8'),
      pg_catalog.convert_to(v_vault.auth_verifier, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  -- 5. Constant-time proof comparison via Double-HMAC blinding
  v_is_match := public.constant_time_equals(v_expected_proof, p_auth_proof);

  IF v_is_match THEN
    UPDATE public.locker_vaults
    SET
      failed_attempts = 0,
      locked_until = NULL,
      last_attempt_at = v_now,
      updated_at = v_now
    WHERE user_id = v_user_id;

    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (v_user_id, 'LOCKER_UNLOCK_SUCCESS', 'SUCCESS', pg_catalog.jsonb_build_object('timestamp', v_now));

    RETURN pg_catalog.jsonb_build_object('success', true);
  ELSE
    v_failed_attempts := v_vault.failed_attempts + 1;

    IF v_failed_attempts >= 10 THEN
      v_locked_until := v_now + pg_catalog.interval '24 hours';
    ELSIF v_failed_attempts >= 5 THEN
      v_locked_until := v_now + pg_catalog.interval '5 minutes';
    ELSIF v_failed_attempts >= 3 THEN
      v_locked_until := v_now + pg_catalog.interval '30 seconds';
    ELSE
      v_locked_until := NULL;
    END IF;

    UPDATE public.locker_vaults
    SET
      failed_attempts = v_failed_attempts,
      locked_until = v_locked_until,
      last_attempt_at = v_now,
      updated_at = v_now
    WHERE user_id = v_user_id;

    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (
      v_user_id,
      'LOCKER_UNLOCK_FAILED',
      'FAILED',
      pg_catalog.jsonb_build_object('failed_attempts', v_failed_attempts, 'locked_until', v_locked_until)
    );

    IF v_locked_until IS NOT NULL THEN
      INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
      VALUES (
        v_user_id,
        'LOCKOUT_TRIGGERED',
        'BLOCKED',
        pg_catalog.jsonb_build_object('consecutive_failures', v_failed_attempts, 'locked_until', v_locked_until)
      );
    END IF;

    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Incorrect locker passphrase proof.',
      'failed_attempts', v_failed_attempts,
      'locked_until', v_locked_until,
      'remaining_attempts', pg_catalog.greatest(0, 5 - v_failed_attempts)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_locker_passphrase_rpc(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_locker_passphrase_rpc(text, text) TO authenticated;

-- ==============================================================================
-- 8. RPC: Secure Passphrase Change (Preserves Recovery Key Hierarchy)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.change_locker_passphrase_rpc(
  p_auth_proof text,
  p_challenge_nonce text,
  p_new_auth_salt text,
  p_new_auth_verifier text,
  p_new_kek_salt text,
  p_new_encrypted_master_recovery_key text DEFAULT NULL,
  p_new_recovery_nonce text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_verify_res jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- 1. Verify current passphrase proof (atomically consumes challenge)
  v_verify_res := public.verify_locker_passphrase_rpc(p_auth_proof, p_challenge_nonce);
  IF (v_verify_res->>'success')::boolean IS NOT TRUE THEN
    RETURN v_verify_res;
  END IF;

  -- 2. Update passphrase credentials while preserving or updating recovery wrapping
  UPDATE public.locker_vaults
  SET
    auth_salt = p_new_auth_salt,
    auth_verifier = p_new_auth_verifier,
    kek_salt = p_new_kek_salt,
    encrypted_master_recovery_key = COALESCE(p_new_encrypted_master_recovery_key, encrypted_master_recovery_key),
    recovery_nonce = COALESCE(p_new_recovery_nonce, recovery_nonce),
    updated_at = pg_catalog.clock_timestamp()
  WHERE user_id = v_user_id;

  INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
  VALUES (v_user_id, 'PASSPHRASE_CHANGED', 'SUCCESS', '{}'::jsonb);

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.change_locker_passphrase_rpc(text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_locker_passphrase_rpc(text, text, text, text, text, text, text) TO authenticated;

-- ==============================================================================
-- 9. RPC: Legitimate Vault Recovery (Authorized Bypass of Passphrase Lockout)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.recover_locker_vault_rpc(
  p_recovery_proof text,
  p_challenge_nonce text,
  p_new_auth_salt text,
  p_new_auth_verifier text,
  p_new_kek_salt text,
  p_new_encrypted_master_recovery_key text DEFAULT NULL,
  p_new_recovery_nonce text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_vault record;
  v_challenge_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expected_recovery_proof text;
  v_is_match boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- Validate proof format (64-character lowercase hex)
  IF p_recovery_proof IS NULL OR p_recovery_proof !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Malformed recovery proof.');
  END IF;

  IF p_challenge_nonce IS NULL OR p_challenge_nonce !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Malformed challenge nonce.');
  END IF;

  SELECT * INTO v_vault
  FROM public.locker_vaults
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Vault does not exist.');
  END IF;

  -- Atomic challenge consumption
  UPDATE public.locker_auth_challenges
  SET used = true
  WHERE user_id = v_user_id
    AND challenge_nonce = p_challenge_nonce
    AND used = false
    AND expires_at > v_now
  RETURNING id INTO v_challenge_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Recovery challenge invalid, expired, or consumed.');
  END IF;

  -- Compute expected recovery proof using stored recovery_verifier
  v_expected_recovery_proof := pg_catalog.encode(
    extensions.hmac(
      pg_catalog.convert_to(p_challenge_nonce, 'UTF8'),
      pg_catalog.convert_to(v_vault.recovery_verifier, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  v_is_match := public.constant_time_equals(v_expected_recovery_proof, p_recovery_proof);

  IF NOT v_is_match THEN
    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (v_user_id, 'RECOVERY_ATTEMPT_FAILED', 'FAILED', pg_catalog.jsonb_build_object('timestamp', v_now));

    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Invalid recovery key proof.');
  END IF;

  -- Legitimate Recovery: Resets lockout and updates passphrase & recovery credentials
  UPDATE public.locker_vaults
  SET
    auth_salt = p_new_auth_salt,
    auth_verifier = p_new_auth_verifier,
    kek_salt = p_new_kek_salt,
    encrypted_master_recovery_key = COALESCE(p_new_encrypted_master_recovery_key, encrypted_master_recovery_key),
    recovery_nonce = COALESCE(p_new_recovery_nonce, recovery_nonce),
    failed_attempts = 0,
    locked_until = NULL,
    last_attempt_at = v_now,
    updated_at = v_now
  WHERE user_id = v_user_id;

  INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
  VALUES (v_user_id, 'RECOVERY_KEY_USED', 'SUCCESS', pg_catalog.jsonb_build_object('timestamp', v_now));

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.recover_locker_vault_rpc(text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recover_locker_vault_rpc(text, text, text, text, text, text, text) TO authenticated;

-- ==============================================================================
-- 9b. RPC: Verify Recovery Key & Clear Lockout (Without Mandatory Passphrase Reset)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_locker_recovery_key_rpc(
  p_recovery_proof text,
  p_challenge_nonce text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_vault record;
  v_challenge_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expected_recovery_proof text;
  v_is_match boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF p_recovery_proof IS NULL OR p_recovery_proof !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Malformed recovery proof.');
  END IF;

  IF p_challenge_nonce IS NULL OR p_challenge_nonce !~ '^[0-9a-f]{64}$' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Malformed challenge nonce.');
  END IF;

  SELECT * INTO v_vault
  FROM public.locker_vaults
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Vault does not exist.');
  END IF;

  -- Atomic challenge consumption
  UPDATE public.locker_auth_challenges
  SET used = true
  WHERE user_id = v_user_id
    AND challenge_nonce = p_challenge_nonce
    AND used = false
    AND expires_at > v_now
  RETURNING id INTO v_challenge_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Recovery challenge invalid, expired, or consumed.');
  END IF;

  -- Compute expected recovery proof
  v_expected_recovery_proof := pg_catalog.encode(
    extensions.hmac(
      pg_catalog.convert_to(p_challenge_nonce, 'UTF8'),
      pg_catalog.convert_to(v_vault.recovery_verifier, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  v_is_match := public.constant_time_equals(v_expected_recovery_proof, p_recovery_proof);

  IF NOT v_is_match THEN
    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (v_user_id, 'RECOVERY_ATTEMPT_FAILED', 'FAILED', pg_catalog.jsonb_build_object('timestamp', v_now));

    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Invalid recovery key proof.');
  END IF;

  -- Valid recovery proof: resets lockout
  UPDATE public.locker_vaults
  SET
    failed_attempts = 0,
    locked_until = NULL,
    last_attempt_at = v_now,
    updated_at = v_now
  WHERE user_id = v_user_id;

  INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
  VALUES (v_user_id, 'RECOVERY_KEY_USED', 'SUCCESS', pg_catalog.jsonb_build_object('timestamp', v_now));

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_locker_recovery_key_rpc(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_locker_recovery_key_rpc(text, text) TO authenticated;

-- ==============================================================================
-- 10. RPC: Safe Vault Reset (Blocks Lockout Bypass)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.reset_locker_vault_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_vault record;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_vault
  FROM public.locker_vaults
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Vault does not exist.');
  END IF;

  -- CRITICAL ANTI-BYPASS CHECK: Cannot reset or delete vault while actively locked out!
  IF v_vault.locked_until IS NOT NULL AND v_vault.locked_until > v_now THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Cannot reset vault while actively locked out. Please wait for lockout to expire or use Recovery Key.',
      'locked_until', v_vault.locked_until
    );
  END IF;

  -- Cleanly delete documents, challenges, and vault
  DELETE FROM public.locker_documents WHERE user_id = v_user_id;
  DELETE FROM public.locker_auth_challenges WHERE user_id = v_user_id;
  DELETE FROM public.locker_vaults WHERE user_id = v_user_id;

  INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
  VALUES (v_user_id, 'VAULT_RESET', 'SUCCESS', pg_catalog.jsonb_build_object('timestamp', v_now));

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_locker_vault_rpc() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_locker_vault_rpc() TO authenticated;

-- ==============================================================================
-- 11. PostgREST Schema Cache Reload Notification
-- ==============================================================================

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 12. Non-Destructive Rollback Script (Data-Preserving Reversal)
-- ==============================================================================
-- INSTRUCTIONS FOR ROLLBACK:
-- To revert the zero-trust security enhancements while PRESERVING ALL USER DATA,
-- execute the following SQL block. It drops the RPC functions, challenge table,
-- and custom policies, and restores permissive table permissions without dropping
-- locker_vaults, locker_documents, locker_audit_logs, or Storage objects.
--
-- BEGIN;
--
-- -- 12.1 Drop all Secure Locker RPCs and Helper Functions
-- DROP FUNCTION IF EXISTS public.verify_locker_recovery_key_rpc(text, text);
-- DROP FUNCTION IF EXISTS public.reset_locker_vault_rpc();
-- DROP FUNCTION IF EXISTS public.recover_locker_vault_rpc(text, text, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.recover_locker_vault_rpc(text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.change_locker_passphrase_rpc(text, text, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.change_locker_passphrase_rpc(text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.verify_locker_passphrase_rpc(text, text);
-- DROP FUNCTION IF EXISTS public.get_locker_auth_challenge_rpc();
-- DROP FUNCTION IF EXISTS public.constant_time_equals(text, text);
--
-- -- 12.2 Drop ephemeral challenges table (contains no persistent user data)
-- DROP TABLE IF EXISTS public.locker_auth_challenges CASCADE;
--
-- -- 12.3 Revert Storage Policies on storage.objects
-- DROP POLICY IF EXISTS "Users can access their own encrypted files in secure-locker" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can upload their own encrypted files in secure-locker" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own encrypted files in secure-locker" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own encrypted files in secure-locker" ON storage.objects;
--
-- -- 12.4 Restore standard table permissions on locker_vaults (re-enables full client access)
-- GRANT ALL ON public.locker_vaults TO authenticated;
--
-- -- 12.5 Re-enable basic RLS policies on locker_vaults
-- DROP POLICY IF EXISTS "Users can update non-sensitive locker vault settings" ON public.locker_vaults;
-- CREATE POLICY "Users can update their own locker vault"
--   ON public.locker_vaults FOR UPDATE TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can delete their own locker vault"
--   ON public.locker_vaults FOR DELETE TO authenticated
--   USING (auth.uid() = user_id);
--
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- ==============================================================================

-- ==============================================================================
-- 13. Destructive Teardown Script (TEST ENVIRONMENTS ONLY - PERMANENT DATA LOSS)
-- ==============================================================================
-- CAUTION: RUNNING THIS SCRIPT PERMANENTLY DESTROYS ALL USER VAULTS, AUDIT LOGS,
-- ENCRYPTED DOCUMENTS, AND METADATA. DO NOT RUN IN PRODUCTION.
--
-- BEGIN;
-- DROP TABLE IF EXISTS public.locker_documents CASCADE;
-- DROP TABLE IF EXISTS public.locker_audit_logs CASCADE;
-- DROP TABLE IF EXISTS public.locker_auth_challenges CASCADE;
-- DROP TABLE IF EXISTS public.locker_vaults CASCADE;
-- DELETE FROM storage.objects WHERE bucket_id = 'secure-locker';
-- DELETE FROM storage.buckets WHERE id = 'secure-locker';
-- DROP FUNCTION IF EXISTS public.verify_locker_recovery_key_rpc(text, text);
-- DROP FUNCTION IF EXISTS public.reset_locker_vault_rpc();
-- DROP FUNCTION IF EXISTS public.recover_locker_vault_rpc(text, text, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.recover_locker_vault_rpc(text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.change_locker_passphrase_rpc(text, text, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.change_locker_passphrase_rpc(text, text, text, text, text);
-- DROP FUNCTION IF EXISTS public.verify_locker_passphrase_rpc(text, text);
-- DROP FUNCTION IF EXISTS public.get_locker_auth_challenge_rpc();
-- DROP FUNCTION IF EXISTS public.constant_time_equals(text, text);
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
-- ==============================================================================
