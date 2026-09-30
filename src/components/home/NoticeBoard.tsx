'use client';

import Link from 'next/link';
import { localize, useSiteLanguage } from '@/lib/site-language';

const NOTICES = [
  { date: '10 Sep 2026', text: 'Winter 2026 intake — online registration for ITI and PMKVY 4.0 short-term courses opens across all six pilot districts.', isNew: true, href: '/courses' },
  { date: '09 Sep 2026', text: 'Welding practicals will now be marked by machine readings, not by hand.', isNew: true, href: '/about' },
  { date: '06 Sep 2026', text: 'Thane smart-building batch: businesses can still join until 30 September 2026.', isNew: true, href: '/register?role=business' },
  { date: '02 Sep 2026', text: 'Free skill-certification camps in Kolhapur and Chhatrapati Sambhajinagar, 21–28 September.', isNew: false, href: '/register?role=student' },
  { date: '30 Aug 2026', text: 'Motor mechanic course updated: carburettor topics replaced with modern fuel-injection.', isNew: false, href: '/about#pillars' },
  { date: '25 Aug 2026', text: 'Factories can now rent out machines they are not using for training.', isNew: false, href: '/register?role=business' },
  { date: '18 Aug 2026', text: 'Multilingual IVR helpline 1800-233-0202 now live in Marathi, Hindi, English and Urdu.', isNew: false, href: '/help' },
];

export function NoticeBoard() {
  const language = useSiteLanguage();
  const translated = language === 'hi'
    ? ['छह ज़िलों में आईटीआई और छोटे कोर्स के लिए सर्दियों का पंजीकरण खुला है।', 'वेल्डिंग के अभ्यास की जाँच अब मशीन से होगी।', 'ठाणे में प्रशिक्षण समूह से उद्योग 30 सितंबर तक जुड़ सकते हैं।']
    : language === 'mr'
      ? ['सहा जिल्ह्यांत आयटीआय आणि अल्पकालीन अभ्यासक्रमांसाठी हिवाळी नोंदणी सुरू आहे.', 'वेल्डिंगच्या सरावाचे गुण आता यंत्राद्वारे तपासले जातील.', 'ठाण्यातील प्रशिक्षण गटात उद्योग ३० सप्टेंबरपर्यंत सहभागी होऊ शकतात.']
      : null;
  return (
    <div className="gov-card">
      <header className="gov-card-head">
        <h2 className="gov-card-title">{localize(language, 'Notices & Circulars', 'नई सूचनाएँ', 'नवीन सूचना')}</h2>
        <Link href="/about" className="text-[11.5px] gov-link font-semibold">{localize(language, 'View all', 'सभी देखें', 'सर्व पहा')}</Link>
      </header>

      <ul>{NOTICES.slice(0, 3).map((n, index) => <li key={n.date} className="border-b border-[var(--border)] last:border-0"><Link href={n.href} className="block px-4 py-3 hover:bg-[var(--accent-officer-light)] focus-ring"><div className="flex items-center gap-2 mb-1"><span className="text-[10.5px] mono text-[var(--ink-tertiary)]">{n.date}</span>{n.isNew && <span className="text-[9.5px] font-bold uppercase tracking-wide text-white bg-[var(--signal-declining)] px-1.5 py-[1px] rounded-sm">{localize(language, 'New', 'नया', 'नवीन')}</span>}</div><p className="text-[12.5px] leading-snug text-[var(--ink)]">{translated?.[index] ?? n.text}</p></Link></li>)}</ul>
    </div>
  );
}
