import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer for SattaTodayResult.com - Read our terms and conditions.",
};

export default function DisclaimerPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">Disclaimer</h1>

        <div className="space-y-5 text-sm md:text-base text-gray-600 leading-relaxed">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
            <strong>Important Legal Notice:</strong> Please read this disclaimer carefully before using SattaTodayResult.com.
          </div>

          <p>
            SattaTodayResult.com is an independent informational website that provides historical data, chart records, and result updates for various number-based games. This website is intended solely for informational, educational, and archival purposes.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">No Gambling Operations</h2>
          <p>
            SattaTodayResult.com does not own, operate, manage, or facilitate any form of online or offline gambling, lottery, betting, or satta matka operations. We are not associated with any game operators or organizers.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Legal Compliance</h2>
          <p>
            Participation in gambling activities may be illegal, restricted, or completely banned under the jurisdiction of your local, state, or national laws. We strongly advise all visitors to comply with their respective regional regulations before engaging in any such activities.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">No Financial Advice</h2>
          <p>
            The data and information provided on this website should not be construed as financial advice, investment guidance, or encouragement to participate in any monetary transactions related to gambling.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Accuracy of Information</h2>
          <p>
            While we strive to provide accurate and up-to-date information, SattaTodayResult.com makes no guarantees regarding the accuracy, completeness, or reliability of any data displayed on this platform. Users should verify all information independently.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-2">User Responsibility</h2>
          <p>
            By using this website, you acknowledge that you are solely responsible for your actions. SattaTodayResult.com shall not be held liable for any losses, damages, or legal consequences arising from the use of information provided on this platform.
          </p>

          <p className="text-xs text-gray-400 pt-4">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
