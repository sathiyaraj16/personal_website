import React from 'react';
import { LegalLayout, TocItem } from '../components/legal/LegalLayout';
import {
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  UserCheck,
  AlertTriangle,
  HardDrive,
  Image as ImageIcon,
  CheckCircle2,
  Mail,
  ExternalLink,
  Cpu,
  RefreshCw,
  Server,
} from 'lucide-react';

const PRIVACY_TOC: TocItem[] = [
  { id: 'section-intro', title: '1. Introduction & Application Scope' },
  { id: 'section-registration', title: '2. Information Collected During Registration' },
  { id: 'section-supabase-auth', title: '3. Supabase Authentication & Session Tokens' },
  { id: 'section-workspace-data', title: '4. Tasks, Profile Data & Uploaded Documents' },
  { id: 'section-secure-locker', title: '5. Secure Locker & Client-Side Encryption' },
  { id: 'section-google-oauth', title: '6. Google OAuth Authentication & Permissions' },
  { id: 'section-google-drive-photos', title: '7. Google Drive & Google Photos Ephemeral Access' },
  { id: 'section-data-storage', title: '8. How Data is Stored, Processed & Transferred' },
  { id: 'section-security-practices', title: '9. Data Security Practices & Limitations' },
  { id: 'section-third-party', title: '10. Third-Party Services & Subprocessors' },
  { id: 'section-retention-deletion', title: '11. Data Retention & Account Deletion' },
  { id: 'section-privacy-rights', title: '12. Your Privacy Rights' },
  { id: 'section-children', title: '13. Children’s Privacy' },
  { id: 'section-contact', title: '14. Contact Information & Legal Placeholders' },
];

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How NEXA Workspace collects, processes, and protects your information, detailing client-side encryption, Supabase backend storage, and Google OAuth integrations."
      documentType="privacy"
      lastUpdated="November 1, 2026"
      effectiveDomain="https://personalwebsite-olive-ten.vercel.app"
      tocItems={PRIVACY_TOC}
    >
      {/* 1. Introduction & Application Scope */}
      <section id="section-intro" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">01</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Introduction & Application Scope
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          Welcome to <strong className="text-white">NEXA Workspace</strong> (&ldquo;NEXA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), accessible via{' '}
          <a
            href="https://personalwebsite-olive-ten.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#75A7FF] hover:underline font-mono text-xs"
          >
            https://personalwebsite-olive-ten.vercel.app
          </a>
          . NEXA is a personal productivity workspace application engineered to unite deliverable tracking, Google Drive and Google Photos media browsing, profile configuration, and a client-side zero-trust encrypted document vault (Secure Locker).
        </p>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          This Privacy Policy describes in clear, verifiable terms what information is collected, how it is stored and processed, the cryptographic mechanisms used to safeguard sensitive materials, and our strict adherence to third-party API requirements, including Google&rsquo;s API Services User Data Policy.
        </p>

        <div className="p-4 rounded-xl bg-[#112541] border border-[#263F63] text-xs text-[#A9BAD4] space-y-1">
          <p className="font-semibold text-white">Governing Entity & Contact Disclosures:</p>
          <p>
            Entity Name: <span className="text-white font-medium">NEXA – Independently Operated Personal Project</span>
          </p>
          <p>
            Registered Address: <span className="text-white font-medium">NEXA is independently operated and does not currently have a registered business address.</span>
          </p>
          <p>
            Contact Email:{' '}
            <a
              href="mailto:sathiyarajvicky29@gmail.com"
              className="text-[#75A7FF] underline hover:text-white font-mono"
            >
              sathiyarajvicky29@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* 2. Information Collected During Account Registration */}
      <section id="section-registration" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">02</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Information Collected During Account Registration
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          To provide an authenticated, private workspace experience, NEXA requires an authenticated account. When registering or authenticating, the following data points are created or collected:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Mail className="w-4 h-4 text-[#75A7FF]" />
              <span>Email Address</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Your primary email address is used as the unique account identifier for login, password recovery notifications, and critical transactional account communications.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Lock className="w-4 h-4 text-[#75A7FF]" />
              <span>Password Credentials</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Passwords are salted and cryptographically hashed by Supabase Auth using secure server algorithms (such as bcrypt). Raw passwords are never visible to NEXA or stored in plaintext.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <UserCheck className="w-4 h-4 text-[#75A7FF]" />
              <span>User Identity & UUID</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              An immutable UUID (<code className="font-mono text-[11px] text-[#75A7FF]">user_id</code>) is generated upon registration, serving as the relational anchor across your tasks, preferences, and encrypted vault records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <RefreshCw className="w-4 h-4 text-[#75A7FF]" />
              <span>Account Timestamps</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Timestamps tracking when your account was created (<code className="font-mono text-[11px] text-[#75A7FF]">created_at</code>) and last sign-in moments (<code className="font-mono text-[11px] text-[#75A7FF]">last_sign_in_at</code>) are logged for security auditing.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Supabase Authentication & Account Information */}
      <section id="section-supabase-auth" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">03</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Supabase Authentication & Account Information
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA leverages Supabase Auth as its backend identity layer. Here is how session tokens and authentication states are maintained:
        </p>

        <ul className="space-y-3 text-xs text-[#A9BAD4] list-none">
          <li className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Session Persistence in Local Storage:</strong> To prevent forced re-authentication on every page visit or browser tab refresh, Supabase JSON Web Tokens (JWT access token and refresh token) are held in browser <code className="font-mono text-[#75A7FF]">localStorage</code>.
            </div>
          </li>
          <li className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Automatic Token Refresh:</strong> Session tokens automatically rotate and refresh in the background via Supabase client listeners, ensuring unbroken security without storing long-lived unauthenticated access privileges.
            </div>
          </li>
          <li className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Session Sign Out:</strong> When signing out via the Profile settings, your session is immediately invalidated on the Supabase server and all stored auth tokens are purged from browser storage.
            </div>
          </li>
        </ul>
      </section>

      {/* 4. User Tasks, Profile Information & Uploaded Documents */}
      <section id="section-workspace-data" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">04</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            User Tasks, Profile Information & Uploaded Documents
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA processes workspace data provided directly by you to operate the productivity tools. Each category of data is handled with specific storage and access controls:
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#263F63]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#10223D] text-white border-b border-[#263F63] font-semibold">
              <tr>
                <th className="p-3">Data Category</th>
                <th className="p-3">Specific Fields</th>
                <th className="p-3">Storage Location</th>
                <th className="p-3">Access Isolation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263F63] bg-[#0d1c33]/50 text-[#A9BAD4]">
              <tr>
                <td className="p-3 font-semibold text-white">To-Do Tasks</td>
                <td className="p-3">Title, description, category (Work, Projects, Study, Personal, Other), priority, due date, status, subtasks</td>
                <td className="p-3">Supabase PostgreSQL <code className="font-mono text-[#75A7FF]">tasks</code> table + client local cache</td>
                <td className="p-3">Strict Postgres Row-Level Security (RLS) ensuring each query is scoped to <code className="font-mono text-[#75A7FF]">auth.uid() = user_id</code></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Profile Details</td>
                <td className="p-3">Display name, full name, phone number, bio, role, workspace preferences (theme, task view mode, date/time format)</td>
                <td className="p-3">Supabase PostgreSQL <code className="font-mono text-[#75A7FF]">profiles</code> table + user metadata</td>
                <td className="p-3">PostgreSQL RLS preventing any other user from viewing or modifying your profile records</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Profile Avatars</td>
                <td className="p-3">Uploaded image files (JPG, PNG, WebP)</td>
                <td className="p-3">Supabase Storage <code className="font-mono text-[#75A7FF]">avatars</code> bucket</td>
                <td className="p-3">Storage RLS policy restricted to the authenticated user ID prefix</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Secure Locker Files</td>
                <td className="p-3">Encrypted file payloads (PDFs, images, sensitive documents)</td>
                <td className="p-3">Supabase Storage private <code className="font-mono text-[#75A7FF]">secure-locker</code> bucket (<code className="font-mono text-[#75A7FF]">{'{user_id}/{doc_id}.enc'}</code>)</td>
                <td className="p-3">Pre-upload client-side AES-256-GCM envelope encryption. Ciphertext only; server holds zero decryption keys</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Secure Locker & Client-Side Encryption */}
      <section id="section-secure-locker" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">05</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Secure Locker & Client-Side Zero-Trust Encryption
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          The <strong className="text-white">Secure Locker</strong> implements client-side envelope encryption. This architecture guarantees that document plaintext and unencrypted keys are strictly confined to your local web browser:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#75A7FF]" />
              In-Browser Web Crypto Envelope Encryption Architecture
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Every document uploaded to the Secure Locker is encrypted directly within your browser using the standard Web Crypto API (<code className="font-mono text-[#75A7FF]">crypto.subtle</code>) prior to any network transit:
            </p>
            <ul className="text-xs text-[#A9BAD4] space-y-1 list-disc list-inside">
              <li><strong className="text-white">Cipher:</strong> AES-256-GCM with distinct, cryptographically random 12-byte initialization vectors (nonces) and Authenticated Additional Data (AAD) verifying user and document identifiers.</li>
              <li><strong className="text-white">Data Encryption Key (DEK):</strong> A fresh 256-bit symmetric key is generated per document, used to encrypt the payload, and then wrapped under the master Key Encryption Key (KEK).</li>
              <li><strong className="text-white">Key Derivation (PBKDF2):</strong> The master KEK is derived client-side via PBKDF2 with 600,000 iterations of HMAC-SHA512 using your vault passphrase and a 32-byte cryptographically secure salt.</li>
              <li><strong className="text-white">Server-Side Challenge Verification (Argon2id):</strong> Passphrase verification uses client-derived Argon2id hashes (19MB memory, 3 iterations) combined with atomic, single-use server challenges. Your raw vault passphrase and master KEK are never sent to or stored on any server.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#75A7FF]" />
              RAM-Only Key Lifecycle & Navigation Auto-Lock Protection
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              The derived master KEK is held <strong className="text-white">strictly in transient memory (RAM)</strong> while actively on the <code className="font-mono text-[#75A7FF]">/locker</code> route.
              It is never written to disk, local storage, or session storage.
              Whenever you navigate away from <code className="font-mono text-[#75A7FF]">/locker</code> to any other section (Dashboard, To-Do, Photos, Drive, Profile), or if you refresh the browser tab, trigger a manual lock, or remain inactive, the in-memory keys are immediately destroyed and the vault is locked.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#75A7FF]" />
              Emergency Recovery Key & Technical Limitations
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Upon initializing your Secure Locker, an emergency 256-bit recovery key (RFC 1751 / Crockford Base32 format) is generated in-browser. This key enables key rotation and vault access in the event you forget your passphrase.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Irreversible Loss Disclaimer:</strong> Because NEXA does not possess your vault passphrase, master KEK, or emergency recovery key, <strong className="text-white">NEXA is technically unable to recover or decrypt your documents if both your passphrase and recovery key are lost</strong>. Absolute data loss is mathematically irreversible in such cases.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Google OAuth Authentication & Permissions */}
      <section id="section-google-oauth" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">06</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Google OAuth Authentication & Permissions
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA offers optional Google integrations. Authentication is handled using official Google OAuth 2.0 flows through Google Identity Services (GIS).
          Our integration requests only the minimum scopes necessary to fulfill workspace functionality:
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#263F63]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#10223D] text-white border-b border-[#263F63] font-semibold">
              <tr>
                <th className="p-3">Integration Scope</th>
                <th className="p-3">Official Scope URI</th>
                <th className="p-3">Purpose & Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263F63] bg-[#0d1c33]/50 text-[#A9BAD4]">
              <tr>
                <td className="p-3 font-semibold text-white">Google Identity & Profile</td>
                <td className="p-3 font-mono text-[11px] text-[#75A7FF]">
                  openid<br />
                  https://www.googleapis.com/auth/userinfo.email<br />
                  https://www.googleapis.com/auth/userinfo.profile
                </td>
                <td className="p-3">
                  Allows optional single sign-on (SSO) and displays your verified Google email, name, and profile photo avatar in the topbar and account settings.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Google Drive (Read-Only)</td>
                <td className="p-3 font-mono text-[11px] text-[#75A7FF]">
                  https://www.googleapis.com/auth/drive.readonly
                </td>
                <td className="p-3">
                  Strictly read-only access to browse files and folders in your Google Drive, search files, and stream in-browser document previews. NEXA does not request write, modify, or delete permissions.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Google Photos Picker</td>
                <td className="p-3 font-mono text-[11px] text-[#75A7FF]">
                  https://www.googleapis.com/auth/photospicker.mediaitems.readonly<br />
                  https://www.googleapis.com/auth/photoslibrary.appendonly
                </td>
                <td className="p-3">
                  Adheres to Google&rsquo;s updated Photos API architecture, allowing you to select and preview specific photos and media items using the official Photos Picker without granting broad unrestricted library access.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#75A7FF]" />
            Ephemeral In-Memory Token Management
          </h3>
          <p className="text-xs text-[#A9BAD4] leading-relaxed">
            Google OAuth access tokens are held <strong className="text-white">strictly in transient JavaScript memory closure</strong> (<code className="font-mono text-[#75A7FF]">_inMemoryTokenData</code>).
            <strong className="text-white"> Access tokens are never saved to localStorage, sessionStorage, IndexedDB, cookies, or remote databases.</strong>
            Refreshing the page, closing the tab, or disconnecting Google services instantly and irreversibly wipes the token from browser memory.
          </p>
        </div>
      </section>

      {/* 7. Google Drive & Google Photos Ephemeral Access */}
      <section id="section-google-drive-photos" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">07</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Google Drive & Google Photos Ephemeral Access & Limited Use Disclosure
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA operates as a direct client-side viewer for your authorized Google Drive and Google Photos content. We maintain a strict zero-storage architecture for third-party media:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <HardDrive className="w-4 h-4 text-[#75A7FF]" />
              <span>Google Drive File Handling</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              When browsing files or folders, API queries are transmitted directly from your browser to Google Drive API v3 endpoints. In-app document previews (rendered via PDF.js worker, native video players, or image tags) stream binary blobs directly into memory as transient object URLs. <strong className="text-white">No Google Drive files or file metadata are stored, cached on disk, or duplicated on NEXA servers.</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <ImageIcon className="w-4 h-4 text-[#75A7FF]" />
              <span>Google Photos Media Handling</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Photos selected through the Google Photos Picker are rendered in-browser using short-lived authenticated image URLs. <strong className="text-white">NEXA does not download, copy, harvest, index, or retain your Google Photos on any database or persistent storage system.</strong>
            </p>
          </div>
        </div>

        {/* Google API Services User Data Policy / Limited Use Policy Card */}
        <div className="p-5 rounded-2xl bg-[#0e213b] border border-blue-500/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 className="w-5 h-5 text-[#75A7FF]" />
            <span>Google API Services User Data Policy Compliance (Limited Use Disclosure)</span>
          </div>
          <p className="text-xs text-[#A9BAD4] leading-relaxed">
            NEXA&rsquo;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#75A7FF] underline hover:text-white"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements:
          </p>
          <ul className="text-xs text-[#A9BAD4] space-y-1.5 list-disc list-inside">
            <li><strong className="text-white">No Human Inspection:</strong> Human employees or operators of NEXA are strictly prohibited from viewing or reading your Google Drive or Google Photos data, unless you explicitly request assistance, it is strictly necessary for security diagnostics, or required by law.</li>
            <li><strong className="text-white">No AI/ML Training:</strong> Data obtained via Google APIs is never used to develop, train, retrain, or improve machine learning or artificial intelligence models.</li>
            <li><strong className="text-white">No Advertising or Data Brokerage:</strong> We do not sell, rent, monetize, or transfer Google user data to data brokers, advertising platforms, or marketing entities.</li>
            <li><strong className="text-white">Independent Policies:</strong> Google services are governed independently by Google&rsquo;s Terms of Service and Privacy Policy. You can review Google&rsquo;s policies at{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#75A7FF] underline hover:text-white"
              >
                https://policies.google.com/privacy
              </a>.
            </li>
          </ul>
        </div>
      </section>

      {/* 8. How Data is Stored, Processed, and Transferred */}
      <section id="section-data-storage" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">08</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            How Data is Stored, Processed, and Transferred
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA operates a modern cloud architecture combining client-side execution with hosted platform infrastructure:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Server className="w-4 h-4 text-[#75A7FF]" />
              <span>Frontend Delivery</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              The application frontend is compiled and hosted on Vercel&rsquo;s global edge network (<code className="font-mono text-[#75A7FF]">personalwebsite-olive-ten.vercel.app</code>), ensuring low latency and HTTPS-only transport.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Database className="w-4 h-4 text-[#75A7FF]" />
              <span>Backend & Database</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Database records (tasks, user profiles, vault metadata) are stored in managed PostgreSQL instances hosted on Supabase, secured with active Row-Level Security policies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Lock className="w-4 h-4 text-[#75A7FF]" />
              <span>Object Storage</span>
            </div>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              File uploads are maintained in Supabase Storage. Profile avatars reside in the <code className="font-mono text-[#75A7FF]">avatars</code> bucket; encrypted vault files reside in the private <code className="font-mono text-[#75A7FF]">secure-locker</code> bucket.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Data Security Practices & Limitations */}
      <section id="section-security-practices" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">09</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Data Security Practices & Technical Limitations
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          We implement verifiable technical safeguards to preserve data integrity and protect against unauthorized access:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="text-xs font-bold text-white">1. Encryption in Transit & at Rest</h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              All communications between your browser, NEXA, Supabase, and Google APIs are enforced using Transport Layer Security (TLS 1.2 or higher). Stored database records and object storage benefit from infrastructure-level encryption, supplemented by client-side AES-256-GCM envelope encryption for vault documents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="text-xs font-bold text-white">2. Multi-Tenant Row-Level Security</h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              All database queries enforce Supabase PostgreSQL Row-Level Security (RLS) rules. Even if a malicious request attempts to read another user&rsquo;s task or document ID, the database engine enforces tenant separation at the query level, returning zero results.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="text-xs font-bold text-white">3. Brute-Force Rate Limiting & Audit Logging</h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              The Secure Locker enforces progressive rate limiting and lockout counters upon repeated failed passphrase challenge attempts, accompanied by an audit log that records security events with completely redacted parameters and zero plaintext secrets.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Limitations of Security & User Responsibilities</span>
            </div>
            <p className="leading-relaxed">
              No internet-connected system or electronic storage mechanism is 100% impenetrable. While NEXA utilizes robust cryptographic primitives, we cannot guarantee absolute immunity against attacks originating on compromised client endpoints, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-200/90">
              <li>Malware, keyloggers, screen scrapers, or spyware installed on your personal device.</li>
              <li>Malicious third-party browser extensions or tampered browser runtimes.</li>
              <li>Unauthorized physical access to an unlocked or unattended device.</li>
              <li>Compromised or shared master passwords and emergency recovery keys.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 10. Third-Party Services & Subprocessors */}
      <section id="section-third-party" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">10</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Third-Party Services & Subprocessors
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA partners with select cloud infrastructure providers to deliver its services. Their processing of data is governed by their respective privacy terms:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <span className="text-xs font-bold text-white">Supabase Inc.</span>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Provides hosted PostgreSQL database, authentication mechanisms, and cloud object storage.
            </p>
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#75A7FF] hover:underline"
            >
              Supabase Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <span className="text-xs font-bold text-white">Google LLC</span>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Provides Google Identity Services (OAuth), Google Drive API, and Google Photos Picker API.
            </p>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#75A7FF] hover:underline"
            >
              Google Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <span className="text-xs font-bold text-white">Vercel Inc.</span>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Provides edge delivery, CDN routing, and static web application asset hosting.
            </p>
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#75A7FF] hover:underline"
            >
              Vercel Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* 11. Data Retention & Account Deletion */}
      <section id="section-retention-deletion" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">11</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Data Retention & Account Deletion
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          We retain your information solely for the duration required to provide your workspace services:
        </p>

        <div className="space-y-3 text-xs text-[#A9BAD4]">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="font-bold text-white">Active Retention Lifecycle</h3>
            <p className="leading-relaxed">
              Your profile, tasks, and encrypted locker documents persist as long as your account remains active.
              When you delete a task or document through the application interface, the record is immediately purged from the database and any corresponding storage object is deleted from Supabase Storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="font-bold text-white">Full Account Erasure & Data Deletion Requests</h3>
            <p className="leading-relaxed">
              To request complete deletion of your account and all associated records, email{' '}
              <a
                href="mailto:sathiyarajvicky29@gmail.com"
                className="text-[#75A7FF] underline hover:text-white font-mono"
              >
                sathiyarajvicky29@gmail.com
              </a>.
              Upon identity confirmation, all database records, profile metadata, uploaded avatars, and encrypted files will be permanently purged within thirty (30) days.
            </p>
          </div>
        </div>
      </section>

      {/* 12. User Privacy Rights */}
      <section id="section-privacy-rights" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">12</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your Privacy Rights
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          Depending on your jurisdiction (such as under the General Data Protection Regulation (GDPR) in the EU/EEA, or the California Consumer Privacy Act / CPRA in the United States), you possess specific legal rights regarding your personal information:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <strong className="text-white">Right to Access & Rectify:</strong>
            <p className="text-[#A9BAD4] leading-relaxed">You can inspect and update your profile details and task entries directly within the application at any time.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <strong className="text-white">Right to Erasure (&ldquo;To Be Forgotten&rdquo;):</strong>
            <p className="text-[#A9BAD4] leading-relaxed">You have the right to request full erasure of your account and personal workspace history.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <strong className="text-white">Right to Restrict or Object:</strong>
            <p className="text-[#A9BAD4] leading-relaxed">You may object to specific processing activities or request restrictions on data handling.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <strong className="text-white">Right to Revoke Permissions:</strong>
            <p className="text-[#A9BAD4] leading-relaxed">You can disconnect Google services anytime in Profile Settings or revoke access via Google Account Security settings.</p>
          </div>
        </div>

        <p className="text-xs text-[#A9BAD4] leading-relaxed">
          To exercise any of these rights, contact our privacy operator at{' '}
          <a
            href="mailto:sathiyarajvicky29@gmail.com"
            className="text-[#75A7FF] underline hover:text-white font-mono"
          >
            sathiyarajvicky29@gmail.com
          </a>.
        </p>
      </section>

      {/* 13. Children's Privacy */}
      <section id="section-children" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">13</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Children&rsquo;s Privacy
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA Workspace is not intended for or directed toward children under 13 years of age (or under 16 in the European Union).
          We do not knowingly collect or solicit personal information from children. If we discover that personal data from a child under the applicable age threshold has been collected without verifiable parental consent, we will take prompt action to delete such data from our databases.
        </p>
      </section>

      {/* 14. Contact Information & Project Disclosures */}
      <section id="section-contact" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">14</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Contact Information & Project Disclosures
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          For inquiries, privacy requests, or questions regarding this Privacy Policy or our security architecture, please contact the project operator:
        </p>

        <div className="p-5 rounded-2xl bg-[#10223D] border border-[#263F63] space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[#7890B2] block text-[11px] uppercase tracking-wider font-semibold">Entity / Operator</span>
              <span className="text-white font-medium block mt-1">NEXA – Independently Operated Personal Project</span>
            </div>
            <div>
              <span className="text-[#7890B2] block text-[11px] uppercase tracking-wider font-semibold">Privacy Contact Email</span>
              <a
                href="mailto:sathiyarajvicky29@gmail.com"
                className="text-[#75A7FF] font-medium block mt-1 font-mono underline hover:text-white"
              >
                sathiyarajvicky29@gmail.com
              </a>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#7890B2] block text-[11px] uppercase tracking-wider font-semibold">Registered Address</span>
              <span className="text-white font-medium block mt-1">
                NEXA is independently operated and does not currently have a registered business address.
              </span>
            </div>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
};
