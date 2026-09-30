'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/gov/SiteHeader';
import { SiteFooter } from '@/components/gov/SiteFooter';
import { HeroBanner } from '@/components/home/HeroBanner';
import { NoticeBoard } from '@/components/home/NoticeBoard';
import { OnboardingAgent } from '@/components/onboarding/OnboardingAgent';
import { PILLARS } from '@/data/pillars';
import { districts } from '@/data/districts';
import { allSeatCalculations } from '@/data/capacity';
import { formatNumber } from '@/lib/utils';
import { localize, useSiteLanguage } from '@/lib/site-language';

const QUICK_LINKS = [
  { label: 'All courses and what they teach', sub: '39 courses · full subject list', href: '/courses' },
  { label: 'Which trades have jobs near me', sub: 'Real hiring data by district', href: '/demand' },
  { label: 'Certificate for work I already do', sub: 'No need to repeat a full course', href: '/register?role=student' },
  { label: 'Help & complaints', sub: 'Speak to us in 4 languages', href: '/help' },
];
const PILLAR_PUBLIC = {
  hi: [
    ['असली नौकरियाँ, झूठे विज्ञापन नहीं', 'नौकरी की संख्या तभी गिनी जाती है जब किसी को सच में काम और वेतन मिले।'],
    ['सीखने से पहले नौकरी का रास्ता', 'छोटे उद्योग मिलकर लोगों को काम देने का वादा करते हैं। प्रशिक्षण के बाद काम करके दिखाने का मौका मिलता है।'],
    ['उद्योग के साथ बदलते कोर्स', 'कोर्स में वही काम सिखाया जाता है जिसकी आज ज़रूरत है। हाथ से किए काम की जाँच मशीन से होती है।'],
    ['मशीन हो तभी प्रशिक्षण की जगह', 'शिक्षक, मशीन और जगह जितनी हो, उतनी ही प्रशिक्षण सीटें खोली जाती हैं।'],
    ['जो आता है उसका प्रमाणपत्र', 'पुराना काम फिर से सीखे बिना उसका प्रमाणपत्र लें। नया काम सीखने के लिए छोटा कोर्स भी खोजें।'],
    ['बोलकर मदद, वेतन से जाँच', 'अपनी भाषा में बोलकर मदद लें। नौकरी मिलने के दावों की वेतन रिकॉर्ड से जाँच होती है।'],
  ],
  mr: [
    ['खऱ्या नोकऱ्या, खोट्या जाहिराती नाहीत', 'एखाद्याला खरे काम आणि पगार मिळाला तरच ती नोकरी मोजली जाते.'],
    ['शिकण्याआधी नोकरीचा मार्ग', 'लहान उद्योग मिळून काम देण्याचे आश्वासन देतात. प्रशिक्षणानंतर काम करून दाखवण्याची संधी मिळते.'],
    ['उद्योगाबरोबर बदलणारे अभ्यासक्रम', 'आज गरज असलेले कामच शिकवले जाते. हाताने केलेल्या कामाची तपासणी यंत्राद्वारे होते.'],
    ['यंत्र असेल तरच प्रशिक्षणाची जागा', 'शिक्षक, यंत्रे आणि जागा जितकी आहेत तितक्याच प्रशिक्षणाच्या जागा उघडल्या जातात.'],
    ['येत असलेल्या कामाचे प्रमाणपत्र', 'आधीचे काम पुन्हा न शिकता त्याचे प्रमाणपत्र घ्या. नवीन कामासाठी छोटा अभ्यासक्रमही शोधा.'],
    ['बोलून मदत, पगाराची खात्री', 'आपल्या भाषेत बोलून मदत घ्या. नोकरी मिळाल्याची पगाराच्या नोंदीतून खात्री होते.'],
  ],
};

