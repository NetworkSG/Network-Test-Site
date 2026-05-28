import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "./shared/SiteFooter";
import { HomepageNav } from "./shared/HomepageNav";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const serif = "'EB Garamond', Georgia, serif";

const C = {
  cream: "#f0ede6",
  creamBorder: "#d8d3c8",
  black: "#0f0f0d",
  ink: "#1a1916",
  gray: "#5a574f",
  grayLight: "#6b6860",
};

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string | (string | { strong: string })[] }
  | { type: "ul"; items: string[] };

const SECTIONS: Block[] = [
  { type: "h2", text: "1. Introduction" },
  {
    type: "p",
    text:
      'Network Media Pte. Ltd. ("Network", "we", "us", or "our") operates the website www.networksg.net and provides a renovation matching service that connects homeowners in Singapore with verified interior design firms and contractors (the "Service").',
  },
  {
    type: "p",
    text:
      'We are committed to protecting your personal data and complying with the Personal Data Protection Act 2012 (No. 26 of 2012) of Singapore (the "PDPA") and its subsidiary legislation, including all guidelines and advisories issued by the Personal Data Protection Commission (the "PDPC").',
  },
  {
    type: "p",
    text:
      "This Privacy Policy explains how we collect, use, disclose, transfer, retain, and protect your personal data, and how you may exercise your rights under the PDPA. By accessing our website, submitting any form, or using our Service, you acknowledge that you have read and understood this Policy.",
  },

  { type: "h2", text: "2. Personal Data We Collect" },
  {
    type: "p",
    text:
      "We collect only the personal data that is reasonably necessary to provide the Service. The categories of personal data we collect are described below.",
  },
  { type: "h3", text: "2.1 Information You Provide Directly" },
  {
    type: "p",
    text:
      "When you submit a renovation enquiry, request a free 3D render, use our Cost Guide, Floor Plan, Style Quiz, Mood Board Generator, AI Reno Adviser, or any other tool on our website, we may collect:",
  },
  {
    type: "ul",
    items: [
      "Full name",
      "Email address",
      "Mobile or contact number",
      "Property type (e.g., HDB BTO, HDB resale, condominium, landed)",
      "Estimated renovation budget range",
      "Key collection date or expected renovation start date",
      "Property postal code or address (for matching to area-relevant designers)",
      "Renovation preferences and any free-text notes you choose to provide",
    ],
  },
  { type: "h3", text: "2.2 Information Collected Automatically" },
  {
    type: "p",
    text:
      "When you visit www.networksg.net, certain information is collected automatically through cookies, pixels, and similar technologies. This may include:",
  },
  {
    type: "ul",
    items: [
      "IP address and approximate location",
      "Device type, browser type, and operating system",
      "Pages visited, time spent, and click behaviour",
      "Referring website or advertising source",
    ],
  },
  { type: "p", text: "See Section 10 for more detail on cookies and tracking technologies." },
  { type: "h3", text: "2.3 Information We Do Not Collect" },
  {
    type: "p",
    text:
      "We do not collect NRIC numbers, FIN numbers, passport numbers, financial account information, payment card details, income proof, or any sensitive personal data, as none of this is required to deliver the Service.",
  },

  { type: "h2", text: "3. Purposes for Which We Collect, Use, and Disclose Your Personal Data" },
  {
    type: "p",
    text:
      "In compliance with the Notification Obligation under the PDPA, we collect, use, and disclose your personal data for the following purposes only:",
  },
  {
    type: "ul",
    items: [
      "To match you with suitable interior design firms or contractors based on your property type, budget, timeline, and stated preferences",
      "To facilitate communication between you and the matched firms, including sharing your contact details with the firms we have selected for you",
      "To respond to your enquiries, requests, and feedback",
      "To deliver renovation-related tools you have requested (e.g., 3D renders, cost estimates, mood boards)",
      "To verify the quality and outcome of matches and improve our matching service",
      "To comply with applicable laws, regulations, and lawful requests from authorities",
      "To investigate and prevent fraud, misuse of the Service, or breaches of our terms",
    ],
  },
  {
    type: "p",
    text:
      "We do not use your personal data for unrelated marketing campaigns, third-party advertising of non-renovation products, or any purpose beyond the matching service unless we obtain your separate, specific consent.",
  },

  { type: "h2", text: "4. Consent" },
  {
    type: "p",
    text:
      "By submitting a form, providing us with your personal data, or using our Service, you consent to the collection, use, and disclosure of your personal data for the purposes set out in Section 3.",
  },
  {
    type: "p",
    text:
      "We rely primarily on your express consent. In limited circumstances, we may rely on deemed consent (for example, where you voluntarily provide your data for an obvious purpose) or other lawful bases permitted under the PDPA, including legitimate interests where applicable.",
  },
  { type: "h3", text: "4.1 Withdrawal of Consent" },
  {
    type: "p",
    text:
      "You may withdraw your consent for the collection, use, or disclosure of your personal data at any time by contacting us using the details in Section 14. We will process your withdrawal request within a reasonable time, typically within ten (10) business days.",
  },
  {
    type: "p",
    text:
      "Please note that withdrawing your consent may prevent us from continuing to provide the Service to you, including completing or maintaining a match with an interior design firm. We will inform you of any such consequences before we act on your withdrawal request. Withdrawal does not affect the lawfulness of any processing carried out before the withdrawal took effect.",
  },

  { type: "h2", text: "5. Disclosure of Your Personal Data" },
  {
    type: "p",
    text:
      "We disclose your personal data only to the following categories of recipients, and only to the extent necessary for the purposes described in Section 3.",
  },
  { type: "h3", text: "5.1 Matched Interior Design Firms and Contractors" },
  {
    type: "p",
    text:
      "When we match you with one or more interior design firms or contractors, we share your contact details and renovation requirements with those firms so they can reach out to you. These firms are independent businesses and, once your data has been shared with them, they act as independent data controllers and are responsible for handling your personal data in accordance with their own privacy policies and the PDPA.",
  },
  {
    type: "p",
    text:
      "We share your data only with firms that have agreed to handle homeowner data in compliance with the PDPA and our partner terms.",
  },
  { type: "h3", text: "5.2 Service Providers and Technology Partners" },
  {
    type: "p",
    text:
      "We engage trusted third-party service providers to support the operation of our Service. These providers process personal data only on our instructions and under appropriate data protection arrangements. They include:",
  },
  {
    type: "ul",
    items: [
      "Cloud hosting and infrastructure providers",
      "Customer relationship and database management tools (e.g., Airtable)",
      "Workflow automation services (e.g., Zapier)",
      "Internal communication platforms (e.g., Slack)",
      "Email and messaging service providers",
      "Web analytics providers (e.g., Google Analytics)",
      "Advertising and audience measurement platforms (e.g., Meta)",
    ],
  },
  { type: "h3", text: "5.3 Insurance and Coverage Partners" },
  {
    type: "p",
    text:
      "Where you participate in protection programmes offered through our Service (such as renovation coverage provided in partnership with Singlife or programmes such as Handshake), we may share the personal data necessary for those partners to underwrite, administer, or honour the coverage. These partners are independent organisations regulated under their own legal frameworks.",
  },
  { type: "h3", text: "5.4 Legal and Regulatory Disclosures" },
  {
    type: "p",
    text:
      "We may disclose your personal data where we are required to do so by law, regulation, court order, or a lawful request from a government authority, or where we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.",
  },
  { type: "h3", text: "5.5 We Do Not Sell Your Personal Data" },
  {
    type: "p",
    text:
      "We do not sell, rent, or trade your personal data to third parties for their independent marketing purposes.",
  },

  { type: "h2", text: "6. Transfer of Personal Data Outside Singapore" },
  {
    type: "p",
    text:
      "Some of our service providers (including cloud hosting, analytics, and advertising platforms) are based outside Singapore. Accordingly, your personal data may be transferred to, stored in, or processed in jurisdictions outside Singapore.",
  },
  {
    type: "p",
    text:
      "In compliance with the Transfer Limitation Obligation under the PDPA, we take reasonable steps to ensure that any overseas recipient of your personal data is bound by legally enforceable obligations to provide a standard of protection that is at least comparable to that under the PDPA. This may include contractual safeguards, recipient certifications, or transfers to jurisdictions with comparable data protection laws.",
  },

  { type: "h2", text: "7. Retention of Personal Data" },
  {
    type: "p",
    text:
      "In compliance with the Retention Limitation Obligation under the PDPA, we retain personal data only for as long as is necessary to fulfil the purposes for which it was collected, or as required to comply with our legal, regulatory, or contractual obligations.",
  },
  { type: "p", text: "Our standard retention practice is as follows:" },
  {
    type: "ul",
    items: [
      "Active homeowner leads: Retained for the duration of your active engagement with our Service and the matched firms, plus a period of up to five (5) years thereafter to support warranty queries, dispute resolution, and quality assurance.",
      "Unmatched or inactive enquiries: Retained for up to twenty-four (24) months from your last interaction, after which the data is securely deleted or anonymised.",
      "Website analytics data: Retained in accordance with the default retention settings of our analytics providers, typically up to twenty-six (26) months.",
      "Records required for legal or accounting compliance: Retained for the period required by applicable Singapore law (typically up to seven (7) years).",
    ],
  },
  {
    type: "p",
    text:
      "Once personal data is no longer required for any business or legal purpose, we will securely delete or anonymise it.",
  },

  { type: "h2", text: "8. How We Protect Your Personal Data" },
  {
    type: "p",
    text:
      "In compliance with the Protection Obligation under the PDPA, we implement reasonable administrative, technical, and physical safeguards designed to protect your personal data from unauthorised access, collection, use, disclosure, copying, modification, disposal, or similar risks. These measures include:",
  },
  {
    type: "ul",
    items: [
      "Restricted, role-based access to systems holding personal data",
      "Encryption of data in transit using industry-standard protocols (e.g., TLS)",
      "Use of reputable cloud providers with recognised security certifications",
      "Internal policies on data handling, confidentiality, and access control",
      "Periodic review of our security practices and vendor arrangements",
    ],
  },
  {
    type: "p",
    text:
      "No method of transmission over the internet or electronic storage is fully secure, and we cannot guarantee absolute security. However, we work to ensure that any risk of harm to you is minimised.",
  },

  { type: "h2", text: "9. Your Rights Under the PDPA" },
  {
    type: "p",
    text:
      "Subject to the conditions and exceptions set out in the PDPA, you have the following rights in relation to your personal data:",
  },
  { type: "h3", text: "9.1 Right of Access" },
  {
    type: "p",
    text:
      "You may request a copy of the personal data we hold about you, and information about how it has been used or disclosed in the past one (1) year.",
  },
  { type: "h3", text: "9.2 Right of Correction" },
  {
    type: "p",
    text:
      "You may request that we correct any error or omission in the personal data we hold about you. We will correct the data unless we are satisfied on reasonable grounds that no correction should be made, and we will inform any third party to whom the inaccurate data was disclosed in the past year, where appropriate.",
  },
  { type: "h3", text: "9.3 Right to Withdraw Consent" },
  { type: "p", text: "You may withdraw your consent as described in Section 4.1." },
  { type: "h3", text: "9.4 Making a Request" },
  {
    type: "p",
    text:
      "To exercise any of these rights, please contact our Data Protection Officer using the details in Section 14. We may require you to verify your identity before processing your request. We will respond to access and correction requests within thirty (30) days where reasonably practicable. A reasonable fee may be charged for processing access requests, in accordance with the PDPA.",
  },

  { type: "h2", text: "10. Cookies and Similar Technologies" },
  {
    type: "p",
    text:
      "Our website uses cookies and similar technologies (such as web beacons, pixels, and local storage) to operate the site, analyse traffic, and improve the user experience. The categories of cookies we may use are:",
  },
  {
    type: "ul",
    items: [
      "Strictly necessary cookies: Required for the website to function (e.g., security, form submission). These cannot be disabled.",
      "Analytics cookies: Help us understand how visitors use our site so we can improve it (e.g., Google Analytics).",
      "Advertising cookies: Used to measure the performance of our advertising campaigns and to show you relevant ads on third-party platforms (e.g., Meta Pixel).",
    ],
  },
  {
    type: "p",
    text:
      "You can manage cookies through your browser settings. Disabling certain cookies may affect website functionality.",
  },

  { type: "h2", text: "11. Do Not Call (DNC) Provisions" },
  {
    type: "p",
    text:
      "We comply with the Do Not Call provisions of the PDPA. We will not send specified marketing messages (voice calls, text messages, or fax messages) to any Singapore telephone number that is registered on the relevant Do Not Call Register, unless we have obtained the required clear and unambiguous consent from you in writing or evidential form.",
  },
  {
    type: "p",
    text:
      "Where we contact you for renovation matching purposes following your submission of an enquiry, this is in furtherance of the Service you have requested and is not unsolicited marketing.",
  },

  { type: "h2", text: "12. Children's Personal Data" },
  {
    type: "p",
    text:
      "Our Service is intended for individuals aged eighteen (18) years and above. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected personal data from a minor without appropriate parental or guardian consent, we will take steps to delete that data promptly.",
  },

  { type: "h2", text: "13. Changes to This Privacy Policy" },
  {
    type: "p",
    text:
      "We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. The updated Policy will be posted on www.networksg.net with a revised effective date. Where the changes are material, we will take reasonable steps to notify you. Your continued use of the Service after any update constitutes your acknowledgement of the revised Policy.",
  },

  { type: "h2", text: "14. Contact Us and Data Protection Officer" },
  {
    type: "p",
    text:
      "If you have any questions, concerns, complaints, or requests regarding this Privacy Policy or your personal data, please contact our Data Protection Officer at:",
  },
];

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Privacy Policy — Network</title>
        <meta
          name="description"
          content="How Network Media Pte. Ltd. collects, uses, discloses, retains, and protects your personal data under Singapore's PDPA."
        />
        <link rel="canonical" href="https://www.networksg.net/privacy-policy" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div style={{ background: C.cream, minHeight: "100vh" }}>
        <HomepageNav />
        {/* Top bar with logo / back link */}
        <header className="px-6 md:px-10 pt-8 md:pt-10">
          <div className="max-w-[820px] mx-auto">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[13px] font-normal hover:opacity-60 cursor-pointer no-underline"
              style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to home
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 md:px-10 pt-10 md:pt-16 pb-8 md:pb-12">
          <div className="max-w-[820px] mx-auto">
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.grayLight,
                fontFamily: sans,
                marginBottom: 18,
              }}
            >
              Network Media Pte. Ltd.
            </p>
            <h1
              className="text-[40px] md:text-[56px] font-normal leading-[1.05]"
              style={{ fontFamily: serif, color: C.black, letterSpacing: "-0.01em" }}
            >
              Privacy Policy
            </h1>
            <p
              className="text-[14px] mt-5"
              style={{ color: C.grayLight, fontFamily: sans }}
            >
              Effective Date: 25 April 2026
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="px-6 md:px-10 pb-20">
          <div
            className="max-w-[820px] mx-auto"
            style={{ fontFamily: sans, color: C.ink }}
          >
            {SECTIONS.map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="mt-12 mb-4 text-[24px] md:text-[28px] font-normal leading-[1.2]"
                    style={{ fontFamily: serif, color: C.black, letterSpacing: "-0.005em" }}
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3
                    key={i}
                    className="mt-7 mb-3 text-[16px] font-medium leading-[1.4]"
                    style={{ fontFamily: sans, color: C.black }}
                  >
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "p") {
                return (
                  <p
                    key={i}
                    className="text-[15px] leading-[1.75] mb-4"
                    style={{ color: C.ink, fontFamily: sans }}
                  >
                    {typeof block.text === "string" ? block.text : null}
                  </p>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul
                    key={i}
                    className="mb-5 pl-5 text-[15px] leading-[1.75]"
                    style={{ color: C.ink, fontFamily: sans, listStyle: "disc" }}
                  >
                    {block.items.map((item, j) => (
                      <li key={j} className="mb-2" style={{ paddingLeft: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}

            {/* DPO contact card */}
            <div
              className="mt-6 p-6 md:p-8"
              style={{
                background: "#ffffff",
                border: `1px solid ${C.creamBorder}`,
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.grayLight,
                  fontFamily: sans,
                  marginBottom: 12,
                }}
              >
                Data Protection Officer
              </p>
              <p
                className="text-[20px] md:text-[24px] mb-4"
                style={{ fontFamily: serif, color: C.black, lineHeight: 1.25 }}
              >
                Jacob Chow
              </p>
              <div className="text-[14px] leading-[1.7]" style={{ color: C.ink, fontFamily: sans }}>
                <p>Network Media Pte. Ltd.</p>
                <p>10 Marina Boulevard, #39-01 Marina Bay Financial Centre, Singapore 018983</p>
                <p className="mt-3">
                  Email:{" "}
                  <a
                    href="mailto:customersupport@orangenetworkstudios.com"
                    style={{ color: C.black, textDecoration: "underline" }}
                  >
                    customersupport@orangenetworkstudios.com
                  </a>
                </p>
                <p>
                  Hotline:{" "}
                  <a href="tel:+6589504835" style={{ color: C.black, textDecoration: "underline" }}>
                    +65 8950 4835
                  </a>
                </p>
              </div>
            </div>

            <p
              className="text-[15px] leading-[1.75] mt-6"
              style={{ color: C.ink, fontFamily: sans }}
            >
              We will acknowledge receipt of your enquiry and aim to respond within thirty (30)
              days. If you are not satisfied with our response, you have the right to lodge a
              complaint with the Personal Data Protection Commission of Singapore (
              <a
                href="https://www.pdpc.gov.sg"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.black, textDecoration: "underline" }}
              >
                www.pdpc.gov.sg
              </a>
              ).
            </p>

            <p
              className="text-[12px] mt-10 text-center"
              style={{ color: C.grayLight, fontFamily: sans, letterSpacing: "0.04em" }}
            >
              — End of Privacy Policy —
            </p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
