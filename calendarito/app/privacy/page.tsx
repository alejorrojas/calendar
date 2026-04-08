'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export default function PrivacyPage() {
  const shouldReduceMotion = useReducedMotion();

  const sectionVariants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
    visible: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">
      {/* Nav */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">Calendarito</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-heading text-sm font-medium text-[#555] hover:text-[#0A0A0A] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/empezar"
              className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
            >
              Start
            </Link>
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
          className="mb-12"
        >
          <h1 className="font-heading text-5xl font-bold tracking-[-0.04em] text-[#0A0A0A]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-[#555]">
            Last updated: April 8, 2026
          </p>
          <p className="mt-2 text-sm text-[#888]">
            This policy applies to California residents and all users of Calendarito and describes our practices under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA), the Google API Services User Data Policy, and applicable U.S. federal law.
          </p>
        </motion.div>


        <div className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:tracking-[-0.02em] prose-headings:font-semibold">

          {/* 1 — Core Commitment */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">1. Our Core Commitment</h2>
          <p className="text-[15px] text-[#444] leading-relaxed">
            <strong>We do not view, store, or have access to your calendar events.</strong>
          </p>
          <p className="text-[15px] text-[#444] leading-relaxed">
            Your events are created <strong>directly in your Google Calendar</strong> using the official Google Calendar API. Content you provide (text, files, PDFs, or images) is processed transiently by AI to extract structured event data and is immediately discarded after calendar creation. We never persist the actual event content on our servers.
          </p>
          <p className="text-[15px] text-[#444] leading-relaxed">
            <strong>We do not sell or share your personal information for cross-context behavioral advertising</strong>, as those terms are defined under Cal. Civ. Code § 1798.140.
          </p>

          {/* 2 — Information We Collect */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">2. Information We Collect</h2>
          <p className="text-[15px] text-[#444] mb-4">
            The table below uses the statutory categories defined by the CCPA/CPRA (Cal. Civ. Code § 1798.140).
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E8E8E8] text-[13px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5]">
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-[28%]">CCPA Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-[28%]">Specific Data Elements</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-[22%]">Source</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-[22%]">Business Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                <tr className="align-top">
                  <td className="px-4 py-3 text-[#0A0A0A] font-medium">Identifiers</td>
                  <td className="px-4 py-3 text-[#555]">Google user ID; OAuth access token; email address (used as account identifier in Supabase)</td>
                  <td className="px-4 py-3 text-[#555]">Directly from you via Google OAuth</td>
                  <td className="px-4 py-3 text-[#555]">Authentication; creating events in your Google Calendar on your behalf</td>
                </tr>
                <tr className="align-top bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-[#0A0A0A] font-medium">Internet or other electronic network activity information</td>
                  <td className="px-4 py-3 text-[#555]">Anonymized usage counts (events created, tokens consumed, file upload counts); transient text, PDF, or image content submitted for AI extraction</td>
                  <td className="px-4 py-3 text-[#555]">Directly from you; OpenAI as service provider (processes and returns structured data)</td>
                  <td className="px-4 py-3 text-[#555]">AI event extraction; service monitoring; cost management</td>
                </tr>
                <tr className="align-top">
                  <td className="px-4 py-3 text-[#0A0A0A] font-medium">Inferences drawn from other personal information</td>
                  <td className="px-4 py-3 text-[#555]">Structured event data (title, date, time, location, description) extracted from submitted content by AI</td>
                  <td className="px-4 py-3 text-[#555]">Derived from content you provide; processed by OpenAI as service provider</td>
                  <td className="px-4 py-3 text-[#555]">Presenting extracted events for your review before calendar creation; discarded immediately after</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-[#888] mt-3">
            We do not collect sensitive personal information as defined by Cal. Civ. Code § 1798.121, and we do not knowingly collect personal information from consumers under 16.
          </p>

          {/* 3 — How We Use Your Information */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">3. How We Use Your Information</h2>
          <p className="text-[15px] text-[#444]">
            We use the personal information described above exclusively for the following business purposes:
          </p>
          <ul className="mt-4 space-y-3 text-[15px] text-[#444]">
            <li className="flex items-start gap-3">• <span><strong>Service delivery:</strong> Authenticating you with Google and creating calendar events you have explicitly confirmed.</span></li>
            <li className="flex items-start gap-3">• <span><strong>AI event extraction:</strong> Sending your submitted content to OpenAI (acting as a service provider under a data processing agreement) to parse structured event data. OpenAI does not use your data to train its models under our enterprise agreement.</span></li>
            <li className="flex items-start gap-3">• <span><strong>Cost and operations monitoring:</strong> Tracking anonymized token usage and event counts to manage our OpenAI and hosting costs.</span></li>
            <li className="flex items-start gap-3">• <span><strong>Debugging and product improvement:</strong> Retaining anonymized usage logs to identify issues and improve extraction accuracy.</span></li>
          </ul>
          <p className="mt-4 text-[15px] text-[#444]">
            We do not use your personal information for automated decision-making that produces legal or similarly significant effects. The AI extraction step structures events for <em>your review and explicit confirmation</em> before any calendar entry is created.
          </p>

          {/* 4 — Data Processing and Third Parties */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">4. Data Processing and Third Parties</h2>
          <p className="text-[15px] text-[#444] mb-4">
            We disclose personal information to the following categories of service providers/contractors solely for the business purposes described above. We do not "sell" or "share" personal information with any third party.
          </p>

          <div className="space-y-6 text-[15px]">
            <div className="rounded-xl border border-[#E8E8E8] p-5">
              <p className="font-semibold text-[#0A0A0A] mb-1">Google LLC</p>
              <p className="text-[#555] text-[14px]">
                CCPA categories disclosed: Identifiers; Inferences (event content you confirm for creation).<br />
                Purpose: All calendar read/write operations occur through the official Google Calendar API using your OAuth credentials. Google handles storage and delivery of your events.<br /><br />
                <strong>Google API Services User Data Policy:</strong> Our use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#0A0A0A] underline">
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements. We access only the <code>calendar.events</code> scope (write) required to create events on your behalf. We do not read your existing calendar events, contacts, or any other Google data.
              </p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-5">
              <p className="font-semibold text-[#0A0A0A] mb-1">OpenAI, L.L.C.</p>
              <p className="text-[#555] text-[14px]">
                CCPA categories disclosed: Internet or other electronic network activity information (transient content); Inferences (structured extraction result).<br />
                Purpose: Event extraction only. Your content is processed transiently and not used to train OpenAI models. OpenAI acts as a service provider under a data processing agreement.
              </p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-5">
              <p className="font-semibold text-[#0A0A0A] mb-1">Supabase, Inc.</p>
              <p className="text-[#555] text-[14px]">
                CCPA categories disclosed: Identifiers (user ID, email); Internet or other electronic network activity information (anonymized usage counts).<br />
                Purpose: Authentication (storing your OAuth session) and logging anonymized usage statistics. Event content is not stored in a way that allows reconstruction of your personal schedule.
              </p>
            </div>
          </div>

          {/* 5 — What We Do NOT Do */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">5. What We Do NOT Do</h2>
          <ul className="list-none space-y-3 text-[15px] text-[#444]">
            <li>• We do not read your existing Google Calendar events</li>
            <li>• We do not store your raw event content, uploaded files, or text inputs on our servers</li>
            <li>• We do not sell your personal information</li>
            <li>• We do not share your personal information for cross-context behavioral advertising</li>
            <li>• We do not use your data to train AI models</li>
            <li>• We do not share identifiable personal information with third parties beyond what is strictly necessary for the service to function</li>
            <li>• We do not knowingly collect personal information from individuals under 16 years of age</li>
          </ul>

          {/* 6 — Data Retention */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">6. Data Retention</h2>
          <div className="overflow-x-auto rounded-xl border border-[#E8E8E8] text-[13px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5]">
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-1/3">Data Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-1/3">Retention Period</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#0A0A0A] border-b border-[#E8E8E8] w-1/3">Criteria / Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                <tr className="align-top">
                  <td className="px-4 py-3 text-[#0A0A0A]">Browser localStorage (draft events, UI state)</td>
                  <td className="px-4 py-3 text-[#555]">Until you clear your browser data or click &quot;Add more events&quot;</td>
                  <td className="px-4 py-3 text-[#555]">Controlled entirely by you; never transmitted until you confirm creation</td>
                </tr>
                <tr className="align-top bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-[#0A0A0A]">OAuth access token (Supabase session)</td>
                  <td className="px-4 py-3 text-[#555]">Until you sign out or revoke access in your Google Account settings</td>
                  <td className="px-4 py-3 text-[#555]">Required to maintain authenticated session; deleted immediately upon revocation</td>
                </tr>
                <tr className="align-top">
                  <td className="px-4 py-3 text-[#0A0A0A]">Transient AI input (text, files, images)</td>
                  <td className="px-4 py-3 text-[#555]">Not retained; discarded immediately after OpenAI returns extracted event data</td>
                  <td className="px-4 py-3 text-[#555]">Never stored on our servers beyond in-flight processing</td>
                </tr>
                <tr className="align-top bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-[#0A0A0A]">Anonymized usage logs (token counts, event counts, upload counts)</td>
                  <td className="px-4 py-3 text-[#555]">Up to 24 months</td>
                  <td className="px-4 py-3 text-[#555]">Retained for cost reconciliation, auditing, and aggregate service improvement; deleted on a rolling 24-month basis or upon valid deletion request</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7 — Security */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">7. Security</h2>
          <p className="text-[15px] text-[#444]">
            We implement reasonable technical and organizational safeguards appropriate to the nature of the data we process, including:
          </p>
          <ul className="mt-4 space-y-3 text-[15px] text-[#444]">
            <li className="flex items-start gap-3">• All data transmitted between your browser, our servers, Google, OpenAI, and Supabase is encrypted in transit using TLS 1.2 or higher.</li>
            <li className="flex items-start gap-3">• OAuth tokens are stored in Supabase with row-level security; only your authenticated session can access your own credentials.</li>
            <li className="flex items-start gap-3">• Access to production systems and logs is restricted to authorized personnel on a need-to-know basis.</li>
          </ul>
          <p className="mt-4 text-[15px] text-[#444]">
            No method of transmission or storage is 100% secure. If you believe your data has been compromised, contact us immediately at{' '}
            <a href="mailto:privacy@calendarito.com" className="text-[#0A0A0A] underline">privacy@calendarito.com</a>.
          </p>

          {/* 8 — Children's Privacy */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">8. Children&apos;s Privacy</h2>
          <p className="text-[15px] text-[#444]">
            Calendarito is not directed to children under the age of 13 and does not knowingly collect personal information from children under 13. We also do not sell or share personal information of consumers between the ages of 13 and 15 without affirmative opt-in, and we do not knowingly collect personal information from individuals under 16. If you believe a child has provided us with personal information, please contact us at{' '}
            <a href="mailto:privacy@calendarito.com" className="text-[#0A0A0A] underline">privacy@calendarito.com</a>{' '}
            and we will delete it promptly.
          </p>

          {/* 9 — California Privacy Rights */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">9. Your California Privacy Rights (CCPA/CPRA)</h2>
          <p className="text-[15px] text-[#444] mb-4">
            If you are a California resident, you have the following rights under the CCPA/CPRA (Cal. Civ. Code §§ 1798.100–1798.199):
          </p>

          <div className="space-y-4 text-[15px] text-[#444]">
            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Know / Access</p>
              <p className="text-[14px]">You have the right to request that we disclose: (a) the categories and specific pieces of personal information we have collected about you, (b) the categories of sources from which it was collected, (c) our business or commercial purpose for collecting it, and (d) the categories of third parties to whom we disclose it. Requests may cover personal information collected on or after January 1, 2022.</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Correct</p>
              <p className="text-[14px]">You have the right to request that we correct inaccurate personal information we maintain about you.</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Delete</p>
              <p className="text-[14px]">You have the right to request deletion of personal information we have collected about you, subject to certain exceptions (e.g., information required to complete a transaction, detect security incidents, or comply with a legal obligation).</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Opt Out of Sale or Sharing</p>
              <p className="text-[14px]">We do not sell or share personal information. No opt-out is required, but you may still submit a request and we will confirm our practices.</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Limit Use of Sensitive Personal Information</p>
              <p className="text-[14px]">We do not collect or process sensitive personal information as defined by Cal. Civ. Code § 1798.121. This right is not currently applicable to Calendarito.</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Right to Non-Discrimination</p>
              <p className="text-[14px]">We will not discriminate against you for exercising any of your CCPA/CPRA rights. We will not deny you goods or services, charge different prices, or provide a different level of service because you exercised a privacy right.</p>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] p-4">
              <p className="font-semibold text-[#0A0A0A] mb-1">Global Privacy Control (GPC)</p>
              <p className="text-[14px]">If your browser transmits a Global Privacy Control signal, we will treat it as a request to opt out of the sale or sharing of personal information. Since we do not sell or share personal information, no additional action is required on our end, but we honor GPC signals in accordance with Cal. Civ. Code § 1798.135(b).</p>
            </div>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-[#0A0A0A]">How to Submit a Verifiable Consumer Request</h3>
          <p className="text-[15px] text-[#444] mt-2">
            You may submit a verifiable consumer request by either of the following methods:
          </p>
          <ul className="mt-3 space-y-3 text-[15px] text-[#444]">
            <li>
              • <strong>Email:</strong>{' '}
              <a href="mailto:privacy@calendarito.com" className="text-[#0A0A0A] underline">privacy@calendarito.com</a>
              {' '}— Include your full name and the email address associated with your Calendarito account.
            </li>
            <li>
              • <strong>In-app:</strong> Navigate to your account settings and use the &quot;Submit a Privacy Request&quot; option (available when signed in).
            </li>
          </ul>

          <h3 className="mt-6 text-lg font-semibold text-[#0A0A0A]">Response Timeline and Verification</h3>
          <p className="text-[15px] text-[#444] mt-2">
            We will acknowledge receipt of your request within 10 business days and respond substantively within <strong>45 calendar days</strong>. If we require additional time, we will notify you in writing before the initial 45-day period expires and may extend our response by an additional 45 days (90 days total) where reasonably necessary.
          </p>
          <p className="text-[15px] text-[#444] mt-3">
            To protect your privacy, we will verify your identity before fulfilling a request. Verification typically requires confirming the email address associated with your account. We may request additional information if we cannot reasonably verify your identity from the information provided.
          </p>
          <p className="text-[15px] text-[#444] mt-3">
            <strong>Appeals:</strong> If we decline to take action on your request, you may appeal that decision by contacting us at{' '}
            <a href="mailto:privacy@calendarito.com" className="text-[#0A0A0A] underline">privacy@calendarito.com</a>{' '}
            with the subject line &quot;Privacy Request Appeal.&quot; We will respond to your appeal within 45 calendar days.
          </p>
          <p className="text-[15px] text-[#444] mt-3">
            You may also revoke Calendarito&apos;s Google access at any time through your{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#0A0A0A] underline">
              Google Account permissions
            </a>
            .
          </p>

          {/* 10 — Changes */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">10. Changes to This Policy</h2>
          <p className="text-[15px] text-[#444]">
            We review and update this Privacy Policy at least annually, as required by the CCPA/CPRA. For material changes that affect your rights or our data practices in a significant way, we will notify you via email (to the address associated with your account) or via a prominent in-app notice at least 30 days before the change takes effect. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
          </p>

          {/* 11 — Contact */}
          <h2 className="mt-12 text-2xl font-semibold text-[#0A0A0A]">11. Contact Us</h2>
          <p className="text-[15px] text-[#444]">
            For privacy-related questions, consumer rights requests, or concerns about our data practices:
          </p>
          <div className="mt-4 rounded-xl border border-[#E8E8E8] p-5 text-[14px] text-[#555] space-y-1">
            <p><strong className="text-[#0A0A0A]">Calendarito</strong></p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@calendarito.com" className="text-[#0A0A0A] underline">
                privacy@calendarito.com
              </a>
            </p>
            <p>Subject line for rights requests: &quot;California Privacy Request&quot;</p>
          </div>

          <div className="mt-16 border-t border-[#E0E0E0] pt-8 text-xs text-[#888]">
            <p>
              This policy is accessible via the Calendarito settings menu and is available in a screen-reader-compatible, printable format at this URL. Legal references: Cal. Civ. Code §§ 1798.100 et seq. (CCPA/CPRA); CPPA regulations effective January 1, 2026; Google API Services User Data Policy; FTC Act § 5.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
