'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/gov/SiteHeader';
import { SiteFooter } from '@/components/gov/SiteFooter';
import { PageHeader } from '@/components/ui/PageHeader';
import { localize, useSiteLanguage, type SiteLanguage } from '@/lib/site-language';

const FAQ: Record<SiteLanguage, { question: string; answer: string }[]> = {
  en: [
    { question: 'Can I get a certificate for work I already know?', answer: 'Yes. You can explore “Certificate for my work” after signing in as a candidate. The demo explains the steps; it does not issue a real certificate.' },
    { question: 'Where can I see jobs or courses near me?', answer: 'Sign in as a candidate and open “Jobs near me” or “Courses for you”. You can also ask the guide to explain these pages.' },
    { question: 'I have a problem with training or work. What should I do?', answer: 'Tap “Tell us your problem” to make a note. For a formal complaint, call the published helpline or visit your district skill office.' },
  ],
  hi: [
    { question: 'जो काम मुझे आता है, उसका प्रमाणपत्र मिल सकता है?', answer: 'हाँ। उम्मीदवार के रूप में लॉग इन करें और “मेरे काम का प्रमाणपत्र” खोलें। यह डेमो तरीका बताता है; असली प्रमाणपत्र नहीं देता।' },
    { question: 'मेरे पास नौकरी या कोर्स कहाँ देखें?', answer: 'उम्मीदवार के रूप में लॉग इन करें और “मेरे पास की नौकरियाँ” या “मेरे लिए कोर्स” खोलें। सहायक से भी पूछ सकते हैं।' },
    { question: 'प्रशिक्षण या काम में परेशानी है। क्या करूँ?', answer: '“अपनी परेशानी बताएँ” दबाकर अपनी बात लिखें। सरकारी शिकायत के लिए हेल्पलाइन पर फोन करें या ज़िला कौशल कार्यालय जाएँ।' },
  ],
  mr: [
    { question: 'मला येत असलेल्या कामाचे प्रमाणपत्र मिळेल का?', answer: 'हो. उमेदवार म्हणून लॉग इन करा आणि “माझ्या कामाचे प्रमाणपत्र” उघडा. हा डेमो मार्ग दाखवतो; खरे प्रमाणपत्र देत नाही.' },
    { question: 'जवळची नोकरी किंवा अभ्यासक्रम कुठे पाहू?', answer: 'उमेदवार म्हणून लॉग इन करा आणि “माझ्याजवळच्या नोकऱ्या” किंवा “माझ्यासाठी अभ्यासक्रम” उघडा. सहाय्यकालाही विचारू शकता.' },
    { question: 'प्रशिक्षणात किंवा कामात अडचण आहे. काय करू?', answer: '“तुमची अडचण सांगा” दाबून तुमची गोष्ट नोंदवा. अधिकृत तक्रारीसाठी मदत क्रमांकावर फोन करा किंवा जिल्हा कौशल्य कार्यालयात जा.' },
  ],
};

