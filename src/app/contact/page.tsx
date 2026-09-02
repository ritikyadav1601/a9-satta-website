"use client";

import { FaWhatsapp } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { useLanguage, t } from "@/context/LanguageContext";

export default function ContactPage() {
  const phone = "918901302607";
  const { lang } = useLanguage();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
          {t("संपर्क करें", "Contact Us", lang)}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {t("SattaTodayResult.com टीम से संपर्क करें", "Get in touch with SattaTodayResult.com team", lang)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* WhatsApp Card */}
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent("Satta Today Result")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-lg hover:border-green-300 transition-all group"
          >
            <div className="p-3 rounded-xl bg-green-500 text-white shrink-0 group-hover:scale-110 transition-transform">
              <FaWhatsapp size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">WhatsApp</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {t("तुरंत चैट करें", "Chat with us instantly", lang)}
              </p>
              <p className="text-green-600 font-bold text-sm mt-2">+{phone}</p>
            </div>
          </a>

          {/* Phone Card */}
          <a
            href={`tel:+${phone}`}
            className="bg-brand-50 rounded-2xl border border-brand-200 p-5 flex items-start gap-4 hover:shadow-lg hover:border-brand-400 transition-all group"
          >
            <div className="p-3 rounded-xl bg-brand-100 text-slate-900 shrink-0 group-hover:scale-110 transition-transform">
              <FiPhone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{t("फोन", "Phone", lang)}</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {t("सीधे कॉल करें", "Call us directly", lang)}
              </p>
              <p className="text-brand-700 font-bold text-sm mt-2">+{phone}</p>
            </div>
          </a>

        </div>

        {/* WhatsApp CTA */}
        <div className="bg-brand-ink border-2 border-brand-400 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-white font-bold text-lg mb-1">
            {t("गेम खेलने के लिए संपर्क करें", "Game play karne ke liye contact kare", lang)}
          </p>
          <p className="text-brand-400 font-black text-2xl mb-4">Satta Today Result</p>
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent("Satta Today Result")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black text-lg px-8 py-3.5 rounded-2xl shadow-xl shadow-green-500/25 transition-all hover:scale-105"
          >
            <FaWhatsapp className="w-7 h-7" />
            <div className="text-left">
              <div className="text-lg font-black leading-tight">WhatsApp Now</div>
              <div className="text-xs font-semibold opacity-80">
                {t("तुरंत चैट करने के लिए क्लिक करें", "Click to chat instantly", lang)}
              </div>
            </div>
          </a>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
          <strong>{t("अस्वीकरण:", "Disclaimer:", lang)}</strong>{" "}
          {t(
            "SattaTodayResult.com केवल एक सूचनात्मक वेबसाइट है। हम किसी भी प्रकार के जुए को बढ़ावा नहीं देते। कृपया अपने स्थानीय कानूनों का पालन करें।",
            "SattaTodayResult.com is an informational website only. We do not promote or facilitate gambling in any form. Please follow your local laws.",
            lang
          )}
        </div>
      </div>
    </div>
  );
}
