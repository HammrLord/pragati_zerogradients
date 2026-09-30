'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { districts } from '@/data/districts';
import { useCitizen } from '@/lib/session';
import { localize, setSiteLanguage, useSiteLanguage, type SiteLanguage } from '@/lib/site-language';
import { SECTOR_LABELS } from '@/types';

type Role = 'student' | 'business';
type Phase = 'role' | 'questions' | 'review' | 'otp' | 'success';
type FieldKey = 'name' | 'mobile' | 'districtId' | 'qualification' | 'yearsInformalWork' | 'udyamNumber' | 'entityType' | 'sector' | 'employeeCount';
type Option = { value: string; label: string };
type Question = { key: FieldKey; prompt: string; hint: string; placeholder: string; options?: Option[]; inputMode?: 'text' | 'tel' | 'numeric' };

const QUALIFICATIONS = [
  '8th standard or below', '10th standard (SSC)', '12th standard (HSC)',
  'ITI certificate (NCVT/SCVT)', 'Diploma / Polytechnic', 'Graduate', 'No formal schooling',
];

const SECTOR_TRANSLATIONS: Record<string, { hi: string; mr: string }> = {
  'auto-ev': { hi: 'गाड़ी और इलेक्ट्रिक वाहन', mr: 'वाहने आणि इलेक्ट्रिक वाहने' },
  electrical: { hi: 'बिजली और इलेक्ट्रॉनिक्स', mr: 'वीज आणि इलेक्ट्रॉनिक्स' },
  textile: { hi: 'कपड़ा और सिलाई', mr: 'कापड आणि शिवणकाम' },
  'retail-bpo': { hi: 'दुकान और सेवा', mr: 'दुकान आणि सेवा' },
  construction: { hi: 'निर्माण कार्य', mr: 'बांधकाम' },
};

function toAsciiDigits(value: string) {
  return value.replace(/[०-९]/g, digit => String(digit.charCodeAt(0) - 0x0966));
}