export default function HomePage() {
  const language = useSiteLanguage();
  const seatCalcs = allSeatCalculations();
  const [conversationRole, setConversationRole] = useState<'student' | 'business' | null>(null);
  const conversationHeading = useRef<HTMLHeadingElement>(null);

  function startConversation(role: 'student' | 'business') {
    setConversationRole(role);
    conversationHeading.current?.scrollIntoView({ block: 'start' });
    conversationHeading.current?.focus();
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <HeroBanner onStartCandidate={() => startConversation('student')} onStartBusiness={() => startConversation('business')} />

        <section id="conversation" className="bg-white border-b border-[var(--border)] scroll-mt-4">
          <div className="mx-auto max-w-[1400px] px-4 py-10">
            <div className="max-w-3xl mb-5">
              <p className="gov-label">{localize(language, 'Speak or type', 'बोलें या लिखें', 'बोला किंवा लिहा')}</p>
              <h2 ref={conversationHeading} tabIndex={-1} className="text-[22px] font-bold text-[var(--gov-navy)] mt-2 outline-none">
                {localize(language, 'Start with a conversation', 'बात करके शुरू करें', 'बोलून सुरुवात करा')}
              </h2>
              <p className="text-[14px] text-[var(--ink-secondary)] mt-2 leading-relaxed">
                {localize(language,
                  'Answer one simple question at a time in English, Hindi or Marathi. Try it here without logging in.',
                  'अंग्रेज़ी, हिन्दी या मराठी में एक बार में एक आसान सवाल का जवाब दें। बिना लॉग इन किए यहाँ आज़माएँ।',
                  'इंग्रजी, हिंदी किंवा मराठीत एकावेळी एका सोप्या प्रश्नाचे उत्तर द्या. लॉग इन न करता येथे वापरून पाहा.')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-w-4xl">
              <button type="button" onClick={() => setConversationRole('student')} aria-pressed={conversationRole === 'student'} className={`min-h-20 border p-4 text-left focus-ring ${conversationRole === 'student' ? 'border-[var(--gov-navy)] bg-[var(--surface-alt)]' : 'border-[var(--border-strong)] bg-white hover:border-[var(--gov-navy)]'}`}>
                <span className="block text-[15px] font-bold text-[var(--gov-navy)]">{localize(language, 'I am looking for work', 'मुझे काम चाहिए', 'मला काम हवे आहे')}</span>
                <span className="block text-[13px] text-[var(--ink-secondary)] mt-1">{localize(language, 'Make a candidate profile', 'मेरी काम की जानकारी बनाएँ', 'माझ्या कामाची माहिती तयार करा')}</span>
              </button>
              <button type="button" onClick={() => setConversationRole('business')} aria-pressed={conversationRole === 'business'} className={`min-h-20 border p-4 text-left focus-ring ${conversationRole === 'business' ? 'border-[var(--gov-navy)] bg-[var(--surface-alt)]' : 'border-[var(--border-strong)] bg-white hover:border-[var(--gov-navy)]'}`}>
                <span className="block text-[15px] font-bold text-[var(--gov-navy)]">{localize(language, 'I want to hire people', 'मुझे लोगों को काम देना है', 'मला लोकांना काम द्यायचे आहे')}</span>
                <span className="block text-[13px] text-[var(--ink-secondary)] mt-1">{localize(language, 'Describe a job opening', 'नौकरी की जानकारी दें', 'नोकरीची माहिती द्या')}</span>
              </button>
            </div>
            {conversationRole && <div className="max-w-4xl mt-5"><OnboardingAgent key={conversationRole} role={conversationRole} /></div>}
          </div>
        </section>

        {/* ---------- Registration split: the one decision that segregates the portal ---------- */}
        <section className="bg-white border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1400px] px-4 py-10">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-[22px] font-bold text-[var(--gov-navy)] inline-block gov-rule">
                {localize(language, 'Register on the Portal', 'पोर्टल पर पंजीकरण करें', 'पोर्टलवर नोंदणी करा')}
              </h2>
              <p className="text-[13.5px] text-[var(--ink-secondary)] mt-4 leading-relaxed">
                {localize(language,
                  'One portal, one registration form. Choose whether you are looking for work or offering work. Your choice decides what you see next.',
                  'एक पोर्टल, एक पंजीकरण। आप काम ढूँढ़ रहे हैं या काम देना चाहते हैं? इसी के हिसाब से आगे की सुविधाएँ दिखेंगी।',
                  'एक पोर्टल, एक नोंदणी. तुम्ही काम शोधत आहात की काम देत आहात? त्यानुसार पुढील सुविधा दिसतील.')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              <RoleCard
                role="student"
                language={language}
                accent="var(--accent-student)"
                title={localize(language, 'Candidate / Student', 'उम्मीदवार / विद्यार्थी', 'उमेदवार / विद्यार्थी')}
                who={localize(language, 'For people who want to learn a skill, find a job, or get a certificate for work they already know.', 'जो लोग काम सीखना, नौकरी ढूँढ़ना या अपने पुराने काम का प्रमाणपत्र लेना चाहते हैं।', 'ज्यांना काम शिकायचे, नोकरी शोधायची किंवा आधीच्या कामाचे प्रमाणपत्र मिळवायचे आहे.')}
              services={language === 'hi' ? ['अपने पास की नौकरियाँ देखें', 'जो काम आता है उसका प्रमाणपत्र लें', 'काम के लिए सही कोर्स खोजें'] : language === 'mr' ? ['जवळच्या नोकऱ्या पहा', 'येत असलेल्या कामाचे प्रमाणपत्र घ्या', 'कामासाठी योग्य अभ्यासक्रम शोधा'] : [
                'See jobs near you', 'Get a certificate for work you know', 'Find a course for your goal',
              ]}
              />
              <RoleCard
                role="business"
                language={language}
                accent="var(--accent-employer)"
                title={localize(language, 'Enterprise / MSME', 'उद्योग / व्यवसाय', 'उद्योग / व्यवसाय')}
                who={localize(language, 'For businesses that want to hire skilled people or certify workers they already employ.', 'उन उद्योगों के लिए जो लोगों को काम देना या अपने कामगारों का प्रमाणपत्र बनवाना चाहते हैं।', 'ज्या उद्योगांना कामगार भरती करायचे किंवा आधीच्या कामगारांचे प्रमाणपत्र घ्यायचे आहे.')}
              services={language === 'hi' ? ['किस काम के लिए लोग चाहिए, बताएँ', 'दूसरे उद्योगों के साथ मिलकर भर्ती करें', 'अपने कामगारों को प्रमाणपत्र दिलाएँ'] : language === 'mr' ? ['कोणत्या कामासाठी माणसे हवी ते सांगा', 'इतर उद्योगांबरोबर भरती करा', 'कामगारांना प्रमाणपत्र मिळवा'] : [
                'Tell us who you need to hire', 'Hire together with other small firms', 'Get workers certified',
              ]}
              />
            </div>

            <p className="text-center text-[12.5px] text-[var(--ink-secondary)] mt-6">
              {localize(language, 'Already registered?', 'पहले से पंजीकृत हैं?', 'आधीच नोंदणी केली आहे?')}{' '}
              <Link href="/login" className="gov-link font-semibold">{localize(language, 'Login to your dashboard', 'अपने खाते में जाएँ', 'आपल्या खात्यात जा')}</Link>
              {'  ·  '}
              {localize(language, 'Government officer?', 'सरकारी अधिकारी?', 'सरकारी अधिकारी?')}{' '}
              <Link href="/gov" className="gov-link font-semibold">{localize(language, 'Departmental portal', 'विभागीय पोर्टल', 'विभागीय पोर्टल')}</Link>
            </p>
          </div>
        </section>

        {/* ---------- Quick links + notices ---------- */}
        <section className="mx-auto max-w-[1400px] px-4 py-10 grid lg:grid-cols-[1.9fr_1fr] gap-6">
          <div>
            <h2 className="text-[19px] font-bold text-[var(--gov-navy)] gov-rule mb-5">{localize(language, 'Citizen Services', 'आपके लिए सुविधाएँ', 'तुमच्यासाठी सुविधा')}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((q, index) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="gov-card p-4 flex items-center justify-between gap-3 hover:border-[var(--gov-navy)] transition-colors group focus-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-[var(--ink)] leading-snug">{language === 'hi' ? ['सभी कोर्स देखें', 'मेरे पास कौन सी नौकरी है', 'मेरे काम का प्रमाणपत्र', 'मदद और शिकायत'][index] : language === 'mr' ? ['सर्व अभ्यासक्रम पहा', 'माझ्याजवळ कोणत्या नोकऱ्या आहेत', 'माझ्या कामाचे प्रमाणपत्र', 'मदत आणि तक्रार'][index] : q.label}</span>
                    <span className="block text-[11.5px] text-[var(--ink-tertiary)] mt-1 leading-snug">{language === 'hi' ? ['सभी विषयों की सूची', 'अपने ज़िले का काम देखें', 'पूरा कोर्स फिर से नहीं', 'बोलकर मदद लें'][index] : language === 'mr' ? ['सर्व विषयांची यादी', 'आपल्या जिल्ह्यातील काम पहा', 'पूर्ण अभ्यासक्रम पुन्हा नाही', 'बोलून मदत घ्या'][index] : q.sub}</span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[var(--ink-tertiary)]">→</span>
                </Link>
              ))}
            </div>

          </div>

          <NoticeBoard />
        </section>

        {/* ---------- Six operating pillars ---------- */}
        <section id="pillars" className="bg-white border-y border-[var(--border)]">
          <div className="mx-auto max-w-[1400px] px-4 py-12">
            <div className="max-w-3xl mb-8">
              <h2 className="text-[22px] font-bold text-[var(--gov-navy)] gov-rule">{localize(language, 'How the Portal Works', 'पोर्टल कैसे काम करता है', 'पोर्टल कसे काम करते')}</h2>
              <p className="text-[13.5px] text-[var(--ink-secondary)] mt-4 leading-relaxed">{localize(language, 'The portal focuses on six things that make training lead to work.', 'यह पोर्टल सीखने से नौकरी तक पहुँचने में मदद करता है।', 'हे पोर्टल प्रशिक्षणातून नोकरीपर्यंत पोहोचायला मदत करते.')}</p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {PILLARS.map((p, i) => (
                <article key={p.id} className="gov-card p-4 flex items-start gap-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-[12px] font-bold mono text-[var(--ink-tertiary)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                      <div><h3 className="text-[14.5px] font-bold text-[var(--gov-navy)] leading-snug">{language === 'en' ? p.plain : PILLAR_PUBLIC[language][i][0]}</h3><p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed mt-1.5">{language === 'en' ? p.summary : PILLAR_PUBLIC[language][i][1]}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- District snapshot ---------- */}
        <section className="mx-auto max-w-[1400px] px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-[19px] font-bold text-[var(--gov-navy)] gov-rule">{localize(language, 'Pilot Districts', 'शुरुआती ज़िले', 'सुरुवातीचे जिल्हे')}</h2>
              <p className="text-[13px] text-[var(--ink-secondary)] mt-3">
                {localize(language, 'These are the districts currently shown in this demo.', 'ये ज़िले अभी इस डेमो में दिखाए गए हैं।', 'या डेमोमध्ये सध्या हे जिल्हे दाखवले आहेत.')}
              </p>
            </div>
            <Link href="/demand" className="text-[13px] gov-link font-semibold">
              {localize(language, 'See all job data', 'नौकरी की पूरी जानकारी देखें', 'नोकरीची पूर्ण माहिती पहा')} →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {districts.map(d => {
              const calc = seatCalcs.find(s => s.districtId === d.id)!;
              return (
                <Link
                  key={d.id}
                  href={`/demand?district=${d.id}`}
                  className="gov-card p-4 hover:border-[var(--gov-navy)] transition-colors focus-ring"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[var(--gov-navy)]">{d.name}</h3>
                    <span className="text-[11px] mono text-[var(--ink-tertiary)]">
                      {(d.population / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[var(--ink-tertiary)] mt-1 line-clamp-1">
                    {d.industries.slice(0, 3).join(' · ')}
                  </p>
                  <p className="text-[11.5px] text-[var(--ink-secondary)] mt-3 pt-3 border-t border-[var(--border)]">{formatNumber(calc.hardLimit)} {localize(language, 'verified seats available', 'प्रशिक्षण की जगहें', 'प्रशिक्षणाच्या जागा')}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- Departmental portal callout ---------- */}
        <section className="bg-[var(--gov-navy-dark)] text-white">
          <div className="mx-auto max-w-[1400px] px-4 py-9 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-start gap-4 max-w-2xl">
              <span className="w-11 h-11 shrink-0 grid place-items-center rounded-sm bg-white/10 border border-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="11" rx="1.5" />
                  <path d="M8 10V6.8a4 4 0 018 0V10" />
                </svg>
              </span>
              <div>
                <h2 className="text-[17px] font-bold">{localize(language, 'Departmental Portal — Restricted Access', 'विभागीय पोर्टल — केवल अधिकारियों के लिए', 'विभागीय पोर्टल — फक्त अधिकाऱ्यांसाठी')}</h2>
                <p className="text-[12.5px] text-slate-300 mt-1.5 leading-relaxed">
                  {localize(language,
                    'This area is only for authorised government officers. Every action is recorded.',
                    'यह हिस्सा केवल अधिकृत सरकारी अधिकारियों के लिए है। हर कार्रवाई दर्ज होती है।',
                    'हा भाग फक्त अधिकृत सरकारी अधिकाऱ्यांसाठी आहे. प्रत्येक कृतीची नोंद होते.')}
                </p>
              </div>
            </div>
            <Link
              href="/gov"
              className="shrink-0 bg-[var(--gov-saffron)] text-[var(--gov-navy-dark)] px-6 py-3 text-[14px] font-bold rounded-sm hover:brightness-105 focus-ring"
            >
              {localize(language, 'Officer Login', 'अधिकारी लॉग इन', 'अधिकारी लॉग इन')} →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function RoleCard({
  role, language, accent, title, who, services,
}: {
  role: 'student' | 'business';
  language: 'en' | 'hi' | 'mr';
  accent: string; title: string; who: string; services: string[];
}) {
  return (
    <div className="gov-card p-5 flex flex-col">
      <h3 className="text-[17px] font-bold text-[var(--gov-navy)] leading-tight">{title}</h3>
      <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed mt-2 mb-4">{who}</p>

      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--ink-secondary)] mb-2">
        {localize(language, 'Services on your dashboard', 'आपके खाते में सुविधाएँ', 'तुमच्या खात्यातील सुविधा')}
      </p>
      <ul className="space-y-1.5 flex-1 list-disc pl-5 marker:text-[var(--ink-tertiary)]">
        {services.map(s => (
          <li key={s} className="text-[13px] text-[var(--ink-secondary)] leading-snug">{s}</li>
        ))}
      </ul>

      <Link
        href={`/register?role=${role}`}
        className="mt-5 block text-center text-white font-semibold text-[14px] py-2.5 focus-ring"
        style={{ background: accent }}
      >
        {role === 'student'
          ? localize(language, 'Register as a Candidate', 'उम्मीदवार के रूप में पंजीकरण', 'उमेदवार म्हणून नोंदणी')
          : localize(language, 'Register as an Enterprise', 'उद्योग का पंजीकरण', 'उद्योगाची नोंदणी')} →
      </Link>
    </div>
  );
}
