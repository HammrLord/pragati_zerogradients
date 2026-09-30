'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSiteLanguage } from '@/lib/site-language';

type Page = 'about' | 'schemes';

const COPY = {
  about: {
    en: { eyebrow: 'About', title: 'About the Mission', description: 'What the mission does, who runs it, and the rules it follows.', steps: ['Find work that employers really need', 'Choose training that teaches useful skills', 'Get help in your own language'], action: 'Ask for help' },
    hi: { eyebrow: 'हमारे बारे में', title: 'यह पोर्टल कैसे मदद करता है', description: 'यह डेमो आपको काम, प्रशिक्षण और मदद की जानकारी एक जगह देता है।', steps: ['अपने ज़िले में असली काम देखें', 'काम के लिए सही कोर्स चुनें', 'अपनी भाषा में बोलकर मदद लें'], action: 'बोलकर मदद लें' },
    mr: { eyebrow: 'आमच्याबद्दल', title: 'हे पोर्टल कशी मदत करते', description: 'हा डेमो तुम्हाला काम, प्रशिक्षण आणि मदतीची माहिती एकाच ठिकाणी देतो.', steps: ['आपल्या जिल्ह्यातील खरी कामे पहा', 'कामासाठी योग्य अभ्यासक्रम निवडा', 'आपल्या भाषेत बोलून मदत घ्या'], action: 'बोलून मदत घ्या' },
  },
  schemes: {
    en: { eyebrow: 'Schemes', title: 'Central & State Schemes', description: 'Government training schemes connected to the courses on this portal.', steps: ['Choose a course', 'Check which scheme supports it', 'Ask for help before applying'], action: 'Find a course' },
    hi: { eyebrow: 'सरकारी योजनाएँ', title: 'प्रशिक्षण के लिए सरकारी योजनाएँ', description: 'कुछ कोर्स के लिए सरकारी मदद मिलती है। नीचे योजना का नाम और उससे जुड़े कोर्स देखें।', steps: ['पहले अपना कोर्स चुनें', 'उस कोर्स से जुड़ी योजना देखें', 'आवेदन से पहले मदद माँगें'], action: 'कोर्स खोजें' },
    mr: { eyebrow: 'सरकारी योजना', title: 'प्रशिक्षणासाठी सरकारी योजना', description: 'काही अभ्यासक्रमांना सरकारी मदत मिळते. खाली योजनेचे नाव आणि त्यातील अभ्यासक्रम पहा.', steps: ['आधी तुमचा अभ्यासक्रम निवडा', 'त्या अभ्यासक्रमाची योजना पहा', 'अर्ज करण्याआधी मदत विचारा'], action: 'अभ्यासक्रम शोधा' },
  },
} as const;

export function LocalizedResourceIntro({ page }: { page: Page }) {
  const language = useSiteLanguage();
  const copy = COPY[page][language];
  return <>
    <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description}
      breadcrumb={[{ label: language === 'hi' ? 'मुख्य पृष्ठ' : language === 'mr' ? 'मुख्यपृष्ठ' : 'Home', href: '/' }, { label: copy.eyebrow }]} />
    {language !== 'en' && <div className="gov-card p-4 mb-5">
      <ol className="grid sm:grid-cols-3 border border-[var(--border)]">
        {copy.steps.map((step, index) => <li key={step} className="p-3 border-b sm:border-b-0 sm:border-r last:border-0 border-[var(--border)] text-[13px] font-medium text-[var(--ink)]">
          <span className="mr-2 font-bold text-[var(--ink-tertiary)]">{String(index + 1).padStart(2, '0')}</span>{step}
        </li>)}
      </ol>
      <Link href={page === 'about' ? '/help' : '/courses'} className="inline-flex mt-4 bg-[var(--gov-navy)] px-4 py-2.5 text-white font-semibold text-[14px] focus-ring">{copy.action} →</Link>
    </div>}
  </>;
}
