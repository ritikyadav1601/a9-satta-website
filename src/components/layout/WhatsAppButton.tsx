// "use client";

// import { FaWhatsapp } from "react-icons/fa";
// import { getWhatsAppLink } from "@/lib/utils";
// import { useLanguage } from "@/context/LanguageContext";

// export function WhatsAppButton() {
//   const phone = "918901302607";
//   const { lang, toggleLang } = useLanguage();

//   return (
//     <div className="fixed bottom-4 right-3 md:bottom-6 md:right-6 z-50 flex flex-col items-center gap-2.5">
//       {/* Language Toggle */}
//       <button
//         onClick={toggleLang}
//         className="bg-[#1a1a2e] text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-black/20 text-sm font-bold border border-white/15 hover:bg-[#2a2a4e] transition-all hover:scale-105 active:scale-95"
//       >
//         {lang === "hi" ? "A→अ" : "अ→A"}
//       </button>

//       {/* WhatsApp */}
//       <a
//         href={getWhatsAppLink(phone, "A7 SATTA")}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="animate-float bg-green-500 hover:bg-green-600 text-white p-3.5 md:p-4 rounded-2xl shadow-xl shadow-green-500/30 transition-all hover:scale-110 block"
//         aria-label="Chat on WhatsApp"
//       >
//         <FaWhatsapp className="w-6 h-6 md:w-8 md:h-8" />
//       </a>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export function WhatsAppButton() {
  const { lang, toggleLang } = useLanguage();

  const [phone, setPhone] = useState("918708328760");

  useEffect(() => {
    const fetchKhaiwal = async () => {
      try {
        const res = await fetch("/api/custom-games");
        const data = await res.json();

        if (data?.khaiwal?.whatsapp) {
          setPhone(data.khaiwal.whatsapp);
        }
      } catch (err) {
        console.log("khaiwal fetch error", err);
      }
    };

    fetchKhaiwal();
  }, []);

  return (
    <div className="fixed bottom-4 right-3 md:bottom-6 md:right-6 z-50 flex flex-col items-center gap-2.5">
      
      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="bg-neutral-950 text-yellow-100 px-4 py-2.5 rounded-2xl shadow-xl shadow-black/20 text-sm font-bold border border-yellow-200/60 hover:bg-yellow-200 hover:text-black transition-all hover:scale-105 active:scale-95"
      >
        {lang === "hi" ? "A→अ" : "अ→A"}
      </button>

      {/* WhatsApp */}
      <a
        href={getWhatsAppLink(phone, "A7 SATTA")}
        target="_blank"
        rel="noopener noreferrer"
        className="animate-float bg-green-500 hover:bg-green-600 text-white p-3.5 md:p-4 rounded-2xl shadow-xl shadow-green-500/30 transition-all hover:scale-110 block"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="w-6 h-6 md:w-8 md:h-8" />
      </a>
    </div>
  );
}