function registrationQuestions(role: Role, language: SiteLanguage): Question[] {
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const common: Question[] = [
    {
      key: 'name',
      prompt: tr('What name should we use for your account?', 'आपके खाते में कौन सा नाम लिखें?', 'तुमच्या खात्यावर कोणते नाव लिहू?'),
      hint: tr('Tell us your full name.', 'अपना पूरा नाम बताएँ।', 'तुमचे पूर्ण नाव सांगा.'),
      placeholder: tr('Your full name', 'आपका पूरा नाम', 'तुमचे पूर्ण नाव'),
    },
    {
      key: 'mobile',
      prompt: tr('What is your 10-digit mobile number?', 'आपका 10 अंकों का मोबाइल नंबर क्या है?', 'तुमचा १० अंकांचा मोबाइल क्रमांक काय आहे?'),
      hint: tr('You can type or speak it. Check every digit before continuing. No real SMS is sent in this demo.', 'लिखें या बोलें। आगे बढ़ने से पहले हर अंक जाँचें। इस डेमो में असली SMS नहीं जाएगा।', 'लिहा किंवा बोला. पुढे जाण्यापूर्वी प्रत्येक अंक तपासा. या डेमोमध्ये खरा SMS पाठवला जात नाही.'),
      placeholder: '9876543210', inputMode: 'tel',
    },
    {
      key: 'districtId',
      prompt: tr('Which district are you in?', 'आप किस ज़िले में हैं?', 'तुम्ही कोणत्या जिल्ह्यात आहात?'),
      hint: tr('Choose one of the districts shown below.', 'नीचे दिए गए ज़िलों में से एक चुनें।', 'खाली दिलेल्या जिल्ह्यांपैकी एक निवडा.'),
      placeholder: tr('Choose a district', 'ज़िला चुनें', 'जिल्हा निवडा'),
      options: districts.map(district => ({ value: district.id, label: district.name })),
    },
  ];

  if (role === 'student') return [
    ...common,
    {
      key: 'qualification',
      prompt: tr('How far did you study?', 'आपने कहाँ तक पढ़ाई की है?', 'तुमचे शिक्षण किती झाले आहे?'),
      hint: tr('It is okay if you do not have a certificate.', 'प्रमाणपत्र न हो तो भी ठीक है।', 'प्रमाणपत्र नसले तरी चालेल.'),
      placeholder: tr('Choose your education', 'अपनी पढ़ाई चुनें', 'तुमचे शिक्षण निवडा'),
      options: QUALIFICATIONS.map((value, index) => ({
        value,
        label: language === 'hi'
          ? ['8वीं या उससे कम', '10वीं', '12वीं', 'आईटीआई प्रमाणपत्र', 'डिप्लोमा / पॉलिटेक्निक', 'स्नातक', 'स्कूल नहीं गए'][index]
          : language === 'mr'
            ? ['८ वी किंवा कमी', '१० वी', '१२ वी', 'आयटीआय प्रमाणपत्र', 'डिप्लोमा / पॉलिटेक्निक', 'पदवीधर', 'शाळेत गेले नाही'][index]
            : value,
      })),
    },
    {
      key: 'yearsInformalWork',
      prompt: tr('For how many years have you worked?', 'आपने कितने साल काम किया है?', 'तुम्ही किती वर्षे काम केले आहे?'),
      hint: tr('Paid or unpaid work counts. If you have not worked yet, enter 0.', 'पैसे मिले हों या न मिले हों, दोनों तरह का काम गिनें। पहले काम नहीं किया तो 0 लिखें।', 'पगार मिळाला असो वा नसो, दोन्ही प्रकारचे काम मोजा. आधी काम केले नसेल तर ० लिहा.'),
      placeholder: '0', inputMode: 'numeric',
    },
  ];

  return [
    ...common,
    {
      key: 'udyamNumber',
      prompt: tr('What is your Udyam registration number?', 'आपका उद्यम पंजीकरण नंबर क्या है?', 'तुमचा उद्यम नोंदणी क्रमांक काय आहे?'),
      hint: tr('Use the number on your Udyam certificate. For this demo, the format is UDYAM-MH-01-1234567.', 'अपने उद्यम प्रमाणपत्र का नंबर दें। इस डेमो में इसका रूप UDYAM-MH-01-1234567 है।', 'उद्यम प्रमाणपत्रावरील क्रमांक द्या. या डेमोमध्ये त्याचे स्वरूप UDYAM-MH-01-1234567 आहे.'),
      placeholder: 'UDYAM-MH-01-1234567',
    },
    {
      key: 'entityType',
      prompt: tr('Is this a small or large business?', 'आपका उद्योग छोटा है या बड़ा?', 'तुमचा उद्योग लहान आहे की मोठा?'),
      hint: tr('Choose the option that best fits your business.', 'जो विकल्प सही लगे उसे चुनें।', 'योग्य वाटणारा पर्याय निवडा.'),
      placeholder: tr('Choose business size', 'उद्योग का आकार चुनें', 'उद्योगाचा आकार निवडा'),
      options: [
        { value: 'MSME', label: tr('Small or medium business', 'छोटा या मध्यम उद्योग', 'लहान किंवा मध्यम उद्योग') },
        { value: 'Enterprise', label: tr('Large business', 'बड़ा उद्योग', 'मोठा उद्योग') },
      ],
    },
    {
      key: 'sector',
      prompt: tr('What kind of work does your business do?', 'आपका उद्योग किस तरह का काम करता है?', 'तुमचा उद्योग कोणत्या प्रकारचे काम करतो?'),
      hint: tr('Choose the closest match.', 'सबसे नज़दीकी विकल्प चुनें।', 'सर्वात जवळचा पर्याय निवडा.'),
      placeholder: tr('Choose the type of work', 'काम का प्रकार चुनें', 'कामाचा प्रकार निवडा'),
      options: Object.entries(SECTOR_LABELS).map(([value, english]) => ({
        value, label: language === 'en' ? english : SECTOR_TRANSLATIONS[value][language],
      })),
    },
    {
      key: 'employeeCount',
      prompt: tr('How many people work in your business now?', 'अभी आपके उद्योग में कितने लोग काम करते हैं?', 'सध्या तुमच्या उद्योगात किती लोक काम करतात?'),
      hint: tr('A rough number is fine for this demo.', 'इस डेमो के लिए लगभग संख्या भी ठीक है।', 'या डेमोसाठी अंदाजे संख्या चालेल.'),
      placeholder: '10', inputMode: 'numeric',
    },
  ];
}

