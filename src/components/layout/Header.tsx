"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  // { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-black text-white shadow-lg border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-0 md:px-4">
        <div className="flex flex-col md:h-20 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="block w-full md:w-auto"
            aria-label="Satta Online Result home"
          >
            <Image
              src="/logo-header.png"
              alt="Satta Online Result"
              width={1942}
              height={809}
              priority
              className="h-28 w-full object-cover md:h-20 md:w-[430px]"
            />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                    active
                      ? "bg-yellow-200 text-black shadow-md"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

        </div>

        <div className="flex h-11 items-center justify-between border-t border-yellow-200/40 bg-black px-3 text-white md:hidden">
          <span className="text-xs font-black uppercase tracking-[0.2em]">Menu</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-9 w-11 items-center justify-center rounded-lg border border-yellow-200/60 bg-black text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            id="mobile-navigation"
            className="mx-3 border-t border-white/20 py-2 md:hidden"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-yellow-200 text-black"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Yellow marquee bar */}
      <div className="bg-black text-yellow-100 py-1 overflow-hidden w-full">
        <div className="animate-marquee whitespace-nowrap text-[10px] md:text-xs font-bold">
          {lang === "hi"
            ? "SattaOnlineResult.com में आपका स्वागत है — सुपरफास्ट लाइव A7 सट्टा रिजल्ट • गली, देसावर, गाज़ियाबाद, फरीदाबाद, श्री गणेश, दिल्ली बाजार • 100+ गेम्स • फ्री मंथली चार्ट रिकॉर्ड 2015-2026 • हर मिनट अपडेट"
            : "Welcome to SattaOnlineResult.com — Superfast Live A7 Satta Results • Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar • 100+ Games • Free Monthly Chart Records 2015-2026 • Updated Every Minute"}
        </div>
      </div>
    </header>
  );
}
