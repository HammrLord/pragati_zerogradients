'use client';

import Link from 'next/link';
import { Emblem } from './Emblem';
import { localize, useSiteLanguage } from '@/lib/site-language';

const FOOTER_LINKS = [
  { label: 'Register', href: '/register' },
  { label: 'Courses', href: '/courses' },
  { label: 'Help & complaints', href: '/help' },
  { label: 'Officer login', href: '/gov' },
  { label: 'Accessibility', href: '/about' },
];

export function SiteFooter() {
  const language = useSiteLanguage();
  const names = language === 'hi'
    ? ['पंजीकरण', 'कोर्स', 'मदद और शिकायत', 'अधिकारी लॉग इन', 'सुलभता']
    : language === 'mr'
      ? ['नोंदणी', 'अभ्यासक्रम', 'मदत आणि तक्रार', 'अधिकारी लॉग इन', 'सुलभता']
      : FOOTER_LINKS.map(link => link.label);
  return (
    <footer className="mt-auto no-print">
      <div className="h-[3px] tricolour-bar" />
      <div className="bg-[var(--gov-navy)] text-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Emblem size={30} className="text-white shrink-0" />
            <p className="text-[12px] text-slate-300 leading-relaxed">
              <strong className="block text-[14px] text-white">प्रgati</strong>
              {localize(language, 'Govt. of Maharashtra · Helpline', 'महाराष्ट्र शासन · हेल्पलाइन', 'महाराष्ट्र शासन · मदत क्रमांक')} <span className="mono text-white">1800-233-0202</span>
            </p>
          </div>
          <nav aria-label="Footer links" className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link, index) => <Link key={link.label} href={link.href} className="text-[12px] text-slate-300 hover:text-white hover:underline underline-offset-2 focus-ring">{names[index]}</Link>)}
          </nav>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto max-w-[1400px] px-4 py-2.5 text-[11px] text-slate-400 flex flex-wrap justify-between gap-2">
            <span>© {new Date().getFullYear()} {localize(language, 'Department of Skill, Employment, Entrepreneurship & Innovation.', 'कौशल, रोज़गार, उद्यमिता और नवाचार विभाग।', 'कौशल्य, रोजगार, उद्योजकता आणि नवोपक्रम विभाग.')}</span>
            <span>{localize(language, 'Prototype data for Smart India Hackathon 2026.', 'स्मार्ट इंडिया हैकाथॉन 2026 के लिए नमूना जानकारी।', 'स्मार्ट इंडिया हॅकाथॉन २०२६ साठी नमुना माहिती.')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