export default function HelpPage() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const steps = [
    { title: tr('Tell us', 'अपनी बात बताएँ', 'तुमची गोष्ट सांगा'), detail: tr('Speak or type in your language.', 'अपनी भाषा में बोलें या लिखें।', 'आपल्या भाषेत बोला किंवा लिहा.') },
    { title: tr('Check the note', 'लिखी बात जाँचें', 'नोंद तपासा'), detail: tr('Change anything that is not right.', 'जो बात गलत है, उसे बदलें।', 'काही चूक असेल तर बदला.') },
    { title: tr('Get formal help', 'सरकारी मदद लें', 'अधिकृत मदत घ्या'), detail: tr('Call the helpline or visit a district office.', 'हेल्पलाइन पर फोन करें या ज़िला कार्यालय जाएँ।', 'मदत क्रमांकावर फोन करा किंवा जिल्हा कार्यालयात जा.') },
  ];

  return <>
    <SiteHeader />
    <main id="main-content" className="flex-1 bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <PageHeader
          eyebrow={tr('Support', 'मदद', 'मदत')}
          title={tr('Help & Grievance', 'मदद और शिकायत', 'मदत आणि तक्रार')}
          description={tr('Ask a question, or tell us about a problem. You can speak instead of typing.', 'सवाल पूछें या परेशानी बताएँ। लिखने की जगह बोल सकते हैं।', 'प्रश्न विचारा किंवा अडचण सांगा. लिहिण्याऐवजी बोलू शकता.')}
          breadcrumb={[{ label: tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ'), href: '/' }, { label: tr('Help', 'मदद', 'मदत') }]}
        />

        <section className="gov-card overflow-hidden">
          <div className="grid md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="p-5 sm:p-6">
                <h2 className="text-[20px] leading-snug font-bold text-[var(--gov-navy)]">{tr('Start a conversation', 'बात शुरू करें', 'संवाद सुरू करा')}</h2>
                <p className="text-[14px] text-[var(--ink-secondary)] mt-2 leading-relaxed">{tr('Answer a few questions by speaking or typing. You can review your note before saving it.', 'बोलकर या लिखकर कुछ सवालों के जवाब दें। सेव करने से पहले अपनी बात जाँच सकते हैं।', 'बोलून किंवा लिहून काही प्रश्नांची उत्तरे द्या. सेव्ह करण्याआधी नोंद तपासू शकता.')}</p>
                <Link href="/grievance" className="inline-flex items-center mt-4 min-h-11 px-4 bg-[var(--gov-navy)] text-white text-[14px] font-semibold hover:bg-[var(--gov-navy-light)] focus-ring">
                  {tr('Report a problem', 'अपनी परेशानी बताएँ', 'तुमची अडचण सांगा')} <span className="ml-2" aria-hidden>→</span>
                </Link>
                <p className="text-[12px] text-[var(--ink-tertiary)] mt-3">{tr('This demo does not formally file a grievance.', 'इस डेमो से सरकारी शिकायत दर्ज नहीं होती।', 'या डेमोमुळे अधिकृत तक्रार दाखल होत नाही.')}</p>
              </div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-[var(--border)] p-5 sm:p-6 bg-[var(--surface-alt)]">
              <p className="text-[13px] font-semibold text-[var(--ink)]">{tr('Helpline', 'हेल्पलाइन', 'मदत क्रमांक')}</p>
              <a href="tel:18002330202" className="block text-[23px] sm:text-[26px] font-bold mono text-[var(--gov-navy)] mt-2 gov-link">1800-233-0202</a>
              <p className="text-[13px] text-[var(--ink-secondary)] mt-2">{tr('For formal help, call or visit your district skill office.', 'सरकारी मदद के लिए फोन करें या ज़िला कौशल कार्यालय जाएँ।', 'अधिकृत मदतीसाठी फोन करा किंवा जिल्हा कौशल्य कार्यालयात जा.')}</p>
              <p className="text-[12px] text-[var(--ink-tertiary)] mt-3">{tr('Online voice: Marathi, Hindi, English. Urdu is available through the published helpline.', 'ऑनलाइन आवाज़: मराठी, हिन्दी, अंग्रेज़ी। उर्दू के लिए हेल्पलाइन पर फोन करें।', 'ऑनलाइन आवाज: मराठी, हिंदी, इंग्रजी. उर्दूसाठी मदत क्रमांकावर फोन करा.')}</p>
            </div>
          </div>
        </section>

        <section className="gov-card mt-5 p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[var(--gov-navy)] mb-3">{tr('How it works', 'यह कैसे काम करता है', 'हे कसे काम करते')}</h2>
          <ol className="grid sm:grid-cols-3 border border-[var(--border)]">
            {steps.map((step, index) => <li key={index} className="p-4 border-b sm:border-b-0 sm:border-r last:border-0 border-[var(--border)]">
              <p className="text-[12px] font-bold text-[var(--ink-tertiary)]">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="text-[14px] font-bold text-[var(--gov-navy)] mt-1">{step.title}</h3>
              <p className="text-[13px] text-[var(--ink-secondary)] mt-1">{step.detail}</p>
            </li>)}
          </ol>
        </section>

        <section className="gov-card mt-5 p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[var(--gov-navy)]">{tr('Common questions', 'आम सवाल', 'नेहमीचे प्रश्न')}</h2>
          <div className="mt-3 space-y-2">
            {FAQ[language].map(item => <details key={item.question} className="border border-[var(--border)] p-4">
              <summary className="cursor-pointer text-[15px] font-semibold text-[var(--ink)]">{item.question}</summary>
              <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed mt-3">{item.answer}</p>
            </details>)}
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
  </>;
}
