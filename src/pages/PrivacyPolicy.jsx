import React from 'react';

const sections = [
  {
    title: '1. Overview',
    body: [
      'BNC LEG Partners is a partner onboarding and collaboration portal operated by BNC LEG. This Privacy Policy explains what information we collect, how we use it, and how we protect it when you use this website, create an account, submit forms, or sign in.'
    ]
  },
  {
    title: '2. Information We Collect',
    body: [
      'We may collect information you provide directly, including your name, email address, phone number, company details, country, city, profile details, onboarding responses, enquiry content, and any files or voice notes you choose to submit.'
    ]
  },
  {
    title: '3. How We Use Information',
    body: [
      'We use collected information to create and manage partner accounts, authenticate users, complete onboarding, respond to partnership enquiries, coordinate service discussions, maintain account security, and operate the portal.'
    ]
  },
  {
    title: '4. Sharing of Information',
    body: [
      'We may share information with service providers that help us operate the portal, such as hosting, authentication, database, storage, analytics, and communications providers, but only as needed to run the service.',
      'We may also disclose information when required by law, to enforce our agreements, or to protect the rights, security, and operations of BNC LEG, our users, or the public.'
    ]
  },
  {
    title: '5. Data Retention',
    body: [
      'We retain information for as long as needed to provide the portal, maintain business records, resolve disputes, enforce agreements, and meet legal or operational obligations. Retention periods may vary based on the nature of the data and the services involved.'
    ]
  },
  {
    title: '6. Security',
    body: [
      'We use reasonable administrative, technical, and organizational measures to protect personal information against unauthorized access, loss, misuse, or alteration. No method of storage or transmission is completely secure, so absolute security cannot be guaranteed.'
    ]
  },
  {
    title: '7. Your Choices',
    body: [
      'You may contact us to request updates or deletion of account information, subject to legal, contractual, and operational requirements.'
    ]
  },
  {
    title: '8. Third-Party Services',
    body: [
      'This portal may rely on third-party infrastructure and may link to third-party websites. Their privacy practices are governed by their own policies, and we encourage you to review them separately.'
    ]
  },
  {
    title: '9. Contact',
    body: [
      'If you have questions about this Privacy Policy or our data practices, contact us at info@bncglobal.in.'
    ]
  }
];

const PrivacyPolicy = () => {
  return (
    <section className="bg-[#F5F5F7] py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="font-poppins text-sm font-semibold uppercase tracking-[0.24em] text-[#DC2626]">
            Legal
          </p>
          <h1 className="mt-3 font-sora text-3xl font-semibold text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 font-geist text-sm text-slate-500">
            Effective Date: April 6, 2026
          </p>
          <p className="mt-6 font-geist text-base leading-7 text-slate-700">
            This policy explains how personal information is handled when you use the BNC LEG partner portal.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-poppins text-xl font-semibold text-slate-900">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="font-geist text-base leading-7 text-slate-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
