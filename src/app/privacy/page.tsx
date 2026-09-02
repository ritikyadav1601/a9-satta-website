import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for SattaTodayResult.com",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>

        <div className="space-y-5 text-sm md:text-base text-gray-600 leading-relaxed">
          <p>
            At <strong className="text-gray-900">SattaTodayResult.com</strong>, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit our website.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Information We Collect</h2>
          <p>
            We may collect non-personal information automatically when you visit our website, including:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
            <li>IP address (anonymized)</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 pt-2">How We Use Information</h2>
          <p>The information we collect is used to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Improve our website and user experience</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Ensure website security and prevent abuse</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Cookies</h2>
          <p>
            Our website may use cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings, though this may affect some website functionality.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Third-Party Services</h2>
          <p>
            We may use third-party analytics services (such as Google Analytics) that collect and process data on our behalf. These services have their own privacy policies governing the use of your information.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Data Security</h2>
          <p>
            We implement reasonable security measures to protect your information. However, no method of internet transmission is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Changes to This Policy</h2>
          <p>
            We reserve the right to update this Privacy Policy at any time. Any changes will be posted on this page with an updated date.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our website or via WhatsApp.
          </p>

          <p className="text-xs text-gray-400 pt-4">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
