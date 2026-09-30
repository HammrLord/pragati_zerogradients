'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useGuide } from '@/lib/guide';
import { pageGuideFor } from '@/data/guides';
import { localize, useSiteLanguage } from '@/lib/site-language';

/** A small, persistent link to page guidance and the published helpline. */
export function GuideLauncher() {
  const pathname = usePathname();
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const { availableTour, start, seen, resetSeen } = useGuide();
  const [open, setOpen] = useState(false);
  const guide = pageGuideFor(pathname);

  return <div className="fixed bottom-4 right-4 z-[60] no-print">
    {open && <div className="absolute bottom-full right-0 mb-2 w-[min(340px,calc(100vw-2rem))] bg-white border border-[var(--border-strong)] shadow-md" role="dialog" aria-label={tr('Help', 'मदद', 'मदत')}>
      <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
        <h2 className="text-[15px] font-bold text-[var(--gov-navy)]">{tr('Help on this page', 'इस पेज पर मदद', 'या पानावर मदत')}</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-semibold gov-link focus-ring">{tr('Close', 'बंद करें', 'बंद करा')}</button>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {availableTour && <button type="button" onClick={() => { setOpen(false); start(); }} className="block w-full text-left p-4 hover:bg-[var(--surface-alt)] focus-ring">
          <span className="block text-[14px] font-semibold text-[var(--ink)]">{seen.includes(availableTour.id) ? tr('Repeat the walkthrough', 'फिर से तरीका देखें', 'पुन्हा मार्गदर्शन पहा') : tr('Show me how', 'तरीका दिखाएँ', 'कसे करायचे ते दाखवा')}</span>
          <span className="block text-[12px] text-[var(--ink-secondary)] mt-1">{tr('A short tour of this page', 'इस पेज की छोटी जानकारी', 'या पानाची थोडक्यात माहिती')}</span>
        </button>}
        {guide && <a href="#page-guide" onClick={() => setOpen(false)} className="block p-4 hover:bg-[var(--surface-alt)] focus-ring">
          <span className="block text-[14px] font-semibold text-[var(--ink)]">{tr('Read the page guide', 'पेज का तरीका पढ़ें', 'पानावरील मार्गदर्शन वाचा')}</span>
        </a>}
        <a href="tel:18002330202" className="block p-4 hover:bg-[var(--surface-alt)] focus-ring">
          <span className="block text-[14px] font-semibold text-[var(--ink)]">{tr('Call the helpline', 'हेल्पलाइन पर फोन करें', 'मदत क्रमांकावर फोन करा')}</span>
          <span className="block text-[12px] text-[var(--ink-secondary)] mt-1">1800-233-0202</span>
        </a>
        {seen.length > 0 && <button type="button" onClick={resetSeen} className="block w-full text-left p-4 text-[12px] text-[var(--ink-secondary)] hover:bg-[var(--surface-alt)] focus-ring">
          {tr('Reset page guides', 'फिर से मार्गदर्शन दिखाएँ', 'मार्गदर्शन पुन्हा दाखवा')}
        </button>}
      </div>
    </div>}
    <button type="button" data-guide="guide-launcher" onClick={() => setOpen(value => !value)} aria-expanded={open} className="border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] px-4 py-2.5 text-[14px] font-semibold shadow-sm focus-ring">
      {tr('Help', 'मदद', 'मदत')}
    </button>
  </div>;
}
