import { describe, it, expect } from 'vitest';
import { PrivacyPage } from '../pages/PrivacyPage';
import { TermsPage } from '../pages/TermsPage';
import { LegalLayout } from '../components/legal/LegalLayout';
import fs from 'fs';
import path from 'path';

describe('NEXA Legal Documentation & Routes Verification', () => {
  const privacyFileContent = fs.readFileSync(
    path.resolve(__dirname, '../pages/PrivacyPage.tsx'),
    'utf-8'
  );
  const termsFileContent = fs.readFileSync(
    path.resolve(__dirname, '../pages/TermsPage.tsx'),
    'utf-8'
  );
  const appFileContent = fs.readFileSync(
    path.resolve(__dirname, '../App.tsx'),
    'utf-8'
  );
  const loginFileContent = fs.readFileSync(
    path.resolve(__dirname, '../pages/LoginPage.tsx'),
    'utf-8'
  );
  const layoutFileContent = fs.readFileSync(
    path.resolve(__dirname, '../layouts/DashboardLayout.tsx'),
    'utf-8'
  );
  const vercelConfigFileContent = fs.readFileSync(
    path.resolve(__dirname, '../../vercel.json'),
    'utf-8'
  );

  describe('1. Route Registration & Direct URL Access', () => {
    it('registers /privacy as a public route in App.tsx', () => {
      expect(appFileContent).toContain('<Route path="/privacy" element={<PrivacyPage />} />');
    });

    it('registers /terms as a public route in App.tsx', () => {
      expect(appFileContent).toContain('<Route path="/terms" element={<TermsPage />} />');
    });

    it('places /privacy and /terms outside ProtectedRoute for public unauthenticated access', () => {
      const publicRoutesIndex = appFileContent.indexOf('<Route path="/privacy"');
      const protectedRouteIndex = appFileContent.indexOf('<Route element={<ProtectedRoute />}>');
      expect(publicRoutesIndex).toBeGreaterThan(0);
      expect(protectedRouteIndex).toBeGreaterThan(publicRoutesIndex);
    });

    it('configures vercel.json SPA rewrites for direct URL access and browser refresh', () => {
      const vercelConfig = JSON.parse(vercelConfigFileContent);
      expect(vercelConfig.rewrites).toBeDefined();
      expect(vercelConfig.rewrites).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source: '/(.*)', destination: '/index.html' }),
        ])
      );
    });

    it('provides navigational links in LoginPage and DashboardLayout footers', () => {
      expect(loginFileContent).toContain('to="/privacy"');
      expect(loginFileContent).toContain('to="/terms"');
      expect(layoutFileContent).toContain('to="/privacy"');
      expect(layoutFileContent).toContain('to="/terms"');
    });
  });

  describe('2. Privacy Policy Content & Accuracy Requirements', () => {
    it('contains all 14 required sections in Privacy Policy', () => {
      const requiredSections = [
        'section-intro',
        'section-registration',
        'section-supabase-auth',
        'section-workspace-data',
        'section-secure-locker',
        'section-google-oauth',
        'section-google-drive-photos',
        'section-data-storage',
        'section-security-practices',
        'section-third-party',
        'section-retention-deletion',
        'section-privacy-rights',
        'section-children',
        'section-contact',
      ];

      for (const sectionId of requiredSections) {
        expect(privacyFileContent).toContain(`id="${sectionId}"`);
      }
    });

    it('accurately documents Supabase authentication and session token handling', () => {
      expect(privacyFileContent).toContain('Supabase Auth');
      expect(privacyFileContent).toContain('localStorage');
      expect(privacyFileContent).toContain('user_id');
    });

    it('accurately details client-side envelope encryption and Secure Locker primitives', () => {
      expect(privacyFileContent).toContain('AES-256-GCM');
      expect(privacyFileContent).toContain('PBKDF2');
      expect(privacyFileContent).toContain('600,000');
      expect(privacyFileContent).toContain('Argon2id');
      expect(privacyFileContent).toContain('crypto.subtle');
      expect(privacyFileContent).toContain('RAM-Only Key Lifecycle');
    });

    it('truthfully disclaims that lost passphrases and recovery keys cannot be recovered by NEXA', () => {
      expect(privacyFileContent).toContain('Irreversible Loss Disclaimer');
      expect(privacyFileContent).toContain('NEXA is technically unable to recover or decrypt your documents');
    });

    it('accurately details Google OAuth scopes and in-memory transient token handling', () => {
      expect(privacyFileContent).toContain('https://www.googleapis.com/auth/drive.readonly');
      expect(privacyFileContent).toContain('https://www.googleapis.com/auth/photospicker.mediaitems.readonly');
      expect(privacyFileContent).toContain('_inMemoryTokenData');
      expect(privacyFileContent).toContain('Access tokens are never saved to localStorage');
    });

    it('includes Google Limited Use Disclosure adhering to Google API Services User Data Policy', () => {
      expect(privacyFileContent).toContain('Google API Services User Data Policy');
      expect(privacyFileContent).toContain('Limited Use');
      expect(privacyFileContent).toContain('No AI/ML Training');
      expect(privacyFileContent).toContain('No Advertising or Data Brokerage');
    });

    it('confirms zero server-side storage of Google Drive files and Google Photos', () => {
      expect(privacyFileContent).toContain('No Google Drive files or file metadata are stored');
      expect(privacyFileContent).toContain('NEXA does not download, copy, harvest, index, or retain your Google Photos');
    });

    it('includes verified owner information, personal-project disclosures and clickable mailto link', () => {
      expect(privacyFileContent).toContain('NEXA – Independently Operated Personal Project');
      expect(privacyFileContent).toContain('NEXA is independently operated and does not currently have a registered business address.');
      expect(privacyFileContent).toContain('href="mailto:sathiyarajvicky29@gmail.com"');
      expect(privacyFileContent).toContain('sathiyarajvicky29@gmail.com');
    });

    it('does NOT contain unverified compliance or certification claims', () => {
      expect(privacyFileContent).not.toContain('SOC2 Type II Certified');
      expect(privacyFileContent).not.toContain('FIPS 140-2 Certified');
      expect(privacyFileContent).not.toContain('ISO 27001 Certified');
      expect(privacyFileContent).not.toContain('HIPAA Certified');
    });
  });

  describe('3. Terms of Service Content & Accuracy Requirements', () => {
    it('contains all 15 required sections in Terms of Service', () => {
      const requiredSections = [
        'section-terms-acceptance',
        'section-terms-description',
        'section-terms-accounts',
        'section-terms-acceptable-use',
        'section-terms-ownership',
        'section-terms-integrations',
        'section-terms-locker',
        'section-terms-availability',
        'section-terms-liability',
        'section-terms-indemnity',
        'section-terms-termination',
        'section-terms-governing',
        'section-terms-changes',
        'section-terms-severability',
        'section-terms-contact',
      ];

      for (const sectionId of requiredSections) {
        expect(termsFileContent).toContain(`id="${sectionId}"`);
      }
    });

    it('affirms 100% user data ownership and intellectual property rights', () => {
      expect(termsFileContent).toContain('You Retain 100% Ownership of Your Data');
      expect(termsFileContent).toContain('NEXA asserts zero ownership');
    });

    it('explicitly notes that Google services are governed by Google’s own terms and policies', () => {
      expect(termsFileContent).toContain('https://policies.google.com/terms');
      expect(termsFileContent).toContain('Google Terms of Service');
      expect(termsFileContent).toContain('Google Privacy Policy');
    });

    it('states cryptographic recovery limitations and disclaims liability for lost keys', () => {
      expect(termsFileContent).toContain('Passphrase & Recovery Key Non-Recoverability');
      expect(termsFileContent).toContain('NEXA HAS NO TECHNOLOGICAL MEANS TO RECOVER, RESET, OR BYPASS YOUR ENCRYPTION KEYS');
    });

    it('includes standard warranty disclaimers and limitation of liability clauses', () => {
      expect(termsFileContent).toContain('&ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;');
      expect(termsFileContent).toContain('EXCLUSION OF CONSEQUENTIAL DAMAGES');
    });

    it('includes verified owner information, personal-project disclosures and clickable mailto link in Terms', () => {
      expect(termsFileContent).toContain('NEXA – Independently Operated Personal Project');
      expect(termsFileContent).toContain('NEXA is independently operated and does not currently have a registered business address.');
      expect(termsFileContent).toContain('href="mailto:sathiyarajvicky29@gmail.com"');
      expect(termsFileContent).toContain('sathiyarajvicky29@gmail.com');
    });
  });

  describe('4. Component Instantiation & Verification', () => {
    it('exports PrivacyPage component', () => {
      expect(PrivacyPage).toBeDefined();
      expect(typeof PrivacyPage).toBe('function');
    });

    it('exports TermsPage component', () => {
      expect(TermsPage).toBeDefined();
      expect(typeof TermsPage).toBe('function');
    });

    it('exports LegalLayout component', () => {
      expect(LegalLayout).toBeDefined();
      expect(typeof LegalLayout).toBe('function');
    });
  });
});
