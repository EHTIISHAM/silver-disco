const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>

      <p className="mb-4">
        Welcome to <strong>PinballRace.com</strong>. We are dedicated to
        safeguarding your privacy and handling your personal information with care
        and respect. This Privacy Policy provides detailed information on how we
        collect, use, disclose, and protect your data when you interact with our
        website and services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-2">Our collection of personal information is aimed at enhancing your experience and may include, but is not limited to:</p>
      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>Personal Identification Information:</strong> This includes your
          name, email address, TikTok account details, and any other information you
          voluntarily provide when registering or participating in our services.
        </li>
        <li>
          <strong>Demographic Information:</strong> We may also collect demographic
          information such as age, gender, and interests, which helps us better
          understand our user base.
        </li>
        <li>
          <strong>Technical and Usage Data:</strong> This encompasses data about how
          you access and use our website, including your IP address, browser type,
          device information, pages viewed, and usage patterns.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Manage Your Account:</strong> To create and manage your user account on PinballRace.com.</li>
        <li><strong>Customer Support:</strong> To provide assistance and respond to your inquiries.</li>
        <li><strong>Marketing Communications:</strong> With your consent, we send promotional emails and offers. You can opt out of these communications at any time.</li>
        <li><strong>Website Improvement:</strong> To enhance our website&apos;s functionality and user experience.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Sharing of Your Information</h2>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Service Providers:</strong> With third parties who perform services on our behalf, such as hosting, data analysis, and marketing assistance.</li>
        <li><strong>Legal Obligations:</strong> When required by law or to respond to legal processes or governmental requests.</li>
        <li><strong>Marketing Partners:</strong> With your consent, we may share your information with partners or advertisers for marketing purposes.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Third-Party Websites</h2>
      <p className="mb-4">
        Our website may include links to third-party sites. We are not responsible
        for their privacy practices and encourage you to review their privacy
        policies.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Security of Your Information</h2>
      <p className="mb-4">
        We employ various security measures to protect your personal information but
        cannot guarantee absolute security due to the inherent nature of the
        internet.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Data Protection Rights</h2>
      <p className="mb-2">
        Under GDPR, you have rights including access, rectification, erasure,
        restriction of processing, objection to processing, and data portability.
        Contact us to exercise these rights.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update this policy periodically. Changes will be posted on this page
        with an updated revision date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
      <p className="mb-4">
        For questions or concerns about this Privacy Policy, please contact us at{" "}
        <a href="mailto:contact@pinballrace.com" className="text-blue-600 hover:underline">
          contact@pinballrace.com
        </a>.
      </p>

      <div className="mt-10 text-center">
        <a
          href="/privacy_policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Download PDF Version
        </a>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
