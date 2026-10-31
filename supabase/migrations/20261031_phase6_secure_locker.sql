-- ==============================================================================
-- NEXA Enterprise Productivity Workspace - Phase 6 Database Migration
-- Module: Secure Locker (Zero-Trust Envelope Encryption Architecture)
-- Tables: locker_vaults, locker_documents, locker_audit_logs, locker_sessions
-- Storage: secure-locker (Private bucket with strict per-user RLS)
-- ==============================================================================

-- 1. Create locker_vaults table
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

-- 2. Create locker_documents table
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

-- 3. Create locker_audit_logs table (Immutable append-only audit trail)
CREATE TABLE IF NOT EXISTS public.locker_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locker_audit_user_id ON public.locker_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_locker_audit_created_at ON public.locker_audit_logs(created_at DESC);

-- 4. Create locker_sessions table
CREATE TABLE IF NOT EXISTS public.locker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locker_sessions_user ON public.locker_sessions(user_id);

-- ==============================================================================
-- 5. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.locker_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_sessions ENABLE ROW LEVEL SECURITY;

-- 5.1 locker_vaults RLS
DROP POLICY IF EXISTS "Users can view their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can view their own locker vault"
  ON public.locker_vaults
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can insert their own locker vault"
  ON public.locker_vaults
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can update their own locker vault"
  ON public.locker_vaults
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own locker vault" ON public.locker_vaults;
CREATE POLICY "Users can delete their own locker vault"
  ON public.locker_vaults
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5.2 locker_documents RLS
DROP POLICY IF EXISTS "Users can view their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can view their own locker documents"
  ON public.locker_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can insert their own locker documents"
  ON public.locker_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can update their own locker documents"
  ON public.locker_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own locker documents" ON public.locker_documents;
CREATE POLICY "Users can delete their own locker documents"
  ON public.locker_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5.3 locker_audit_logs RLS (Append-only: SELECT & INSERT allowed, NO UPDATE or DELETE)
DROP POLICY IF EXISTS "Users can view their own locker audit logs" ON public.locker_audit_logs;
CREATE POLICY "Users can view their own locker audit logs"
  ON public.locker_audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker audit logs" ON public.locker_audit_logs;
CREATE POLICY "Users can insert their own locker audit logs"
  ON public.locker_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Explicitly DISALLOW UPDATE and DELETE on audit logs to preserve tamper-resistance
-- (No policies created for UPDATE or DELETE = rejected by default in PostgreSQL RLS)

-- 5.4 locker_sessions RLS
DROP POLICY IF EXISTS "Users can view their own locker sessions" ON public.locker_sessions;
CREATE POLICY "Users can view their own locker sessions"
  ON public.locker_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own locker sessions" ON public.locker_sessions;
CREATE POLICY "Users can insert their own locker sessions"
  ON public.locker_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locker sessions" ON public.locker_sessions;
CREATE POLICY "Users can update their own locker sessions"
  ON public.locker_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. Storage Bucket: secure-locker (Private with user-specific folder isolation)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('secure-locker', 'secure-locker', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can access their own encrypted files in secure-locker" ON storage.objects;
CREATE POLICY "Users can access their own encrypted files in secure-locker"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload their own encrypted files in secure-locker" ON storage.objects;
CREATE POLICY "Users can upload their own encrypted files in secure-locker"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'secure-locker'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own encrypted files in secure-locker" ON storage.objects;
CREATE POLICY "Users can update their own encrypted files in secure-locker"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own encrypted files in secure-locker" ON storage.objects;
CREATE POLICY "Users can delete their own encrypted files in secure-locker"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'secure-locker'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================================================
-- 7. Stored Procedures: Server-Side Rate Limiting, Verification & Lockout RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_locker_passphrase_rpc(
  p_auth_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_vault record;
  v_now timestamptz := now();
  v_locked_until timestamptz;
  v_failed_attempts int;
  v_is_match boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Authentication required.'
    );
  END IF;

  SELECT * INTO v_vault
  FROM public.locker_vaults
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Locker vault not found or not initialized.'
    );
  END IF;

  -- Check if currently locked out
  IF v_vault.locked_until IS NOT NULL AND v_vault.locked_until > v_now THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Locker is temporarily locked due to excessive failed attempts.',
      'locked_until', v_vault.locked_until,
      'remaining_attempts', 0
    );
  END IF;

  -- Constant-time comparison check
  v_is_match := (v_vault.auth_verifier = p_auth_hash);

  IF v_is_match THEN
    -- Success: reset failures and locked_until
    UPDATE public.locker_vaults
    SET
      failed_attempts = 0,
      locked_until = NULL,
      last_attempt_at = v_now,
      updated_at = v_now
    WHERE user_id = v_user_id;

    -- Record audit event
    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (v_user_id, 'LOCKER_UNLOCK_SUCCESS', 'SUCCESS', jsonb_build_object('client_timestamp', v_now));

    RETURN jsonb_build_object(
      'success', true
    );
  ELSE
    -- Failure: increment counter and apply progressive delay / lockout
    v_failed_attempts := v_vault.failed_attempts + 1;

    IF v_failed_attempts >= 10 THEN
      -- Severe brute-force attempt: 24 hour lockout
      v_locked_until := v_now + INTERVAL '24 hours';
    ELSIF v_failed_attempts >= 5 THEN
      -- Progressive delay lockout: 5 minutes
      v_locked_until := v_now + INTERVAL '5 minutes';
    ELSIF v_failed_attempts >= 3 THEN
      -- Short lockout: 30 seconds
      v_locked_until := v_now + INTERVAL '30 seconds';
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

    -- Record audit event
    INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
    VALUES (
      v_user_id,
      'LOCKER_UNLOCK_FAILED',
      'FAILED',
      jsonb_build_object(
        'attempt_number', v_failed_attempts,
        'locked_until', v_locked_until
      )
    );

    IF v_locked_until IS NOT NULL THEN
      INSERT INTO public.locker_audit_logs (user_id, event_type, status, metadata)
      VALUES (
        v_user_id,
        'LOCKOUT_TRIGGERED',
        'BLOCKED',
        jsonb_build_object(
          'consecutive_failures', v_failed_attempts,
          'locked_until', v_locked_until
        )
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid locker passphrase.',
      'failed_attempts', v_failed_attempts,
      'locked_until', v_locked_until,
      'remaining_attempts', GREATEST(0, 5 - v_failed_attempts)
    );
  END IF;
END;
$$;
