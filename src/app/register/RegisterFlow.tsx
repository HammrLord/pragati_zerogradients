'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCitizen } from '@/lib/session';
import { CitizenRole } from '@/lib/rbac';
import { districts } from '@/data/districts';
import { courses } from '@/data/courses';
import { SECTOR_LABELS } from '@/types';
import { Note } from '@/components/ui/Card';
import { localize, setSiteLanguage, useSiteLanguage, type SiteLanguage } from '@/lib/site-language';

const STEPS = ['Select role', 'Identity & contact', 'Role details', 'Verify & submit'] as const;

const QUALIFICATIONS = [
  '8th standard or below', '10th standard (SSC)', '12th standard (HSC)',
  'ITI certificate (NCVT/SCVT)', 'Diploma / Polytechnic', 'Graduate', 'No formal schooling',
];

export function RegisterFlow() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useCitizen();

  const preset = params.get('role');
  const [step, setStep] = useState(preset === 'student' || preset === 'business' ? 1 : 0);
  const [role, setRole] = useState<CitizenRole | null>(
    preset === 'student' || preset === 'business' ? (preset as CitizenRole) : null,
  );

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', districtId: 'pune', language: 'mr',
    aadhaarLast4: '',
    // student
    qualification: '10th standard (SSC)', currentNsqfLevel: 3, enrolledCourseId: '', yearsInformalWork: 0,
    // business
    udyamNumber: '', entityType: 'MSME' as 'MSME' | 'Enterprise', sector: 'auto-ev',
    employeeCount: 10, gstin: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issued, setIssued] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { if (step <= 1) setForm(current => ({ ...current, language })); }, [language, step]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  function validateStep1() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = tr('Enter your full name.', 'अपना पूरा नाम लिखें।', 'आपले पूर्ण नाव लिहा.');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = tr('Enter a valid 10-digit mobile number.', '10 अंकों का सही मोबाइल नंबर लिखें।', '१० अंकांचा योग्य मोबाइल क्रमांक लिहा.');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = tr('Enter a valid email address.', 'सही ईमेल लिखें।', 'योग्य ईमेल लिहा.');
    if (form.aadhaarLast4 && !/^\d{4}$/.test(form.aadhaarLast4)) e.aadhaarLast4 = tr('Enter only the last 4 digits.', 'केवल आखिरी 4 अंक लिखें।', 'फक्त शेवटचे ४ अंक लिहा.');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (role === 'business') {
      if (!/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(form.udyamNumber.toUpperCase()))
        e.udyamNumber = tr('Use this format: UDYAM-MH-01-1234567', 'यह रूप लिखें: UDYAM-MH-01-1234567', 'असे लिहा: UDYAM-MH-01-1234567');
      if (form.gstin && form.gstin.length !== 15) e.gstin = tr('GSTIN must have 15 characters.', 'GSTIN में 15 अक्षर होने चाहिए।', 'GSTIN मध्ये १५ अक्षरे असावीत.');
      if (form.employeeCount < 1) e.employeeCount = tr('Enter at least 1 worker.', 'कम से कम 1 कामगार लिखें।', 'किमान १ कामगार लिहा.');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (otp !== '123456') {
      setErrors({ otp: tr('Incorrect OTP. For this demo use 123456.', 'ओटीपी गलत है। डेमो के लिए 123456 लिखें।', 'ओटीपी चुकीचा आहे. डेमोसाठी 123456 लिहा.') });
      return;
    }
    const base = {
      role: role!, name: form.name.trim(), mobile: form.mobile, email: form.email,
      districtId: form.districtId, language: form.language,
    };
    const account =
      role === 'student'
        ? register({
            ...base,
            qualification: form.qualification,
            currentNsqfLevel: Number(form.currentNsqfLevel),
            enrolledCourseId: form.enrolledCourseId || null,
            yearsInformalWork: Number(form.yearsInformalWork),
          })
        : register({
            ...base,
            udyamNumber: form.udyamNumber.toUpperCase(),
            entityType: form.entityType,
            sector: form.sector,
            employeeCount: Number(form.employeeCount),
            gstin: form.gstin.toUpperCase(),
          });
    setIssued(account.ksid);
    setStep(4);
    setSiteLanguage(form.language as SiteLanguage);
  }

  const accent = role === 'business' ? 'var(--accent-employer)' : 'var(--accent-student)';

  /* ------------------------------ success ------------------------------ */
  if (step === 4 && issued) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="gov-card overflow-hidden">
          <div className="h-1.5" style={{ background: accent }} />
          <div className="p-8 text-center">
            <span className="w-14 h-14 mx-auto grid place-items-center rounded-full bg-[var(--signal-rising-light)] text-[var(--signal-rising)] mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5l5 5L20 7" />
              </svg>
            </span>
            <h1 className="text-[22px] font-bold text-[var(--gov-navy)]">{tr('Registration Successful', 'पंजीकरण पूरा हुआ', 'नोंदणी पूर्ण झाली')}</h1>
            <p className="text-[13.5px] text-[var(--ink-secondary)] mt-2">
              {tr('Your demo ID is ready. Keep this number for this portal.', 'आपकी डेमो आईडी तैयार है। यह नंबर संभालकर रखें।', 'तुमचा डेमो आयडी तयार आहे. हा क्रमांक जपून ठेवा.')}
            </p>

            <div className="my-6 py-4 border-y border-dashed border-[var(--border-strong)]">
              <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-[var(--ink-tertiary)]">
                प्रgati ID (PID)
              </p>
              <p className="text-[26px] font-bold mono tracking-wider mt-1" style={{ color: accent }}>
                {issued}
              </p>
              <p className="text-[12px] text-[var(--ink-tertiary)] mt-1">
                {tr('Registered as', 'पंजीकरण हुआ', 'नोंदणी झाली')} {role === 'student' ? tr('Candidate', 'उम्मीदवार', 'उमेदवार') : tr('Business', 'उद्योग', 'उद्योग')} ·{' '}
                {districts.find(d => d.id === form.districtId)?.name}
              </p>
            </div>

            <Note tone="info" title={tr('What happens next', 'अब क्या होगा', 'आता पुढे काय')}>
              {tr('Open your dashboard to continue.', 'आगे बढ़ने के लिए अपना पेज खोलें।', 'पुढे जाण्यासाठी आपले पान उघडा.')}
            </Note>

            <button
              onClick={() => router.push(`/dashboard/${role}`)}
              className="mt-6 w-full text-white font-bold text-[15px] py-3 rounded-sm hover:brightness-110 focus-ring"
              style={{ background: accent }}
            >
              {tr('Open My Dashboard', 'मेरा डैशबोर्ड खोलें', 'माझा डॅशबोर्ड उघडा')} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ form ------------------------------ */
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex gap-1.5 text-[11.5px] text-[var(--ink-tertiary)]">
          <li><Link href="/" className="gov-link">{tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ')}</Link></li>
          <li aria-hidden>›</li>
          <li className="text-[var(--ink-secondary)]">{tr('New Registration', 'नया पंजीकरण', 'नवीन नोंदणी')}</li>
        </ol>
      </nav>

      <h1 className="text-[26px] font-bold text-[var(--gov-navy)] mb-1">{tr('New Registration', 'नया पंजीकरण', 'नवीन नोंदणी')}</h1>
      <p className="text-[13.5px] text-[var(--ink-secondary)] mb-6">
        {tr('Choose whether you want work or want to hire. Then tell us a few details.',
          'आप काम ढूँढ़ रहे हैं या लोगों को काम देना चाहते हैं? फिर कुछ जानकारी भरें।',
          'तुम्ही काम शोधत आहात की काम देत आहात? मग थोडी माहिती भरा.')}
      </p>

      {/* Stepper */}
      <ol className="flex items-center gap-0 mb-6 overflow-x-auto">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center shrink-0">
            <div className="flex items-center gap-2 px-3 py-2">
              <span
                className={`w-6 h-6 grid place-items-center rounded-full text-[11px] font-bold border-2 ${
                  i < step ? 'bg-[var(--signal-rising)] border-[var(--signal-rising)] text-white'
                  : i === step ? 'text-white' : 'bg-white border-[var(--border-strong)] text-[var(--ink-tertiary)]'
                }`}
                style={i === step ? { background: 'var(--gov-navy)', borderColor: 'var(--gov-navy)' } : undefined}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className={`text-[12px] font-semibold ${i === step ? 'text-[var(--gov-navy)]' : 'text-[var(--ink-tertiary)]'}`}>
                {language === 'hi' ? ['अपनी भूमिका चुनें', 'नाम और संपर्क', 'काम की जानकारी', 'जाँचें और पूरा करें'][i] : language === 'mr' ? ['आपली भूमिका निवडा', 'नाव आणि संपर्क', 'कामाची माहिती', 'तपासा आणि पूर्ण करा'][i] : label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-[var(--border-strong)]" />}
          </li>
        ))}
      </ol>

      <div className="gov-card p-6">
        {/* ---------------- Step 0: role ---------------- */}
        {step === 0 && (
          <>
            <h2 className="text-[17px] font-bold text-[var(--ink)] mb-1">{tr('Who is registering?', 'आप कौन हैं?', 'तुम्ही कोण आहात?')}</h2>
            <p className="text-[13px] text-[var(--ink-secondary)] mb-5">
              {tr('Choose the option that fits you. This decides what you see next.',
                'जो बात आप पर लागू होती है, उसे चुनें। आगे उसी से जुड़ी सुविधाएँ दिखेंगी।',
                'जे तुम्हाला लागू होते ते निवडा. पुढे त्यासंबंधी सुविधा दिसतील.')}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                { r: 'student' as const, t: 'Candidate / Student', hi: 'उमेदवार', c: 'var(--accent-student)', tint: 'var(--accent-student-light)',
                  d: 'You are looking for training, certification of experience you already have, or a job.' },
                { r: 'business' as const, t: 'Enterprise / MSME', hi: 'उद्योग', c: 'var(--accent-employer)', tint: 'var(--accent-employer-light)',
                  d: 'You are an establishment that hires skilled workers, or wants to shape what is taught.' },
              ]).map(o => (
                <button
                  key={o.r}
                  onClick={() => { setRole(o.r); setStep(1); }}
                  className={`text-left border-2 rounded-sm p-5 transition-all hover:shadow-sm focus-ring ${
                    role === o.r ? '' : 'border-[var(--border)]'
                  }`}
                  style={role === o.r ? { borderColor: o.c, background: o.tint } : undefined}
                >
                  <span className="block text-[16px] font-bold text-[var(--ink)]">{o.r === 'student' ? tr('Candidate / Student', 'उम्मीदवार / विद्यार्थी', 'उमेदवार / विद्यार्थी') : tr('Enterprise / MSME', 'उद्योग / व्यवसाय', 'उद्योग / व्यवसाय')}</span>
                  <span className="block text-[12px] text-[var(--ink-tertiary)] mt-0.5">{o.hi}</span>
                  <span className="block text-[12.5px] text-[var(--ink-secondary)] mt-3 leading-relaxed">{o.r === 'student' ? tr(o.d, 'मैं काम सीखना या नौकरी ढूँढ़ना चाहता हूँ।', 'मला काम शिकायचे किंवा नोकरी शोधायची आहे.') : tr(o.d, 'मैं लोगों को काम देना चाहता हूँ।', 'मला लोकांना काम द्यायचे आहे.')}</span>
                  <span className="inline-block mt-4 text-[13px] font-bold" style={{ color: o.c }}>{tr('Select', 'चुनें', 'निवडा')} →</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ---------------- Step 1: identity ---------------- */}
        {step === 1 && (
          <>
            <h2 className="text-[17px] font-bold text-[var(--ink)] mb-4">
              {tr('Name and contact details', 'नाम और संपर्क की जानकारी', 'नाव आणि संपर्क माहिती')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={tr('Full name', 'पूरा नाम', 'पूर्ण नाव')} required error={errors.name}>
                <input className="gov-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Sunil Deshmukh" />
              </Field>
              <Field label={tr('Mobile number', 'मोबाइल नंबर', 'मोबाइल क्रमांक')} required error={errors.mobile} hint={tr('Used to sign in', 'लॉग इन के लिए', 'लॉग इनसाठी')}>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-[var(--border-strong)] bg-[var(--surface-alt)] text-[13px] mono rounded-l-sm">+91</span>
                  <input className="gov-input rounded-l-none" inputMode="numeric" maxLength={10}
                    value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} placeholder="9876543210" />
                </div>
              </Field>
              <Field label={tr('Email address', 'ईमेल', 'ईमेल')} error={errors.email} hint={tr('Optional', 'ज़रूरी नहीं', 'ऐच्छिक')}>
                <input className="gov-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@example.com" />
              </Field>
              <Field label={tr('Aadhaar — last 4 digits', 'आधार — आखिरी 4 अंक', 'आधार — शेवटचे ४ अंक')} error={errors.aadhaarLast4} hint={tr('Optional. Do not enter the full number.', 'ज़रूरी नहीं। पूरा नंबर न लिखें।', 'ऐच्छिक. पूर्ण क्रमांक लिहू नका.')}>
                <input className="gov-input mono" inputMode="numeric" maxLength={4}
                  value={form.aadhaarLast4} onChange={e => set('aadhaarLast4', e.target.value.replace(/\D/g, ''))} placeholder="••••" />
              </Field>
              <Field label={tr('District', 'ज़िला', 'जिल्हा')} required>
                <select className="gov-input" value={form.districtId} onChange={e => set('districtId', e.target.value)}>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label={tr('Preferred language', 'अपनी भाषा', 'तुमची भाषा')} required hint={tr('Used for the portal and voice guide', 'पोर्टल और बोलने वाले सहायक के लिए', 'पोर्टल आणि बोलणाऱ्या सहाय्यासाठी')}>
                <select className="gov-input" value={form.language} onChange={e => { set('language', e.target.value); setSiteLanguage(e.target.value as SiteLanguage); }}>
                  <option value="mr">मराठी — Marathi</option>
                  <option value="hi">हिन्दी — Hindi</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>
            <Nav onBack={() => setStep(0)} onNext={() => { if (validateStep1()) setStep(2); }} accent={accent} language={language} />
          </>
        )}

        {/* ---------------- Step 2: role-specific ---------------- */}
        {step === 2 && role === 'student' && (
          <>
            <h2 className="text-[17px] font-bold text-[var(--ink)] mb-1">{tr('Candidate details', 'उम्मीदवार की जानकारी', 'उमेदवाराची माहिती')}</h2>
            <p className="text-[13px] text-[var(--ink-secondary)] mb-4">
              {tr('Work you have done before matters, even without a certificate.',
                'पहले किया काम भी मायने रखता है, चाहे प्रमाणपत्र न हो।',
                'आधी केलेले कामही महत्त्वाचे आहे, प्रमाणपत्र नसले तरी.')}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={tr('Highest qualification', 'कहाँ तक पढ़ाई की', 'किती शिक्षण झाले')} required>
                <select className="gov-input" value={form.qualification} onChange={e => set('qualification', e.target.value)}>
                  {QUALIFICATIONS.map((q, index) => <option key={q} value={q}>{language === 'hi' ? ['8वीं या उससे कम', '10वीं', '12वीं', 'आईटीआई प्रमाणपत्र', 'डिप्लोमा / पॉलिटेक्निक', 'स्नातक', 'स्कूल नहीं गए'][index] : language === 'mr' ? ['८ वी किंवा कमी', '१० वी', '१२ वी', 'आयटीआय प्रमाणपत्र', 'डिप्लोमा / पॉलिटेक्निक', 'पदवीधर', 'शाळेत गेले नाही'][index] : q}</option>)}
                </select>
              </Field>
              <Field label={tr('Current skill level', 'मौजूदा कौशल स्तर', 'सध्याची कौशल्य पातळी')} hint={tr('Leave at 3 if you do not know', 'पता न हो तो 3 रहने दें', 'माहित नसेल तर ३ राहू द्या')}>
                <select className="gov-input" value={form.currentNsqfLevel} onChange={e => set('currentNsqfLevel', Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{tr('Level', 'स्तर', 'पातळी')} {n}</option>)}
                </select>
              </Field>
              <Field label={tr('Course you are taking now', 'अभी कौन सा कोर्स कर रहे हैं', 'आता कोणता अभ्यासक्रम करत आहात')} hint={tr('Optional', 'ज़रूरी नहीं', 'ऐच्छिक')}>
                <select className="gov-input" value={form.enrolledCourseId} onChange={e => set('enrolledCourseId', e.target.value)}>
                  <option value="">{tr('Not taking a course now', 'अभी कोई कोर्स नहीं', 'आता कोणताही अभ्यासक्रम नाही')}</option>
                  {courses.filter(c => c.districtId === form.districtId).map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.type}, {c.durationMonths} months</option>
                  ))}
                </select>
              </Field>
              <Field label={tr('Years you have worked', 'कितने साल काम किया', 'किती वर्षे काम केले')} hint={tr('Paid or unpaid work can matter', 'पुराना काम भी गिना जा सकता है', 'आधीचे कामही मोजले जाऊ शकते')}>
                <input className="gov-input mono" type="number" min={0} max={40}
                  value={form.yearsInformalWork} onChange={e => set('yearsInformalWork', Number(e.target.value))} />
              </Field>
            </div>
            {form.yearsInformalWork >= 2 && (
              <div className="mt-4">
                <Note tone="success" title={tr('Your experience may count', 'आपका अनुभव काम आ सकता है', 'तुमचा अनुभव उपयोगी ठरू शकतो')}>
                  {tr('You may be able to get a certificate without repeating a full course.', 'पूरा कोर्स फिर से किए बिना प्रमाणपत्र मिल सकता है।', 'पूर्ण अभ्यासक्रम पुन्हा न करता प्रमाणपत्र मिळू शकते.')}
                </Note>
              </div>
            )}
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} accent={accent} language={language} />
          </>
        )}

        {step === 2 && role === 'business' && (
          <>
            <h2 className="text-[17px] font-bold text-[var(--ink)] mb-1">{tr('Business details', 'उद्योग की जानकारी', 'उद्योगाची माहिती')}</h2>
            <p className="text-[13px] text-[var(--ink-secondary)] mb-4">
              {tr('Tell us about your business so candidates understand who is hiring.',
                'अपने उद्योग के बारे में बताएँ ताकि उम्मीदवार जान सकें कौन काम दे रहा है।',
                'तुमच्या उद्योगाबद्दल सांगा, म्हणजे उमेदवारांना कोण भरती करत आहे ते कळेल.')}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={tr('Udyam registration number', 'उद्यम पंजीकरण नंबर', 'उद्यम नोंदणी क्रमांक')} required error={errors.udyamNumber} hint="Format: UDYAM-MH-01-1234567">
                <input className="gov-input mono uppercase" value={form.udyamNumber}
                  onChange={e => set('udyamNumber', e.target.value)} placeholder="UDYAM-MH-01-0042318" />
              </Field>
              <Field label="GSTIN" error={errors.gstin} hint={tr('Optional', 'ज़रूरी नहीं', 'ऐच्छिक')}>
                <input className="gov-input mono uppercase" maxLength={15} value={form.gstin}
                  onChange={e => set('gstin', e.target.value)} placeholder="27AABCU9603R1ZM" />
              </Field>
              <Field label={tr('Business size', 'उद्योग का आकार', 'उद्योगाचा आकार')} required>
                <select className="gov-input" value={form.entityType} onChange={e => set('entityType', e.target.value)}>
                  <option value="MSME">{tr('Small or medium business', 'छोटा या मध्यम उद्योग', 'लहान किंवा मध्यम उद्योग')}</option>
                  <option value="Enterprise">{tr('Large business', 'बड़ा उद्योग', 'मोठा उद्योग')}</option>
                </select>
              </Field>
              <Field label={tr('Type of work', 'किस तरह का उद्योग', 'कोणत्या प्रकारचा उद्योग')} required>
                <select className="gov-input" value={form.sector} onChange={e => set('sector', e.target.value)}>
                  {Object.entries(SECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label={tr('Number of workers', 'कामगारों की संख्या', 'कामगारांची संख्या')} required error={errors.employeeCount}>
                <input className="gov-input mono" type="number" min={1}
                  value={form.employeeCount} onChange={e => set('employeeCount', Number(e.target.value))} />
              </Field>
            </div>
            {form.entityType === 'MSME' && form.employeeCount < 50 && (
              <div className="mt-4">
                <Note tone="info" title={tr('You can hire together', 'आप मिलकर भर्ती कर सकते हैं', 'तुम्ही मिळून भरती करू शकता')}>
                  {tr('Small businesses can join a shared training group.', 'छोटे उद्योग मिलकर एक प्रशिक्षण समूह बना सकते हैं।', 'लहान उद्योग मिळून एक प्रशिक्षण गट बनवू शकतात.')}
                </Note>
              </div>
            )}
            <Nav onBack={() => setStep(1)} onNext={() => { if (validateStep2()) setStep(3); }} accent={accent} language={language} />
          </>
        )}

        {/* ---------------- Step 3: verify ---------------- */}
        {step === 3 && (
          <>
            <h2 className="text-[17px] font-bold text-[var(--ink)] mb-4">{tr('Check and finish', 'जाँचें और पूरा करें', 'तपासा आणि पूर्ण करा')}</h2>

            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-5 pb-5 border-b border-[var(--border)]">
              <Row k={tr('Registering as', 'भूमिका', 'भूमिका')} v={role === 'student' ? tr('Candidate', 'उम्मीदवार', 'उमेदवार') : tr('Business', 'उद्योग', 'उद्योग')} />
              <Row k={tr('Name', 'नाम', 'नाव')} v={form.name || '—'} />
              <Row k={tr('Mobile', 'मोबाइल', 'मोबाइल')} v={`+91 ${form.mobile || '—'}`} />
              <Row k={tr('District', 'ज़िला', 'जिल्हा')} v={districts.find(d => d.id === form.districtId)?.name ?? '—'} />
              {role === 'student' ? (
                <>
                  <Row k={tr('Education', 'पढ़ाई', 'शिक्षण')} v={form.qualification} />
                  <Row k={tr('Years worked', 'काम के साल', 'कामाची वर्षे')} v={String(form.yearsInformalWork)} />
                </>
              ) : (
                <>
                  <Row k={tr('Udyam number', 'उद्यम नंबर', 'उद्यम क्रमांक')} v={form.udyamNumber.toUpperCase() || '—'} />
                  <Row k={tr('Number of workers', 'कामगारों की संख्या', 'कामगारांची संख्या')} v={String(form.employeeCount)} />
                </>
              )}
            </dl>

            <div className="max-w-sm">
              <Field label={tr('One-time password', 'एक बार का पासवर्ड', 'एकदाचा पासवर्ड')} required error={errors.otp}
                hint={otpSent ? tr('For this demo, enter 123456.', 'इस डेमो के लिए 123456 लिखें।', 'या डेमोसाठी 123456 लिहा.') : tr('Ask for the demo OTP to continue.', 'आगे बढ़ने के लिए डेमो ओटीपी माँगें।', 'पुढे जाण्यासाठी डेमो ओटीपी मागा.')}>
                <div className="flex gap-2">
                  <input className="gov-input mono tracking-[0.3em]" maxLength={6} inputMode="numeric"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••" disabled={!otpSent} />
                  <button
                    onClick={() => setOtpSent(true)}
                    className="shrink-0 px-3 border border-[var(--gov-navy)] text-[var(--gov-navy)] text-[12.5px] font-semibold rounded-sm hover:bg-[var(--accent-officer-light)] focus-ring"
                  >
                    {otpSent ? tr('Send again', 'फिर भेजें', 'पुन्हा पाठवा') : tr('Send OTP', 'ओटीपी भेजें', 'ओटीपी पाठवा')}
                  </button>
                </div>
              </Field>
            </div>

            <label className="flex items-start gap-2.5 mt-5 text-[12.5px] text-[var(--ink-secondary)]">
              <input type="checkbox" defaultChecked className="mt-0.5" />
              <span>
                {tr('I have checked these details. This is a hackathon demo account.',
                  'मैंने यह जानकारी जाँच ली है। यह हैकाथॉन का डेमो खाता है।',
                  'मी ही माहिती तपासली आहे. हे हॅकाथॉनचे डेमो खाते आहे.')}
              </span>
            </label>

            <Nav onBack={() => setStep(2)} onNext={submit} nextLabel={tr('Finish registration', 'पंजीकरण पूरा करें', 'नोंदणी पूर्ण करा')} accent={accent} language={language} />
          </>
        )}
      </div>

      <p className="text-center text-[12.5px] text-[var(--ink-secondary)] mt-5">
        {tr('Already registered?', 'पहले से पंजीकृत हैं?', 'आधीच नोंदणी केली आहे?')} <Link href="/login" className="gov-link font-semibold">{tr('Login here', 'यहाँ लॉग इन करें', 'येथे लॉग इन करा')}</Link>
      </p>
    </div>
  );
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="gov-label">
        {label} {required && <span className="text-[var(--signal-declining)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-[var(--signal-declining)] mt-1">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-[var(--ink-tertiary)] mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <dt className="text-[var(--ink-tertiary)]">{k}</dt>
      <dd className="font-semibold text-[var(--ink)] text-right">{v}</dd>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel, accent, language }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; accent: string; language: SiteLanguage;
}) {
  return (
    <div className="flex justify-between gap-3 mt-6 pt-5 border-t border-[var(--border)]">
      <button onClick={onBack}
        className="px-5 py-2.5 text-[13.5px] font-semibold border border-[var(--border-strong)] rounded-sm hover:bg-[var(--surface-alt)] focus-ring">
        ← {localize(language, 'Back', 'पीछे', 'मागे')}
      </button>
      <button onClick={onNext}
        className="px-6 py-2.5 text-[13.5px] font-bold text-white rounded-sm hover:brightness-110 focus-ring"
        style={{ background: accent }}>
        {nextLabel ?? localize(language, 'Continue', 'आगे बढ़ें', 'पुढे जा')} →
      </button>
    </div>
  );
}
