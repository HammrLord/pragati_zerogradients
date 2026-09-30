'use client';

import Link from 'next/link';
import { useSiteLanguage } from '@/lib/site-language';

const COPY = {
  student: {
    hi: { title: 'अपनी काम की जानकारी बोलकर बनाएँ', description: 'सहायक एक-एक आसान सवाल पूछेगा। आप बोलें या लिखें, फिर अपने जवाब जाँचें।', steps: ['अपना काम बताएँ', 'जवाब जाँचें', 'आगे का रास्ता देखें'], action: 'शुरू करें' },
    mr: { title: 'तुमची कामाची माहिती बोलून तयार करा', description: 'सहाय्यक एकावेळी एक सोपा प्रश्न विचारेल. बोला किंवा लिहा, मग उत्तरे तपासा.', steps: ['तुमचे काम सांगा', 'उत्तरे तपासा', 'पुढचा मार्ग पहा'], action: 'सुरू करा' },
  },
  business: {
    hi: { title: 'आप किस काम के लिए लोग रखना चाहते हैं?', description: 'सहायक काम, जगह, हुनर और तनख्वाह पूछकर आपकी नौकरी की जानकारी तैयार करेगा।', steps: ['नौकरी बताएँ', 'जानकारी जाँचें', 'डेमो सूची बनाएँ'], action: 'नौकरी बताएँ' },
    mr: { title: 'तुम्हाला कोणत्या कामासाठी माणसे हवी आहेत?', description: 'सहाय्यक काम, ठिकाण, कौशल्ये आणि पगार विचारून नोकरीची माहिती तयार करेल.', steps: ['नोकरी सांगा', 'माहिती तपासा', 'डेमो यादी तयार करा'], action: 'नोकरी सांगा' },
  },
} as const;

export function LanguageWelcome({ role }: { role: 'student' | 'business' }) {
  const language = useSiteLanguage();
  if (language === 'en') return null;
  const copy = COPY[role][language];
  return <section className="gov-card p-5 mb-5">
    <h2 className="text-[18px] font-bold text-[var(--gov-navy)]">{copy.title}</h2>
    <p className="text-[14px] text-[var(--ink-secondary)] mt-1">{copy.description}</p>
    <ol className="grid sm:grid-cols-3 border border-[var(--border)] mt-4">
      {copy.steps.map((step, index) => <li key={step} className="p-3 border-b sm:border-b-0 sm:border-r last:border-0 border-[var(--border)] text-[13px] font-medium text-[var(--ink)]">
        <span className="mr-2 font-bold text-[var(--ink-tertiary)]">{String(index + 1).padStart(2, '0')}</span>{step}
      </li>)}
    </ol>
    <Link href={`/dashboard/${role}/onboarding`} className="inline-flex mt-4 bg-[var(--gov-navy)] px-4 py-2.5 text-white text-[14px] font-semibold focus-ring">{copy.action} →</Link>
  </section>;
}
