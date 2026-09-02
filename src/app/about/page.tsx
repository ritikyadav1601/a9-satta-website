"use client";

import { useLanguage, t } from "@/context/LanguageContext";

export default function AboutPage() {
  const { lang } = useLanguage();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">
          {t("SattaTodayResult.com के बारे में", "About SattaTodayResult.com", lang)}
        </h1>

        <div className="space-y-5 text-sm md:text-base text-gray-600 leading-relaxed">
          <p>
            {t(
              "SattaTodayResult.com ऑनलाइन लाइव सट्टा टुडे रिजल्ट रिजल्ट देखने के लिए सबसे तेज़ और भरोसेमंद प्लेटफॉर्म में से एक है। हम गली, देसावर, गाज़ियाबाद, फरीदाबाद, श्री गणेश, दिल्ली बाजार और कई अन्य क्षेत्रीय बाजारों सहित 100+ गेम्स के लिए रियल-टाइम अपडेट प्रदान करते हैं।",
              "SattaTodayResult.com is one of the fastest and most reliable platforms for checking live Satta Today Result results online. We provide real-time updates for over 100+ games including Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar and many more regional markets.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हमारा मिशन", "Our Mission", lang)}
          </h2>
          <p>
            {t(
              "हमारा लक्ष्य सट्टा टुडे रिजल्ट रिजल्ट तक सटीक, तुरंत और मुफ्त पहुँच प्रदान करना है। हम समझते हैं कि समय मायने रखता है, इसलिए हमारा प्लेटफॉर्म रिजल्ट आधिकारिक रूप से घोषित होते ही तुरंत दिखाने के लिए बनाया गया है।",
              "Our goal is to provide accurate, instant, and free access to Satta Today Result results. We understand that timing matters, which is why our platform is built to deliver results the exact moment they are officially declared.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हम क्या प्रदान करते हैं", "What We Offer", lang)}
          </h2>
          <ul className="list-none space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("लाइव रिजल्ट:", "Live Results:", lang)}</strong>{" "}
                {t("पूरे भारत में 100+ गेम्स के रियल-टाइम अपडेट।", "Real-time updates for 100+ games across India.", lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("चार्ट रिकॉर्ड:", "Chart Records:", lang)}</strong>{" "}
                {t(`2015 से ${new Date().getFullYear()} तक के व्यापक मंथली चार्ट रिकॉर्ड।`, `Comprehensive monthly chart records from 2015 to ${new Date().getFullYear()}.`, lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("मोबाइल फ्रेंडली:", "Mobile Friendly:", lang)}</strong>{" "}
                {t("सभी डिवाइसों के लिए ऑप्टिमाइज़्ड — स्मार्टफोन, टैबलेट और डेस्कटॉप।", "Optimized for all devices — smartphones, tablets, and desktops.", lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("100% मुफ्त:", "100% Free:", lang)}</strong>{" "}
                {t("कोई रजिस्ट्रेशन नहीं, कोई छुपे शुल्क नहीं।", "No registration, no hidden charges, no ads blocking your results.", lang)}
              </span>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हमारी टेक्नोलॉजी", "Our Technology", lang)}
          </h2>
          <p>
            {t(
              "SattaTodayResult.com आधुनिक वेब टेक्नोलॉजी से संचालित है जो बिजली की तेज़ी से पेज लोड और रियल-टाइम डेटा अपडेट सुनिश्चित करती है। हमारा ऑटोमेटेड सिस्टम लगातार आधिकारिक स्रोतों की निगरानी करता है और रिजल्ट घोषित होने के कुछ सेकंड के भीतर अपडेट करता है।",
              "SattaTodayResult.com is powered by modern web technologies that ensure lightning-fast page loads and real-time data updates. Our automated systems continuously monitor official sources and update results within seconds of their declaration.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("महत्वपूर्ण सूचना", "Important Notice", lang)}
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {t(
              "SattaTodayResult.com पूरी तरह से एक सूचनात्मक वेबसाइट है। हम किसी भी प्रकार के जुआ, सट्टेबाजी या लॉटरी का संचालन, प्रचार या सुविधा नहीं देते। प्रदर्शित सभी डेटा केवल सूचनात्मक और शैक्षिक उद्देश्यों के लिए है। कृपया अपने क्षेत्र में लागू कानूनों का पालन करें।",
              "SattaTodayResult.com is strictly an informational website. We do not operate, promote, or facilitate any form of gambling, betting, or lottery. All data displayed is for informational and educational purposes only. Please follow the laws applicable in your region.",
              lang
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
