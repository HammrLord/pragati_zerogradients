'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/gov/SiteHeader';
import { SiteFooter } from '@/components/gov/SiteFooter';
import { DEMO_CITIZEN_ACCOUNT, useCitizen } from '@/lib/session';
import { Note } from '@/components/ui/Card';
import { localize, useSiteLanguage } from '@/lib/site-language';

export default function LoginPage() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const router = useRouter();
  const { login } = useCitizen();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'identify' | 'otp'>('identify');
  const [error, setError] = useState('');

  function proceed() {
    if (!identifier.trim()) { setError(tr('Enter your name, mobile number, email or प्रgati ID.', 'अपना नाम, मोबाइल नंबर, ईमेल या प्रगति आईडी लिखें।', 'आपले नाव, मोबाइल क्रमांक, ईमेल किंवा प्रगती आयडी लिहा.')); return; }
    setError('');
    setStage('otp');
  }

  function submit() {
    if (otp !== '123456') { setError(tr('Incorrect OTP. For this demonstration the OTP is 123456.', 'ओटीपी गलत है। इस डेमो का ओटीपी 123456 है।', 'ओटीपी चुकीचा आहे. या डेमोसाठी ओटीपी 123456 आहे.')); return; }
    const account = login(identifier);
    if (!account) {
      setError(tr('No registration found. Please register first.', 'पंजीकरण नहीं मिला। पहले पंजीकरण करें।', 'नोंदणी सापडली नाही. आधी नोंदणी करा.'));
      setStage('identify');
      return;
    }
    // The role decided at registration is what routes the user — this is the
    // single point where the two audiences are separated.
    router.push(`/dashboard/${account.role}`);
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 py-12 grid md:grid-cols-[1fr_1.1fr] gap-8 items-start">
          <div>
            <h1 className="text-[26px] font-bold text-[var(--gov-navy)] gov-rule">{tr('Portal Login', 'पोर्टल में लॉग इन', 'पोर्टलवर लॉग इन')}</h1>
            <p className="text-[13.5px] text-[var(--ink-secondary)] mt-4 leading-relaxed">
              {tr('Candidates and businesses sign in here. You will see the services meant for you.',
                'उम्मीदवार और उद्योग यहाँ लॉग इन करें। इसके बाद आपकी सुविधाएँ दिखेंगी।',
                'उमेदवार आणि उद्योग येथे लॉग इन करा. त्यानंतर तुमच्यासाठीच्या सुविधा दिसतील.')}
            </p>

            <div className="mt-6 space-y-3">
              <Note tone="info" title={tr('Government officers', 'सरकारी अधिकारी', 'सरकारी अधिकारी')}>
                {tr('Officers use the', 'अधिकारी', 'अधिकारी')}{' '}
                <Link href="/gov" className="gov-link font-semibold">{tr('departmental portal', 'विभागीय पोर्टल', 'विभागीय पोर्टल')}</Link>.
              </Note>
              <Note tone="warn" title={tr('Not registered yet?', 'अभी पंजीकरण नहीं किया?', 'अजून नोंदणी केली नाही?')}>
                {tr('Registration is quick.', 'पंजीकरण आसान है।', 'नोंदणी सोपी आहे.')}{' '}
                <Link href="/register" className="gov-link font-semibold">{tr('Register now', 'अभी पंजीकरण करें', 'आता नोंदणी करा')} →</Link>
              </Note>
            </div>

            <div className="mt-6 gov-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-secondary)] mb-2">
                {tr('Having trouble?', 'मदद चाहिए?', 'मदत हवी आहे?')}
              </p>
              <ul className="text-[12.5px] text-[var(--ink-secondary)] space-y-1.5">
                <li>{tr('Helpline', 'हेल्पलाइन', 'मदत क्रमांक')} <span className="mono font-semibold">1800-233-0202</span></li>
                <li>{tr('You can ask for help by voice.', 'आप बोलकर मदद माँग सकते हैं।', 'तुम्ही बोलून मदत मागू शकता.')}</li>
                <li>{tr('You can also visit your district skill office.', 'अपने ज़िले के कौशल कार्यालय भी जा सकते हैं।', 'आपल्या जिल्हा कौशल्य कार्यालयातही जाऊ शकता.')}</li>
              </ul>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="h-1.5 tricolour-bar" />
            <div className="p-6">
              {stage === 'identify' ? (
                <>
                  <h2 className="text-[17px] font-bold text-[var(--ink)] mb-1">{tr('Sign in', 'लॉग इन करें', 'लॉग इन करा')}</h2>
                  <p className="text-[12.5px] text-[var(--ink-secondary)] mb-5">
                    {tr('Use the name, mobile number, email or ID you registered with.', 'पंजीकरण में दिया नाम, मोबाइल नंबर, ईमेल या आईडी लिखें।', 'नोंदणीचे नाव, मोबाइल क्रमांक, ईमेल किंवा आयडी लिहा.')}
                  </p>
                  <label className="gov-label">{tr('Name, mobile number, email or प्रgati ID', 'नाम, मोबाइल नंबर, ईमेल या प्रगति आईडी', 'नाव, मोबाइल क्रमांक, ईमेल किंवा प्रगती आयडी')}</label>
                  <input
                    className="gov-input"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Aarav Patil · 9876543210 · name@example.com"
                    onKeyDown={e => e.key === 'Enter' && proceed()}
                  />
                  {error && <p className="text-[11.5px] text-[var(--signal-declining)] mt-1.5">{error}</p>}
                  <button
                    onClick={proceed}
                    className="w-full mt-4 bg-[var(--gov-navy)] text-white font-bold text-[14.5px] py-3 rounded-sm hover:bg-[var(--gov-navy-light)] focus-ring"
                  >
                    {tr('Send OTP', 'ओटीपी भेजें', 'ओटीपी पाठवा')} →
                  </button>
                  <div className="mt-4 px-3 py-2.5 bg-[var(--accent-officer-light)] border border-[var(--border)] rounded-sm text-[12px] text-[var(--ink-secondary)]">
                    <strong className="text-[var(--ink)]">{tr('Demo login:', 'डेमो लॉग इन:', 'डेमो लॉग इन:')}</strong> {DEMO_CITIZEN_ACCOUNT.name} · OTP <span className="mono font-bold">123456</span>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { setStage('identify'); setError(''); }}
                    className="text-[12px] gov-link mb-3">← {tr('Change name or number', 'नाम या नंबर बदलें', 'नाव किंवा क्रमांक बदला')}</button>
                  <h2 className="text-[17px] font-bold text-[var(--ink)] mb-1">{tr('Enter OTP', 'ओटीपी लिखें', 'ओटीपी लिहा')}</h2>
                  <p className="text-[12.5px] text-[var(--ink-secondary)] mb-5">
                    {tr('For this demo, enter', 'इस डेमो के लिए लिखें', 'या डेमोसाठी लिहा')} <span className="mono font-bold">123456</span>.
                  </p>
                  <label className="gov-label">{tr('One-time password', 'एक बार का पासवर्ड', 'एकदाचा पासवर्ड')}</label>
                  <input
                    className="gov-input mono tracking-[0.35em] text-center text-[18px]"
                    maxLength={6}
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    autoFocus
                  />
                  {error && <p className="text-[11.5px] text-[var(--signal-declining)] mt-1.5">{error}</p>}
                  <button
                    onClick={submit}
                    className="w-full mt-4 bg-[var(--gov-navy)] text-white font-bold text-[14.5px] py-3 rounded-sm hover:bg-[var(--gov-navy-light)] focus-ring"
                  >
                    {tr('Login', 'लॉग इन', 'लॉग इन')} →
                  </button>
                </>
              )}

              <p className="text-[11.5px] text-[var(--ink-tertiary)] mt-5 pt-4 border-t border-[var(--border)] leading-relaxed">
                {tr('This is a hackathon demo. Do not enter a real password or sensitive personal data.',
                  'यह हैकाथॉन डेमो है। असली पासवर्ड या निजी जानकारी न लिखें।',
                  'हा हॅकाथॉन डेमो आहे. खरा पासवर्ड किंवा खाजगी माहिती लिहू नका.')}
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
