import React from 'react';
import { LegalLayout, TocItem } from '../components/legal/LegalLayout';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Ban,
  HardDrive,
} from 'lucide-react';

const TERMS_TOC: TocItem[] = [
  { id: 'section-terms-acceptance', title: '1. Acceptance of Terms & Eligibility' },
  { id: 'section-terms-description', title: '2. Description of NEXA Services' },
  { id: 'section-terms-accounts', title: '3. User Accounts & Credential Security' },
  { id: 'section-terms-acceptable-use', title: '4. Acceptable Use & Prohibited Conduct' },
  { id: 'section-terms-ownership', title: '5. User Content Ownership & IP Rights' },
  { id: 'section-terms-integrations', title: '6. Third-Party Integrations (Google & Supabase)' },
  { id: 'section-terms-locker', title: '7. Secure Locker & User Encryption Obligations' },
  { id: 'section-terms-availability', title: '8. Service Availability & Disclaimers' },
  { id: 'section-terms-liability', title: '9. Limitation of Liability' },
  { id: 'section-terms-indemnity', title: '10. Indemnification' },
  { id: 'section-terms-termination', title: '11. Account Termination & Suspension' },
  { id: 'section-terms-governing', title: '12. Governing Law & Dispute Jurisdiction' },
  { id: 'section-terms-changes', title: '13. Changes to These Terms' },
  { id: 'section-terms-severability', title: '14. Severability & Entire Agreement' },
  { id: 'section-terms-contact', title: '15. Legal Notices & Contact Information' },
];

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The legally binding terms and conditions governing access to and use of the NEXA personal productivity workspace and zero-trust encrypted document vault."
      documentType="terms"
      lastUpdated="November 1, 2026"
      effectiveDomain="https://personalwebsite-olive-ten.vercel.app"
      tocItems={TERMS_TOC}
    >
      {/* 1. Acceptance of Terms & Eligibility */}
      <section id="section-terms-acceptance" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">01</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Acceptance of Terms & Eligibility
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and{' '}
          <strong className="text-white">NEXA – Independently Operated Personal Project</strong> (&ldquo;NEXA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of the NEXA Workspace application hosted at{' '}
          <a
            href="https://personalwebsite-olive-ten.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#75A7FF] hover:underline font-mono text-xs"
          >
            https://personalwebsite-olive-ten.vercel.app
          </a>{' '}
          (the &ldquo;Service&rdquo;).
        </p>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          By registering an account, logging in, or otherwise accessing the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our companion{' '}
          <a href="/privacy" className="text-[#75A7FF] underline hover:text-white">
            Privacy Policy
          </a>
          . If you do not agree to these Terms in their entirety, you must not access or use the Service.
        </p>

        <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] text-xs text-[#A9BAD4] space-y-1">
          <strong className="text-white">Eligibility Requirements:</strong>
          <p className="leading-relaxed">
            You must be at least 13 years of age (or at least 16 in jurisdictions where local data protection regulations require higher age thresholds) and possess the full legal capacity to enter into a binding contract. If you represent an organization or business, you warrant that you are authorized to bind that entity to these Terms.
          </p>
        </div>
      </section>

      {/* 2. Description of NEXA Services */}
      <section id="section-terms-description" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">02</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Description of NEXA Services
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA is a privacy-first web workspace designed to unify personal task tracking, external Google media browsing, profile preferences, and a zero-trust encrypted document vault:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <span className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#75A7FF]" />
              Productivity Dashboard & Metrics
            </span>
            <p className="text-[#A9BAD4] leading-relaxed">
              Provides real-time task statistics, weekly execution trend visualization, daily focus queues, and recent workspace activity logs calculated directly from authenticated records.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <span className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#75A7FF]" />
              To-Do & Kanban Manager
            </span>
            <p className="text-[#A9BAD4] leading-relaxed">
              Interactive 3-column Kanban board and list view for creating, scheduling, categorizing, prioritizing, and completing deliverables.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <span className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#75A7FF]" />
              Secure Locker (Encrypted Vault)
            </span>
            <p className="text-[#A9BAD4] leading-relaxed">
              Client-side envelope encryption (AES-256-GCM + PBKDF2) for storing sensitive documents in private cloud storage where only the client can decrypt files.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1">
            <span className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#75A7FF]" />
              Google Drive & Photos Explorers
            </span>
            <p className="text-[#A9BAD4] leading-relaxed">
              In-browser file browsing and document viewing (PDFs, media) directly from your connected Google account using official read-only Google APIs.
            </p>
          </div>
        </div>
      </section>

      {/* 3. User Accounts & Credential Security */}
      <section id="section-terms-accounts" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">03</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            User Accounts & Credential Security
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          Access to NEXA features requires an active user account managed via Supabase Auth. By registering and maintaining an account, you agree to:
        </p>

        <ul className="space-y-2 text-xs text-[#A9BAD4] list-disc list-inside">
          <li>Provide accurate, current, and complete registration information and keep your email address updated.</li>
          <li>Maintain the strict confidentiality of your login password, Secure Locker passphrase, and emergency recovery keys.</li>
          <li>Accept full responsibility for all activities, task operations, and uploads occurring under your authenticated credentials.</li>
          <li>Notify NEXA immediately at{' '}
            <a
              href="mailto:sathiyarajvicky29@gmail.com"
              className="text-[#75A7FF] underline hover:text-white font-mono"
            >
              sathiyarajvicky29@gmail.com
            </a>{' '}
            upon discovering or suspecting any unauthorized breach of your account.</li>
        </ul>
      </section>

      {/* 4. Acceptable Use & Prohibited Conduct */}
      <section id="section-terms-acceptable-use" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">04</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Acceptable Use & Prohibited Conduct
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          You agree to use the Service exclusively for lawful personal and organizational productivity purposes. You explicitly agree <strong className="text-white">NOT</strong> to:
        </p>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 space-y-2 text-xs text-red-200">
          <div className="flex items-center gap-2 font-bold text-white">
            <Ban className="w-4 h-4 text-red-400" />
            <span>Strictly Prohibited Activities:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-red-200/90 leading-relaxed">
            <li>Upload, transmit, or store content that is illegal, defamatory, fraudulent, infringing on intellectual property, or abusive.</li>
            <li>Upload or transmit malware, viruses, worms, ransomware, Trojan horses, or corrupted files.</li>
            <li>Probe, scan, reverse engineer, or test the vulnerability of NEXA&rsquo;s network, Supabase database, or cryptographic enforcement boundaries.</li>
            <li>Bypass, circumvent, or disable security access controls, Row-Level Security rules, or rate-limiting thresholds.</li>
            <li>Abuse, flood, or manipulate third-party API quotas (including Google Drive or Google Photos limits).</li>
            <li>Interfere with or disrupt the normal operation of the Service, servers, or networks connected to NEXA.</li>
            <li>Impersonate any person, business entity, or government agency.</li>
          </ul>
        </div>
      </section>

      {/* 5. User Content Ownership & IP Rights */}
      <section id="section-terms-ownership" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">05</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            User Content Ownership & Intellectual Property
          </h2>
        </div>

        <div className="space-y-3 text-xs text-[#A9BAD4]">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#75A7FF]" />
              You Retain 100% Ownership of Your Data
            </h3>
            <p className="leading-relaxed">
              You retain sole and exclusive intellectual property ownership of all tasks, notes, documents, files, images, and content that you upload, submit, or process within NEXA (&ldquo;User Content&rdquo;). NEXA asserts zero ownership, copyright, or proprietary claims over your personal materials.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="font-bold text-white">Limited Operational License</h3>
            <p className="leading-relaxed">
              Solely to the extent necessary to deliver the Service (e.g., storing your task records in the database, hosting encrypted vault files in your storage partition), you grant NEXA a non-exclusive, worldwide, royalty-free license to host, transmit, and display User Content strictly as required to operate the application on your behalf.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <h3 className="font-bold text-white">Independent Backup Obligation</h3>
            <p className="leading-relaxed">
              While NEXA uses resilient cloud infrastructure, <strong className="text-white">you remain solely responsible for maintaining external backups of your critical deliverables, tasks, and documents</strong>. NEXA is not an archival preservation service.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Third-Party Integrations (Google & Supabase) */}
      <section id="section-terms-integrations" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">06</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Third-Party Integrations (Google & Supabase)
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          NEXA interfaces with external third-party services to deliver cloud storage, authentication, and media viewing features:
        </p>

        <div className="space-y-3 text-xs text-[#A9BAD4]">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#75A7FF]" />
              Google Services Disclaimer & User Agreements
            </h3>
            <p className="leading-relaxed">
              Google Drive and Google Photos features require authorization under your existing Google account. You acknowledge that Google services are owned, operated, and controlled exclusively by Google LLC.
            </p>
            <p className="leading-relaxed">
              Your use of Google services is governed by the{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#75A7FF] underline hover:text-white"
              >
                Google Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#75A7FF] underline hover:text-white"
              >
                Google Privacy Policy
              </a>
              . NEXA is an independent third-party client application and is neither endorsed by, affiliated with, nor operated by Google LLC.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#75A7FF]" />
              Supabase Infrastructure
            </h3>
            <p className="leading-relaxed">
              Backend database, authentication, and object storage are hosted on Supabase Inc. cloud infrastructure. Third-party outages, network maintenance, or upstream service disruptions are governed by Supabase service availability and are outside NEXA&rsquo;s direct control.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Secure Locker & User Encryption Obligations */}
      <section id="section-terms-locker" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">07</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Secure Locker & User Encryption Obligations
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          The Secure Locker operates a client-side zero-trust envelope encryption architecture (AES-256-GCM + PBKDF2 600,000 rounds + Argon2id verifiers). File encryption and decryption occur exclusively within your web browser.
        </p>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>CRITICAL LEGAL NOTICE: Passphrase & Recovery Key Non-Recoverability</span>
          </div>
          <p className="leading-relaxed">
            Because NEXA does not possess, transmit, or store your vault passphrase, master Key Encryption Key (KEK), or emergency recovery key, <strong className="text-white">NEXA HAS NO TECHNOLOGICAL MEANS TO RECOVER, RESET, OR BYPASS YOUR ENCRYPTION KEYS</strong>.
          </p>
          <p className="leading-relaxed">
            If you forget your Secure Locker passphrase and misplace your 256-bit emergency recovery key:
          </p>
          <ul className="list-disc list-inside space-y-1 font-semibold text-white">
            <li>Your stored encrypted files become permanently and mathematically undecryptable.</li>
            <li>NEXA customer support cannot assist in retrieving, unlocking, or decrypting your vault data.</li>
            <li>NEXA disclaims any and all liability for data loss resulting from forgotten credentials or lost recovery keys.</li>
          </ul>
        </div>
      </section>

      {/* 8. Service Availability & Disclaimers */}
      <section id="section-terms-availability" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">08</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Service Availability, Modifications & Disclaimers of Warranties
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2 text-xs text-[#A9BAD4]">
          <p className="leading-relaxed uppercase font-mono text-[11px] text-[#75A7FF]">
            &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; PROVISION
          </p>
          <p className="leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN <strong className="text-white">&ldquo;AS IS&rdquo;</strong> AND <strong className="text-white">&ldquo;AS AVAILABLE&rdquo;</strong> BASIS. NEXA EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, AND NON-INFRINGEMENT.
          </p>
          <p className="leading-relaxed">
            NEXA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, ACCURATE, OR COMPLETELY FREE FROM DEFECTS OR ERRORS. WE MAY SUSPEND, MODIFY, OR DISCONTINUE ANY ASPECT OF THE SERVICE AT ANY TIME FOR MAINTENANCE, SECURITY UPDATES, OR ARCHITECTURAL IMPROVEMENTS.
          </p>
        </div>
      </section>

      {/* 9. Limitation of Liability */}
      <section id="section-terms-liability" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">09</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Limitation of Liability
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-2 text-xs text-[#A9BAD4]">
          <p className="leading-relaxed uppercase font-mono text-[11px] text-[#75A7FF]">
            EXCLUSION OF CONSEQUENTIAL DAMAGES
          </p>
          <p className="leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL <strong className="text-white">NEXA – INDEPENDENTLY OPERATED PERSONAL PROJECT</strong>, ITS OPERATOR, DEVELOPERS, AFFILIATES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#A9BAD4]">
            <li>YOUR ACCESS TO, USE OF, OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
            <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR TRANSMISSIONS;</li>
            <li>FAILURE OF CRYPTOGRAPHIC RECOVERY RESULTING FROM FORGOTTEN PASSPHRASES OR LOST KEYS;</li>
            <li>ACTIONS, FAILURES, OR POLICIES OF THIRD-PARTY SERVICES (SUCH AS GOOGLE OR SUPABASE).</li>
          </ul>
          <p className="leading-relaxed pt-2">
            IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS EXCEED THE GREATER OF ONE HUNDRED US DOLLARS ($100.00 USD) OR THE AMOUNT PAID BY YOU TO NEXA IN THE PAST TWELVE (12) MONTHS.
          </p>
        </div>
      </section>

      {/* 10. Indemnification */}
      <section id="section-terms-indemnity" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">10</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Indemnification
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          You agree to defend, indemnify, and hold harmless <strong className="text-white">NEXA – Independently Operated Personal Project</strong>, its operator, affiliates, officers, agents, and employees from and against any third-party claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to:
        </p>

        <ul className="space-y-1.5 text-xs text-[#A9BAD4] list-disc list-inside">
          <li>Your violation of these Terms or applicable laws and regulations.</li>
          <li>Your User Content, uploaded documents, or data submitted to the Service.</li>
          <li>Your infringement of any third-party intellectual property or privacy rights.</li>
          <li>Misuse or unauthorized access to the Service via your authenticated credentials.</li>
        </ul>
      </section>

      {/* 11. Account Termination & Suspension */}
      <section id="section-terms-termination" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">11</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Account Termination & Suspension
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <span className="font-bold text-white">Termination by You</span>
            <p className="text-[#A9BAD4] leading-relaxed">
              You may terminate these Terms at any time by ceasing all use of the Service and requesting complete account deletion via{' '}
              <a
                href="mailto:sathiyarajvicky29@gmail.com"
                className="text-[#75A7FF] underline hover:text-white font-mono"
              >
                sathiyarajvicky29@gmail.com
              </a>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#10223D] border border-[#263F63] space-y-1.5">
            <span className="font-bold text-white">Suspension or Termination by NEXA</span>
            <p className="text-[#A9BAD4] leading-relaxed">
              We reserve the right to suspend or terminate your account immediately, without prior notice or liability, if you violate these Terms, engage in unlawful conduct, or pose security risks to other users or our infrastructure.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#A9BAD4] leading-relaxed">
          Upon termination, all licenses granted to you terminate immediately. Provisions that by their nature should survive termination (including ownership, liability limitations, indemnity, and dispute resolution) shall survive.
        </p>
      </section>

      {/* 12. Governing Law & Dispute Jurisdiction */}
      <section id="section-terms-governing" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">12</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Governing Law & Dispute Jurisdiction
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          These Terms and any dispute arising from or related to the Service shall be governed by and construed in accordance with applicable general law principles, without giving effect to any principles of conflicts of law.
        </p>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved through good-faith mutual negotiation. You can submit inquiries or dispute notices directly to{' '}
          <a
            href="mailto:sathiyarajvicky29@gmail.com"
            className="text-[#75A7FF] underline hover:text-white font-mono"
          >
            sathiyarajvicky29@gmail.com
          </a>.
        </p>
      </section>

      {/* 13. Changes to These Terms */}
      <section id="section-terms-changes" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">13</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Changes to These Terms
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          We reserve the right to revise or replace these Terms at our sole discretion.
          When changes are published, we will update the &ldquo;Last Updated&rdquo; date displayed at the top of this document.
          Your continued access to or use of the Service following the posting of any revised Terms constitutes your explicit agreement to be bound by the updated terms.
        </p>
      </section>

      {/* 14. Severability & Entire Agreement */}
      <section id="section-terms-severability" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">14</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Severability & Entire Agreement
          </h2>
        </div>

        <div className="space-y-2 text-xs text-[#A9BAD4]">
          <p className="leading-relaxed">
            <strong className="text-white">Severability:</strong> If any provision of these Terms is found to be invalid, unlawful, or unenforceable, that provision will be enforced to the maximum extent permissible and the remaining provisions shall remain in full force and effect.
          </p>
          <p className="leading-relaxed">
            <strong className="text-white">Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the complete and exclusive agreement between you and NEXA regarding the Service, superseding all prior oral or written agreements, negotiations, or understandings.
          </p>
        </div>
      </section>

      {/* 15. Legal Notices & Contact Information */}
      <section id="section-terms-contact" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#263F63]">
          <span className="text-xs font-mono font-bold text-[#75A7FF] px-2 py-0.5 rounded bg-[#162D4D]">15</span>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-white tracking-tight">
            Legal Notices & Contact Information
          </h2>
        </div>

        <p className="text-sm text-[#A9BAD4] leading-relaxed">
          For legal inquiries, formal notices, or questions concerning these Terms of Service, please reach out via the following channels:
        </p>

        <div className="p-5 rounded-2xl bg-[#10223D] border border-[#263F63] space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[#7890B2] block text-[11px] uppercase tracking-wider font-semibold">Entity / Project</span>
              <span className="text-white font-medium block mt-1">NEXA – Independently Operated Personal Project</span>
            </div>
            <div>
              <span className="text-[#7890B2] block text-[11px] uppercase tracking-wider font-semibold">Legal Contact Email</span>
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