export function ConversationalRegisterFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const { register } = useCitizen();
  const preset = params.get('role');
  const initialRole = preset === 'student' || preset === 'business' ? preset : null;
  const [role, setRole] = useState<Role | null>(initialRole);
  const [phase, setPhase] = useState<Phase>(initialRole ? 'questions' : 'role');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<FieldKey, string>>>({});
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [transcribed, setTranscribed] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const [helpText, setHelpText] = useState('');
  const [helping, setHelping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [issued, setIssued] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const player = useRef<HTMLAudioElement | null>(null);
  const speechId = useRef(0);
  const answerInput = useRef<HTMLInputElement | null>(null);
  const helpInput = useRef<HTMLTextAreaElement | null>(null);
  const questions = role ? registrationQuestions(role, language) : [];
  const question = questions[index];
  const selectedOption = question?.options?.find(option => option.value === draft);
  const displayedDraft = selectedOption?.label ?? draft;

  useEffect(() => () => {
    speechId.current += 1;
    player.current?.pause();
    recorder.current?.stream.getTracks().forEach(track => track.stop());
  }, []);

  function stopSpeech() {
    speechId.current += 1;
    player.current?.pause();
    player.current = null;
    setSpeaking(false);
  }

  async function speak(text: string, selectedLanguage = language) {
    stopSpeech();
    const requestId = speechId.current;
    setSpeaking(true);
    try {
      const response = await fetch('/api/onboarding/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: selectedLanguage }),
      });
      const data = await response.json() as { audio?: string; error?: string };
      if (!response.ok || !data.audio) throw new Error(data.error ?? 'Voice is unavailable.');
      if (requestId !== speechId.current) return;
      const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
      player.current = audio;
      audio.onended = () => { if (requestId === speechId.current) setSpeaking(false); };
      audio.onerror = () => { if (requestId === speechId.current) setSpeaking(false); };
      await audio.play();
    } catch {
      if (requestId === speechId.current) {
        setSpeaking(false);
        setNotice(tr('Audio could not play. You can still read the question.', 'आवाज़ नहीं चली। आप सवाल पढ़ सकते हैं।', 'आवाज ऐकू आला नाही. तुम्ही प्रश्न वाचू शकता.'));
      }
    }
  }

  function chooseRole(nextRole: Role) {
    stopSpeech();
    setRole(nextRole);
    setPhase('questions');
    setIndex(0);
    setAnswers({});
    setDraft('');
    setNotice('');
    setHelpText('');
    if (voiceOn) void speak(registrationQuestions(nextRole, language)[0].prompt);
  }

  function validAnswer(raw: string): { value?: string; error?: string } {
    if (!question) return { error: tr('Choose a role first.', 'पहले भूमिका चुनें।', 'आधी भूमिका निवडा.') };
    const value = toAsciiDigits(raw.trim());
    if (question.options) {
      const match = question.options.find(option => option.value.toLowerCase() === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase());
      return match ? { value: match.value } : { error: tr('Choose one of the answers shown.', 'दिखाए गए जवाबों में से एक चुनें।', 'दाखवलेल्या उत्तरांपैकी एक निवडा.') };
    }
    if (question.key === 'name') return value.length >= 3
      ? { value } : { error: tr('Please give your full name.', 'कृपया अपना पूरा नाम बताएँ।', 'कृपया तुमचे पूर्ण नाव सांगा.') };
    if (question.key === 'mobile') {
      const digits = value.replace(/\D/g, '');
      return /^[6-9]\d{9}$/.test(digits)
        ? { value: digits } : { error: tr('Check the mobile number. It needs 10 digits.', 'मोबाइल नंबर जाँचें। उसमें 10 अंक होने चाहिए।', 'मोबाइल क्रमांक तपासा. त्यात १० अंक हवेत.') };
    }
    if (question.key === 'udyamNumber') {
      const normalized = value.toUpperCase().replace(/[\s–—]+/g, '-');
      return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(normalized)
        ? { value: normalized } : { error: tr('Check the Udyam number. Example: UDYAM-MH-01-1234567.', 'उद्यम नंबर जाँचें। उदाहरण: UDYAM-MH-01-1234567।', 'उद्यम क्रमांक तपासा. उदाहरण: UDYAM-MH-01-1234567.') };
    }
    if (question.key === 'yearsInformalWork' || question.key === 'employeeCount') {
      const number = Number(value);
      const minimum = question.key === 'employeeCount' ? 1 : 0;
      return Number.isInteger(number) && number >= minimum && number <= 100
        ? { value: String(number) } : { error: question.key === 'employeeCount'
          ? tr('Enter at least 1 worker.', 'कम से कम 1 कामगार लिखें।', 'किमान १ कामगार लिहा.')
          : tr('Enter a number of years, or 0.', 'काम के साल लिखें, या 0।', 'कामाची वर्षे लिहा, किंवा ०.') };
    }
    return value ? { value } : { error: tr('Please answer this question.', 'कृपया इस सवाल का जवाब दें।', 'कृपया या प्रश्नाचे उत्तर द्या.') };
  }

  function submitAnswer() {
    if (!question || recording || transcribing) return;
    const result = validAnswer(draft);
    if (!result.value) { setNotice(result.error ?? ''); return; }
    const nextAnswers = { ...answers, [question.key]: result.value };
    setAnswers(nextAnswers);
    setNotice('');
    setHelpText('');
    setHelpQuery('');
    setTranscribed(false);
    if (editing || index === questions.length - 1) {
      setEditing(false);
      setPhase('review');
      if (voiceOn) void speak(tr('Please check your answers. You can change anything before continuing.', 'अपने जवाब जाँचें। आगे बढ़ने से पहले कुछ भी बदल सकते हैं।', 'तुमची उत्तरे तपासा. पुढे जाण्यापूर्वी काहीही बदलू शकता.'));
    } else {
      setIndex(index + 1);
      setDraft(nextAnswers[questions[index + 1].key] ?? '');
      if (voiceOn) void speak(questions[index + 1].prompt);
    }
  }

  function goBack() {
    stopSpeech();
    setNotice('');
    setHelpText('');
    if (editing) { setEditing(false); setPhase('review'); return; }
    if (index === 0) { setPhase('role'); return; }
    setIndex(index - 1);
    setDraft(answers[questions[index - 1].key] ?? '');
    setTranscribed(false);
  }

  async function askForHelp(query = '') {
    if (!role || !question || helping) return;
    setHelping(true);
    setHelpText('');
    // Help goes to Groq. Keep account identifiers out of that request.
    const safeQuery = query.slice(0, 300)
      .replace(/\b[6-9]\d{9}\b/g, '[mobile number]')
      .replace(/UDYAM-[A-Z]{2}-\d{2}-\d{7}/gi, '[Udyam number]');
    const request = `I am registering as a ${role === 'student' ? 'candidate' : 'business'} in the Pragati demo. The current question is: "${question.prompt}". ${safeQuery ? `My question: "${safeQuery}".` : 'Please explain what this asks for.'} Give one simple example, then tell me to answer this question. Do not ask me to share personal data in this help chat.`;
    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, language, messages: [{ role: 'user', content: request }] }),
      });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? 'Help is unavailable.');
      setHelpText(data.message);
      setHelpQuery('');
      if (voiceOn) void speak(data.message);
    } catch {
      setHelpText(question.hint);
      if (voiceOn) void speak(question.hint);
    } finally {
      setHelping(false);
    }
  }

  async function toggleRecording(target: 'answer' | 'help') {
    if (recording) { recorder.current?.stop(); return; }
    stopSpeech();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice(tr('This browser cannot record. Please type your answer.', 'इस ब्राउज़र में रिकॉर्डिंग नहीं हो सकती। कृपया लिखें।', 'या ब्राउझरमध्ये रेकॉर्डिंग होत नाही. कृपया लिहा.'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const next = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined });
      chunks.current = [];
      next.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
        setTranscribing(true);
        setNotice(tr('Turning your speech into words…', 'आपकी बात लिखी जा रही है…', 'तुमचे बोलणे लिहिले जात आहे…'));
        try {
          const audio = new Blob(chunks.current, { type: next.mimeType || 'audio/webm' });
          if (audio.size < 1024) throw new Error('No speech was captured. Please speak for a moment, then stop recording.');
          const mediaType = audio.type.split(';', 1)[0];
          const extension = mediaType === 'audio/mp4' ? 'm4a' : mediaType === 'audio/ogg' ? 'ogg' : 'webm';
          const form = new FormData();
          form.append('audio', audio, `registration.${extension}`);
          form.append('language', language);
          const response = await fetch('/api/onboarding/stt', { method: 'POST', body: form });
          const data = await response.json() as { transcript?: string; error?: string };
          if (!response.ok || !data.transcript?.trim()) throw new Error(data.error ?? 'Speech was not clear.');
          const transcript = toAsciiDigits(data.transcript.trim());
          if (target === 'help') {
            setHelpQuery(transcript);
            helpInput.current?.focus();
          } else {
            const match = question?.options?.find(option => transcript.toLowerCase().includes(option.label.toLowerCase()) || transcript.toLowerCase() === option.value.toLowerCase());
            setDraft(match?.value ?? transcript);
            setTranscribed(true);
            answerInput.current?.focus();
          }
          setNotice('');
        } catch (error) {
          setNotice(language === 'en' && error instanceof Error ? error.message : tr('I could not hear that. Try again or type.', 'बात साफ़ नहीं सुनाई दी। फिर बोलें या लिखें।', 'बोलणे स्पष्ट ऐकू आले नाही. पुन्हा बोला किंवा लिहा.'));
        } finally {
          setTranscribing(false);
        }
      };
      recorder.current = next;
      next.start(250);
      setRecording(true);
      setNotice(tr('Listening… speak, then press Stop.', 'सुन रहा हूँ… बोलें, फिर रोकें दबाएँ।', 'ऐकत आहे… बोला, मग थांबवा दाबा.'));
    } catch {
      setNotice(tr('Microphone access was not granted. You can type instead.', 'माइक्रोफोन की अनुमति नहीं मिली। आप लिख सकते हैं।', 'मायक्रोफोनची परवानगी मिळाली नाही. तुम्ही लिहू शकता.'));
    }
  }

  function finishRegistration() {
    if (!role || otp !== '123456') {
      setNotice(tr('For this demo, enter code 123456.', 'इस डेमो के लिए कोड 123456 लिखें।', 'या डेमोसाठी 123456 हा कोड लिहा.'));
      return;
    }
    const base = {
      role, name: answers.name!, mobile: answers.mobile!, email: '',
      districtId: answers.districtId!, language,
    };
    const account = role === 'student'
      ? register({ ...base, qualification: answers.qualification!, currentNsqfLevel: 3,
          enrolledCourseId: null, yearsInformalWork: Number(answers.yearsInformalWork) })
      : register({ ...base, udyamNumber: answers.udyamNumber!, entityType: answers.entityType as 'MSME' | 'Enterprise',
          sector: answers.sector!, employeeCount: Number(answers.employeeCount), gstin: '' });
    setIssued(account.ksid);
    setPhase('success');
    setNotice('');
    if (voiceOn) void speak(tr('Your demo account is ready. Open your dashboard to continue.', 'आपका डेमो खाता तैयार है। आगे बढ़ने के लिए अपना पेज खोलें।', 'तुमचे डेमो खाते तयार आहे. पुढे जाण्यासाठी तुमचे पान उघडा.'));
  }

  return <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
    <nav aria-label="Breadcrumb" className="mb-4 text-[12px] text-[var(--ink-secondary)]">
      <Link href="/" className="gov-link">{tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ')}</Link> <span aria-hidden>›</span> {tr('Registration', 'पंजीकरण', 'नोंदणी')}
    </nav>
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <p className="gov-label">{tr('Guided registration', 'बात करके पंजीकरण', 'बोलून नोंदणी')}</p>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[var(--gov-navy)] mt-1">{tr('Let us get you started', 'आइए शुरू करें', 'चला सुरुवात करूया')}</h1>
        <p className="text-[14px] text-[var(--ink-secondary)] mt-2">{tr('One question at a time. Speak or type your answer.', 'एक बार में एक सवाल। बोलकर या लिखकर जवाब दें।', 'एकावेळी एक प्रश्न. बोलून किंवा लिहून उत्तर द्या.')}</p>
      </div>
      <label className="text-[13px] font-semibold text-[var(--ink)]">
        {tr('Language', 'भाषा', 'भाषा')}
        <select value={language} onChange={event => { stopSpeech(); setSiteLanguage(event.target.value as SiteLanguage); }} className="ml-2 border border-[var(--border-strong)] bg-white px-3 py-2 focus-ring">
          <option value="mr">मराठी</option><option value="hi">हिन्दी</option><option value="en">English</option>
        </select>
      </label>
    </div>

    {phase === 'role' && <section className="gov-card p-5 sm:p-7">
      <p className="text-[12px] font-bold text-[var(--ink-secondary)]">{tr('Pragati assistant', 'प्रगति सहायक', 'प्रगती सहाय्यक')}</p>
      <h2 className="text-[21px] font-bold text-[var(--gov-navy)] mt-2">{tr('Are you looking for work, or offering work?', 'आप काम चाहते हैं या लोगों को काम देना चाहते हैं?', 'तुम्हाला काम हवे आहे की लोकांना काम द्यायचे आहे?')}</h2>
      <button type="button" onClick={() => { if (speaking) { stopSpeech(); setVoiceOn(false); } else { setVoiceOn(true); void speak(tr('Are you looking for work, or offering work?', 'आप काम चाहते हैं या लोगों को काम देना चाहते हैं?', 'तुम्हाला काम हवे आहे की लोकांना काम द्यायचे आहे?')); } }} className="mt-4 min-h-11 px-4 border border-[var(--gov-navy)] text-[var(--gov-navy)] text-[13px] font-semibold focus-ring">{speaking ? tr('Stop audio', 'आवाज़ रोकें', 'आवाज थांबवा') : tr('Hear question', 'सवाल सुनें', 'प्रश्न ऐका')}</button>
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <button type="button" onClick={() => chooseRole('student')} className="min-h-20 border border-[var(--border-strong)] bg-white text-left p-4 hover:border-[var(--gov-navy)] focus-ring">
          <span className="block text-[16px] font-bold text-[var(--gov-navy)]">{tr('I want to work', 'मुझे काम चाहिए', 'मला काम हवे आहे')}</span>
          <span className="block text-[13px] text-[var(--ink-secondary)] mt-1">{tr('Candidate or student', 'उम्मीदवार या विद्यार्थी', 'उमेदवार किंवा विद्यार्थी')}</span>
        </button>
        <button type="button" onClick={() => chooseRole('business')} className="min-h-20 border border-[var(--border-strong)] bg-white text-left p-4 hover:border-[var(--gov-navy)] focus-ring">
          <span className="block text-[16px] font-bold text-[var(--gov-navy)]">{tr('I want to hire', 'मुझे लोगों को काम देना है', 'मला लोकांना काम द्यायचे आहे')}</span>
          <span className="block text-[13px] text-[var(--ink-secondary)] mt-1">{tr('Business or employer', 'उद्योग या काम देने वाला', 'उद्योग किंवा नियोक्ता')}</span>
        </button>
      </div>
    </section>}

    {phase === 'questions' && question && <section className="gov-card overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
        <span className="text-[13px] font-bold text-[var(--ink-secondary)]">{tr('Question', 'सवाल', 'प्रश्न')} {index + 1} {tr('of', 'में से', 'पैकी')} {questions.length}</span>
        <span className="text-[12px] text-[var(--ink-secondary)]">{role === 'student' ? tr('Candidate', 'उम्मीदवार', 'उमेदवार') : tr('Business', 'उद्योग', 'उद्योग')}</span>
      </div>
      <div className="h-1 bg-[var(--surface-alt)]"><div className="h-full bg-[var(--gov-navy)]" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <div className="p-5 sm:p-7">
        {index > 0 && <ol className="mb-5 space-y-3" aria-label={tr('Earlier conversation', 'पहले की बातचीत', 'आधीचे संभाषण')}>
          {questions.slice(0, index).filter(item => answers[item.key]).slice(-2).map(item => <li key={item.key} className="space-y-2 text-[13px]">
            <p className="max-w-[85%] border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-[var(--ink-secondary)]">{item.prompt}</p>
            <p className="max-w-[85%] ml-auto border border-[var(--border-strong)] bg-white p-3 text-[var(--ink)] font-semibold text-right break-words"><span className="block text-[11px] font-normal text-[var(--ink-tertiary)] mb-1">{tr('You said', 'आपने कहा', 'तुम्ही सांगितले')}</span>{item.options?.find(option => option.value === answers[item.key])?.label ?? answers[item.key]}</p>
          </li>)}
        </ol>}
        <div className="border border-[var(--border)] bg-[var(--surface-alt)] p-4 sm:p-5">
          <p className="text-[12px] font-bold text-[var(--ink-secondary)]">{tr('Pragati assistant', 'प्रगति सहायक', 'प्रगती सहाय्यक')}</p>
          <h2 className="text-[21px] sm:text-[23px] font-bold text-[var(--gov-navy)] leading-snug mt-2" aria-live="polite">{question.prompt}</h2>
          <p className="text-[13px] text-[var(--ink-secondary)] mt-2 leading-relaxed">{question.hint}</p>
          <button type="button" onClick={() => { if (speaking) { stopSpeech(); setVoiceOn(false); } else { setVoiceOn(true); void speak(question.prompt); } }} className="mt-4 min-h-11 px-4 border border-[var(--gov-navy)] bg-white text-[var(--gov-navy)] text-[13px] font-semibold focus-ring">{speaking ? tr('Stop audio', 'आवाज़ रोकें', 'आवाज थांबवा') : tr('Hear question', 'सवाल सुनें', 'प्रश्न ऐका')}</button>
        </div>

        <form onSubmit={event => { event.preventDefault(); submitAnswer(); }} className="mt-6">
          <label htmlFor="registration-answer" className="block text-[14px] font-bold text-[var(--ink)] mb-2">{tr('Your answer', 'आपका जवाब', 'तुमचे उत्तर')}</label>
          {question.options && <div className="grid sm:grid-cols-2 gap-2 mb-4">{question.options.map(option => <button key={option.value} type="button" onClick={() => { setDraft(option.value); setNotice(''); }} aria-pressed={draft === option.value} className={`min-h-11 p-3 border text-left text-[14px] font-semibold focus-ring ${draft === option.value ? 'border-[var(--gov-navy)] bg-[var(--surface-alt)] text-[var(--gov-navy)]' : 'border-[var(--border-strong)] bg-white text-[var(--ink)]'}`}>{option.label}</button>)}</div>}
          <input ref={answerInput} id="registration-answer" value={displayedDraft} onChange={event => { setDraft(event.target.value); setNotice(''); }} inputMode={question.inputMode} autoComplete="off" className="gov-input w-full text-[16px]" placeholder={question.placeholder} />
          {transcribed && <p className="mt-2 text-[13px] text-[var(--ink-secondary)]" role="status">{tr('These are the words we heard. Check or change them before continuing.', 'हमें ये शब्द सुनाई दिए। आगे बढ़ने से पहले जाँचें या बदलें।', 'आम्हाला हे शब्द ऐकू आले. पुढे जाण्यापूर्वी तपासा किंवा बदला.')}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => void toggleRecording('answer')} disabled={transcribing} className="min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] text-[13px] font-semibold disabled:opacity-50 focus-ring">{recording ? tr('Stop recording', 'रिकॉर्डिंग रोकें', 'रेकॉर्डिंग थांबवा') : tr('Speak answer', 'जवाब बोलें', 'उत्तर बोला')}</button>
            <span className="self-center text-[12px] text-[var(--ink-secondary)]">{tr('Your words appear above after you stop.', 'रोकने के बाद आपकी बात ऊपर दिखेगी।', 'थांबवल्यावर तुमचे बोलणे वर दिसेल.')}</span>
          </div>
          {notice && <p className="mt-3 text-[13px] text-[var(--signal-declining)]" role="status">{notice}</p>}
          <div className="flex justify-between gap-3 border-t border-[var(--border)] pt-5 mt-6">
            <button type="button" onClick={goBack} disabled={recording || transcribing} className="min-h-11 px-4 border border-[var(--border-strong)] text-[var(--ink)] font-semibold disabled:opacity-50 focus-ring">← {tr('Back', 'पीछे', 'मागे')}</button>
            <button type="submit" disabled={!draft.trim() || recording || transcribing} className="min-h-11 px-6 bg-[var(--gov-navy)] text-white font-semibold disabled:opacity-50 focus-ring">{tr('Next', 'आगे', 'पुढे')} →</button>
          </div>
        </form>

        <details className="border-t border-[var(--border)] mt-6 pt-4">
          <summary className="cursor-pointer text-[14px] font-semibold text-[var(--gov-navy)] focus-ring">{tr('Need help with this question?', 'इस सवाल में मदद चाहिए?', 'या प्रश्नात मदत हवी आहे?')}</summary>
          <div className="pt-4">
            <button type="button" onClick={() => void askForHelp()} disabled={helping} className="min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] text-[13px] font-semibold disabled:opacity-50 focus-ring">{helping ? tr('Getting help…', 'मदद मिल रही है…', 'मदत मिळत आहे…') : tr('Explain simply', 'आसान शब्दों में समझाएँ', 'सोप्या शब्दांत समजवा')}</button>
            {helpText && <p className="border border-[var(--border)] bg-[var(--surface-alt)] p-4 mt-3 text-[14px] leading-relaxed" role="status">{helpText}</p>}
            <form onSubmit={event => { event.preventDefault(); if (helpQuery.trim()) void askForHelp(helpQuery.trim()); }} className="mt-3">
              <label htmlFor="registration-help" className="block text-[12px] font-semibold mb-1">{tr('Ask your own question', 'अपना सवाल पूछें', 'तुमचा प्रश्न विचारा')}</label>
              <p className="text-[12px] text-[var(--ink-secondary)] mb-2">{tr('Do not share your mobile number or registration number here.', 'यहाँ अपना मोबाइल या पंजीकरण नंबर न बताएँ।', 'येथे तुमचा मोबाइल किंवा नोंदणी क्रमांक सांगू नका.')}</p>
              <textarea ref={helpInput} id="registration-help" rows={2} value={helpQuery} onChange={event => setHelpQuery(event.target.value)} className="gov-input w-full resize-y" placeholder={tr('What do you want to know?', 'आप क्या जानना चाहते हैं?', 'तुम्हाला काय जाणून घ्यायचे आहे?')} />
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="submit" disabled={!helpQuery.trim() || helping} className="min-h-11 px-4 border border-[var(--border-strong)] text-[13px] font-semibold disabled:opacity-50 focus-ring">{tr('Ask', 'पूछें', 'विचारा')}</button>
                <button type="button" onClick={() => void toggleRecording('help')} disabled={transcribing} className="min-h-11 px-4 border border-[var(--border-strong)] text-[13px] font-semibold disabled:opacity-50 focus-ring">{recording ? tr('Stop recording', 'रिकॉर्डिंग रोकें', 'रेकॉर्डिंग थांबवा') : tr('Speak a question', 'सवाल बोलें', 'प्रश्न बोला')}</button>
              </div>
            </form>
          </div>
        </details>
      </div>
    </section>}

    {phase === 'review' && role && <section className="gov-card p-5 sm:p-7">
      <p className="text-[12px] font-bold text-[var(--ink-secondary)]">{tr('Pragati assistant', 'प्रगति सहायक', 'प्रगती सहाय्यक')}</p>
      <h2 className="text-[22px] font-bold text-[var(--gov-navy)] mt-2">{tr('Do these details look right?', 'क्या ये बातें सही हैं?', 'ही माहिती बरोबर आहे का?')}</h2>
      <p className="text-[14px] text-[var(--ink-secondary)] mt-2">{tr('Check each answer. You can change anything before creating the demo account.', 'हर जवाब जाँचें। डेमो खाता बनाने से पहले कुछ भी बदल सकते हैं।', 'प्रत्येक उत्तर तपासा. डेमो खाते तयार करण्यापूर्वी काहीही बदलू शकता.')}</p>
      <dl className="mt-5 grid sm:grid-cols-2 gap-3">{questions.map((item, questionIndex) => <div key={item.key} className="border border-[var(--border)] p-4">
        <dt className="text-[12px] text-[var(--ink-secondary)]">{item.prompt}</dt>
        <dd className="text-[16px] font-semibold text-[var(--ink)] mt-1 break-words">{item.options?.find(option => option.value === answers[item.key])?.label ?? answers[item.key]}</dd>
        <button type="button" onClick={() => { setIndex(questionIndex); setDraft(answers[item.key] ?? ''); setEditing(true); setPhase('questions'); }} className="gov-link text-[12px] font-bold mt-2 focus-ring">{tr('Change', 'बदलें', 'बदला')}</button>
      </div>)}</dl>
      <button type="button" onClick={() => { setPhase('otp'); setNotice(''); }} className="min-h-11 px-6 bg-[var(--gov-navy)] text-white font-semibold mt-6 focus-ring">{tr('Continue to demo code', 'डेमो कोड पर आगे बढ़ें', 'डेमो कोडकडे पुढे जा')} →</button>
    </section>}

    {phase === 'otp' && <section className="gov-card p-5 sm:p-7">
      <p className="text-[12px] font-bold text-[var(--ink-secondary)]">{tr('Final step', 'आखिरी कदम', 'शेवटची पायरी')}</p>
      <h2 className="text-[22px] font-bold text-[var(--gov-navy)] mt-2">{tr('Enter the demo verification code', 'डेमो जाँच कोड लिखें', 'डेमो पडताळणी कोड लिहा')}</h2>
      <p className="text-[14px] text-[var(--ink-secondary)] mt-2">{tr('This is a hackathon demo. No SMS is sent.', 'यह हैकाथॉन डेमो है। कोई SMS नहीं भेजा जाएगा।', 'हा हॅकाथॉन डेमो आहे. SMS पाठवला जाणार नाही.')}</p>
      <button type="button" onClick={() => { setOtpSent(true); setNotice(''); }} className="min-h-11 px-4 border border-[var(--gov-navy)] text-[var(--gov-navy)] font-semibold mt-5 focus-ring">{otpSent ? tr('Show code again', 'कोड फिर दिखाएँ', 'कोड पुन्हा दाखवा') : tr('Show demo code', 'डेमो कोड दिखाएँ', 'डेमो कोड दाखवा')}</button>
      {otpSent && <p className="text-[15px] mt-4">{tr('Your demo code is', 'आपका डेमो कोड है', 'तुमचा डेमो कोड आहे')} <strong className="mono text-[var(--gov-navy)]">123456</strong></p>}
      <label htmlFor="registration-otp" className="block text-[14px] font-semibold mt-5 mb-2">{tr('Enter code', 'कोड लिखें', 'कोड लिहा')}</label>
      <input id="registration-otp" value={otp} onChange={event => setOtp(toAsciiDigits(event.target.value).replace(/\D/g, '').slice(0, 6))} disabled={!otpSent} inputMode="numeric" autoComplete="one-time-code" className="gov-input max-w-xs text-[18px] tracking-[0.2em]" placeholder="123456" />
      {notice && <p className="mt-3 text-[13px] text-[var(--signal-declining)]" role="status">{notice}</p>}
      <div className="flex flex-wrap gap-3 mt-6">
        <button type="button" onClick={() => setPhase('review')} className="min-h-11 px-4 border border-[var(--border-strong)] font-semibold focus-ring">← {tr('Review answers', 'जवाब जाँचें', 'उत्तरे तपासा')}</button>
        <button type="button" onClick={finishRegistration} disabled={!otpSent || otp.length !== 6} className="min-h-11 px-6 bg-[var(--gov-navy)] text-white font-semibold disabled:opacity-50 focus-ring">{tr('Create demo account', 'डेमो खाता बनाएँ', 'डेमो खाते तयार करा')}</button>
      </div>
    </section>}

    {phase === 'success' && role && <section className="gov-card p-6 sm:p-8">
      <p className="text-[12px] font-bold text-[var(--signal-rising)]">{tr('Complete', 'पूरा हुआ', 'पूर्ण झाले')}</p>
      <h2 className="text-[23px] font-bold text-[var(--gov-navy)] mt-2">{tr('Your demo account is ready', 'आपका डेमो खाता तैयार है', 'तुमचे डेमो खाते तयार आहे')}</h2>
      <p className="text-[14px] text-[var(--ink-secondary)] mt-2">{tr('Your Pragati ID is', 'आपकी प्रगति आईडी है', 'तुमचा प्रगती आयडी आहे')} <strong className="mono text-[var(--gov-navy)]">{issued}</strong></p>
      <p className="text-[13px] text-[var(--ink-secondary)] mt-2">{tr('This account is stored in this browser for the hackathon demo.', 'यह खाता हैकाथॉन डेमो के लिए इसी ब्राउज़र में रखा गया है।', 'हे खाते हॅकाथॉन डेमोसाठी याच ब्राउझरमध्ये ठेवले आहे.')}</p>
      <button type="button" onClick={() => router.push(`/dashboard/${role}`)} className="min-h-11 px-6 bg-[var(--gov-navy)] text-white font-semibold mt-6 focus-ring">{tr('Open my dashboard', 'मेरा पेज खोलें', 'माझे पान उघडा')} →</button>
    </section>}

    {phase !== 'success' && <p className="text-center text-[13px] text-[var(--ink-secondary)] mt-6">{tr('Already registered?', 'पहले से पंजीकृत हैं?', 'आधीच नोंदणी केली आहे?')} <Link href="/login" className="gov-link font-semibold">{tr('Login here', 'यहाँ लॉग इन करें', 'येथे लॉग इन करा')}</Link></p>}
  </div>;
}
