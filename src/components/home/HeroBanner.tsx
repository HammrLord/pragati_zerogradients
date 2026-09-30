'use client';

import { useSiteLanguage } from '@/lib/site-language';

const COPY = {
  en: {
    eyebrow: 'Skill Development & Entrepreneurship Department',
    title: 'Training linked to local work',
    body: 'Looking for work or hiring people? Tell us in your own words. We will ask a few simple questions to help you get started.',
    primary: 'Make my work profile',
    secondary: 'Describe a job',
  },
  hi: {
    eyebrow: 'कौशल विकास और उद्यमिता विभाग',
    title: 'अपने ज़िले के काम के लिए प्रशिक्षण',
    body: 'काम चाहिए या लोगों को काम देना है? अपनी बात बताएँ। शुरुआत के लिए हम कुछ आसान सवाल पूछेंगे।',
    primary: 'मेरी काम की जानकारी बनाएँ',
    secondary: 'नौकरी के बारे में बताएँ',
  },
  mr: {
    eyebrow: 'कौशल्य विकास आणि उद्योजकता विभाग',
    title: 'आपल्या जिल्ह्यातील कामासाठी प्रशिक्षण',
    body: 'काम हवे आहे किंवा लोकांना काम द्यायचे आहे? तुमच्या शब्दांत सांगा. सुरुवातीसाठी आम्ही काही सोपे प्रश्न विचारू.',
    primary: 'माझ्या कामाची माहिती तयार करा',
    secondary: 'नोकरीबद्दल सांगा',
  },
} as const;

export function HeroBanner({ onStartCandidate, onStartBusiness }: { onStartCandidate: () => void; onStartBusiness: () => void }) {
  const language = useSiteLanguage();
  const copy = COPY[language];

  return <section className="bg-[var(--surface-alt)] border-b border-[var(--border)]">
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:py-10">
      <p className="text-[12px] font-semibold text-[var(--ink-secondary)]">{copy.eyebrow}</p>
      <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold text-[var(--gov-navy)] mt-2 max-w-3xl">{copy.title}</h1>
      <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)] mt-3 max-w-2xl">{copy.body}</p>
      <div className="flex flex-wrap gap-2 mt-5">
        <button type="button" onClick={onStartCandidate} className="inline-flex items-center min-h-11 bg-[var(--gov-navy)] text-white px-4 py-2.5 text-[14px] font-semibold focus-ring">{copy.primary}</button>
        <button type="button" onClick={onStartBusiness} className="inline-flex items-center min-h-11 border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] px-4 py-2.5 text-[14px] font-semibold focus-ring">{copy.secondary}</button>
      </div>
    </div>
  </section>;
}
