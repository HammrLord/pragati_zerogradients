'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCitizen } from '@/lib/session';
import { localize, setSiteLanguage, useSiteLanguage, type SiteLanguage } from '@/lib/site-language';

type Kind = 'candidate' | 'job' | 'grievance';
type Message = { role: 'assistant' | 'user'; content: string };
type Question = { key: string; label: string; question: string; placeholder: string; options?: string[] };

const FLOWS: Record<Kind, { questions: Question[] }> = {
  candidate: {
    questions: [
      { key: 'qualification', label: 'Education', question: 'What is your highest qualification?', placeholder: 'For example: ITI Electrician', options: ['10th standard', '12th standard', 'ITI certificate', 'Diploma / Polytechnic', 'Graduate', 'No formal certificate'] },
      { key: 'targetRole', label: 'Work wanted', question: 'What kind of job or trade are you looking for?', placeholder: 'For example: electrician or driver' },
      { key: 'skills', label: 'What you can do', question: 'Which practical skills or tools do you already know?', placeholder: 'For example: wiring or using a multimeter' },
      { key: 'experience', label: 'Past work', question: 'How much work experience do you have?', placeholder: 'For example: 1 year as a helper', options: ['Fresher', 'Under 1 year', '1–2 years', 'More than 2 years'] },
      { key: 'availability', label: 'Start date', question: 'When are you available to start?', placeholder: 'For example: Immediately', options: ['Immediately', 'Within 15 days', 'Within a month'] },
    ],
  },
  job: {
    questions: [
      { key: 'jobTitle', label: 'Work', question: 'What job do you want to offer?', placeholder: 'For example: machine operator' },
      { key: 'location', label: 'Place', question: 'Where is this job located?', placeholder: 'For example: Pune, Chakan' },
      { key: 'skills', label: 'Skills needed', question: 'Which skills should the candidate have?', placeholder: 'For example: operating a CNC machine' },
      { key: 'experience', label: 'Past work needed', question: 'How much experience is needed?', placeholder: 'For example: 1–2 years', options: ['Fresher accepted', '1–2 years', '3+ years'] },
      { key: 'openings', label: 'People needed', question: 'How many people do you want to hire?', placeholder: 'For example: 4' },
      { key: 'salary', label: 'Monthly pay', question: 'What monthly pay range are you offering?', placeholder: 'For example: ₹18,000–₹22,000' },
    ],
  },
  grievance: {
    questions: [
      { key: 'issue', label: 'What happened', question: 'Briefly tell me what happened.', placeholder: 'For example: I finished work but was not paid' },
      { key: 'organisation', label: 'Who was involved', question: 'Which training centre or employer is involved?', placeholder: 'Name of the centre or employer' },
      { key: 'district', label: 'Place', question: 'Which district is this about?', placeholder: 'For example: Pune' },
      { key: 'when', label: 'When', question: 'When did this happen?', placeholder: 'For example: August 2026' },
      { key: 'resolution', label: 'What would help', question: 'What outcome would help resolve this?', placeholder: 'For example: payment and a response' },
    ],
  },
};

// Bulbul v3 does not support Urdu speech. The portal helpline offers Urdu;
// this online spoken flow only lists languages Sarvam can actually speak.
const LANGUAGES = [['mr', 'मराठी'], ['hi', 'हिन्दी'], ['en', 'English']] as const;
const SPOKEN_QUESTIONS: Record<Kind, Record<'mr' | 'hi', string[]>> = {
  candidate: {
    mr: ['तुमचे शिक्षण किती झाले आहे?', 'तुम्हाला कोणते काम करायचे आहे?', 'तुम्हाला कोणते काम किंवा साधने वापरता येतात?', 'तुम्ही याआधी किती काळ काम केले आहे?', 'तुम्ही काम कधी सुरू करू शकता?'],
    hi: ['आपने कहाँ तक पढ़ाई की है?', 'आप किस तरह का काम करना चाहते हैं?', 'आपको कौन सा काम या औज़ार इस्तेमाल करना आता है?', 'आपने पहले कितने समय काम किया है?', 'आप काम कब शुरू कर सकते हैं?'],
  },
  job: {
    mr: ['तुम्हाला कोणत्या कामासाठी माणसे हवी आहेत?', 'कामाचे ठिकाण कुठे आहे?', 'कामगाराला कोणते काम येणे गरजेचे आहे?', 'आधीचा अनुभव किती हवा?', 'तुम्हाला किती माणसे हवी आहेत?', 'दर महिन्याला किती पगार द्याल?'],
    hi: ['आप किस काम के लिए लोगों को रखना चाहते हैं?', 'काम की जगह कहाँ है?', 'काम करने वाले को कौन सा काम आना चाहिए?', 'पहले का कितना अनुभव चाहिए?', 'आपको कितने लोग चाहिए?', 'हर महीने कितनी तनख्वाह देंगे?'],
  },
  grievance: {
    mr: ['काय घडले ते थोडक्यात सांगा.', 'कोणते प्रशिक्षण केंद्र किंवा नियोक्ता यात आहे?', 'हे कोणत्या जिल्ह्यात घडले?', 'हे कधी घडले?', 'ही अडचण दूर होण्यासाठी तुम्हाला काय हवे आहे?'],
    hi: ['क्या हुआ, थोड़ा बताइए।', 'इसमें कौन सा प्रशिक्षण केंद्र या काम देने वाला शामिल है?', 'यह किस ज़िले की बात है?', 'यह कब हुआ?', 'इस परेशानी का क्या हल चाहते हैं?'],
  },
};

function spokenQuestion(kind: Kind, step: number, language: string) {
  if (language === 'mr' || language === 'hi') return SPOKEN_QUESTIONS[kind][language][step];
  return FLOWS[kind].questions[step].question;
}

function reviewSpeech(language: string) {
  return language === 'mr' ? 'तुमची उत्तरे तपासा. बरोबर असतील तर सेव्ह करा.'
    : language === 'hi' ? 'अपने जवाब जाँचें। सही हों तो सेव करें।'
      : 'Please check your answers. If they look right, tap Save.';
}

function completeSpeech(kind: Kind, language: string) {
  if (language === 'mr') return kind === 'grievance'
    ? 'तुमच्या तक्रारीचा मसुदा तयार आहे. अधिकृत मदतीसाठी हेल्पलाइनवर फोन करा किंवा जिल्हा कौशल्य कार्यालयात जा.'
    : kind === 'job' ? 'तुमच्या कामाची माहिती तयार आहे. ही फक्त डेमोसाठी आहे.' : 'तुमची कामाची माहिती तयार आहे. ही फक्त डेमोसाठी आहे.';
  if (language === 'hi') return kind === 'grievance'
    ? 'आपकी शिकायत का मसौदा तैयार है। आधिकारिक मदद के लिए हेल्पलाइन पर फोन करें या ज़िला कौशल कार्यालय जाएँ।'
    : kind === 'job' ? 'आपके काम की जानकारी तैयार है। यह सिर्फ डेमो के लिए है।' : 'आपकी काम की जानकारी तैयार है। यह सिर्फ डेमो के लिए है।';
  return kind === 'grievance'
    ? 'Your complaint note is ready. This is only a draft. Call the helpline or visit your district skill office to formally report it.'
    : kind === 'job' ? 'Your demo job brief is ready.' : 'Your demo work profile is ready.';
}

const OPTION_TEXT: Record<string, { mr: string; hi: string }> = {
  '10th standard': { mr: 'इयत्ता १० वी', hi: 'कक्षा १०' },
  '12th standard': { mr: 'इयत्ता १२ वी', hi: 'कक्षा १२' },
  'ITI certificate': { mr: 'आयटीआय प्रमाणपत्र', hi: 'आईटीआई प्रमाणपत्र' },
  'Diploma / Polytechnic': { mr: 'डिप्लोमा / पॉलिटेक्निक', hi: 'डिप्लोमा / पॉलिटेक्निक' },
  Graduate: { mr: 'पदवीधर', hi: 'स्नातक' },
  'No formal certificate': { mr: 'प्रमाणपत्र नाही', hi: 'कोई प्रमाणपत्र नहीं' },
  Fresher: { mr: 'पहिल्यांदाच काम', hi: 'पहली नौकरी' },
  'Under 1 year': { mr: '१ वर्षापेक्षा कमी', hi: '१ साल से कम' },
  '1–2 years': { mr: '१ ते २ वर्षे', hi: '१ से २ साल' },
  'More than 2 years': { mr: '२ वर्षांपेक्षा जास्त', hi: '२ साल से ज़्यादा' },
  Immediately: { mr: 'लगेच', hi: 'तुरंत' },
  'Within 15 days': { mr: '१५ दिवसांत', hi: '१५ दिनों में' },
  'Within a month': { mr: 'एका महिन्यात', hi: 'एक महीने में' },
  'Fresher accepted': { mr: 'नवीन व्यक्ती चालेल', hi: 'बिना अनुभव चलेगा' },
  '3+ years': { mr: '३ वर्षे किंवा जास्त', hi: '३ साल या ज़्यादा' },
};

function optionText(option: string, language: string) {
  if (language === 'mr' || language === 'hi') return OPTION_TEXT[option]?.[language] ?? option;
  return option;
}

const FLOW_COPY: Record<Kind, Record<SiteLanguage, { title: string; intro: string; complete: string; fields: string[] }>> = {
  candidate: {
    en: { title: 'Make my work profile', intro: 'I will ask a few short questions. You can speak or type. This makes a profile for this demo.', complete: 'Your demo work profile is ready.', fields: ['Education', 'Work wanted', 'What you can do', 'Past work', 'Start date'] },
    hi: { title: 'मेरी काम की जानकारी बनाएँ', intro: 'मैं कुछ आसान सवाल पूछूँगा। आप बोलकर या लिखकर जवाब दे सकते हैं। यह जानकारी सिर्फ डेमो के लिए है।', complete: 'आपकी डेमो जानकारी तैयार है।', fields: ['पढ़ाई', 'किस तरह का काम', 'आप क्या कर सकते हैं', 'पहले का काम', 'काम कब शुरू करेंगे'] },
    mr: { title: 'माझ्या कामाची माहिती तयार करा', intro: 'मी काही सोपे प्रश्न विचारेन. तुम्ही बोलून किंवा लिहून उत्तर देऊ शकता. ही माहिती फक्त डेमोसाठी आहे.', complete: 'तुमची डेमो माहिती तयार आहे.', fields: ['शिक्षण', 'कोणते काम हवे', 'तुम्हाला काय येते', 'आधीचे काम', 'काम कधी सुरू कराल'] },
  },
  job: {
    en: { title: 'Tell us about your job', intro: 'Tell me about the work you want to offer. I will make a simple job brief for this demo.', complete: 'Your demo job brief is ready.', fields: ['Work', 'Place', 'Skills needed', 'Past work needed', 'People needed', 'Monthly pay'] },
    hi: { title: 'अपनी नौकरी के बारे में बताएँ', intro: 'आप जो काम देना चाहते हैं, उसके बारे में बताएँ। मैं डेमो के लिए उसकी जानकारी तैयार करूँगा।', complete: 'आपकी डेमो नौकरी की जानकारी तैयार है।', fields: ['काम', 'काम की जगह', 'ज़रूरी हुनर', 'ज़रूरी अनुभव', 'कितने लोग', 'महीने की तनख्वाह'] },
    mr: { title: 'तुमच्या नोकरीबद्दल सांगा', intro: 'तुम्हाला जे काम द्यायचे आहे त्याबद्दल सांगा. मी डेमोसाठी त्याची माहिती तयार करेन.', complete: 'तुमच्या डेमो नोकरीची माहिती तयार आहे.', fields: ['काम', 'कामाचे ठिकाण', 'लागणारी कौशल्ये', 'लागणारा अनुभव', 'किती माणसे', 'महिन्याचा पगार'] },
  },
  grievance: {
    en: { title: 'Tell us your problem', intro: 'I will help make a note of your problem. This does not formally file a complaint. Do not share bank details, Aadhaar or passwords.', complete: 'Your demo complaint note is ready.', fields: ['What happened', 'Who was involved', 'Place', 'When', 'What would help'] },
    hi: { title: 'अपनी परेशानी बताएँ', intro: 'मैं आपकी बात लिखने में मदद करूँगा। इससे सरकारी शिकायत दर्ज नहीं होती। बैंक की जानकारी, आधार नंबर या पासवर्ड न बताएँ।', complete: 'आपकी डेमो शिकायत का नोट तैयार है।', fields: ['क्या हुआ', 'कौन शामिल था', 'कौन सा ज़िला', 'कब हुआ', 'क्या मदद चाहिए'] },
    mr: { title: 'तुमची अडचण सांगा', intro: 'मी तुमची अडचण नोंदवायला मदत करेन. याने अधिकृत तक्रार दाखल होत नाही. बँकेची माहिती, आधार क्रमांक किंवा पासवर्ड सांगू नका.', complete: 'तुमच्या डेमो तक्रारीचा मसुदा तयार आहे.', fields: ['काय घडले', 'कोण सहभागी होते', 'कोणता जिल्हा', 'कधी घडले', 'काय मदत हवी'] },
  },
};

const UI = {
  en: {
    speakIn: 'Speak in', question: 'Question', of: 'of', answered: 'answered',
    hear: 'Play question', replay: 'Replay question', stopVoice: 'Stop audio', voiceOff: 'Turn off audio',
    helpHeading: 'Need help with this question?', explain: 'Explain this question', gettingHelp: 'Getting help…', voiceHint: 'The next question will play automatically. You can turn off audio at any time.',
    askPlaceholder: 'Ask about this question', askGuide: 'Ask', askVoice: 'Record a question',
    tapAnswer: 'Choose an answer, or enter your own:', speakAnswer: 'Record answer', stopRecording: 'Stop recording', typeAnswer: 'Type your answer',
    answerTranscript: 'Your words are in the box above. Check or change them, then press Next.',
    helpTranscript: 'Your question is shown above. Check or change it, then press Ask.',
    recordingHint: 'After you stop recording, your words will appear in the answer box.',
    next: 'Next →', review: 'Does this look right?', reviewHint: 'Your answers are below. You can change any answer.',
    change: 'Change this answer', saving: 'Saving…', saveCandidate: 'Save my profile', saveJob: 'Save job brief', saveGrievance: 'Save my note',
    demoReference: 'Demo reference:', draftWarning: 'This note is not a formally filed grievance. For formal help, call', districtOffice: 'or visit your district skill office.',
    demoWarning: 'Saved for this demo. This is not a live application or vacancy.',
    publicDemoWarning: 'This is a demo only. These answers are not saved to an account.',
    registerNext: 'Register to use the portal',
    nextActions: 'What can I do next?', earlier: 'See my earlier answers',
    stagesCandidate: ['Tell us about you', 'Check your profile', 'Profile ready'],
    stagesJob: ['Describe the job', 'Check the details', 'Brief ready'],
    stagesGrievance: ['Tell us the problem', 'Check the note', 'Get formal help'],
  },
  hi: {
    speakIn: 'इस भाषा में बोलें', question: 'सवाल', of: 'में से', answered: 'जवाब पूरे',
    hear: 'सवाल सुनें', replay: 'फिर से सुनें', stopVoice: 'आवाज़ रोकें', voiceOff: 'आवाज़ बंद करें',
    helpHeading: 'इस सवाल में मदद चाहिए?', explain: 'सवाल समझाइए', gettingHelp: 'मदद मिल रही है…', voiceHint: 'अगला सवाल अपने आप सुनाया जाएगा। चाहें तो आवाज़ बंद कर सकते हैं।',
    askPlaceholder: 'इस सवाल के बारे में पूछें', askGuide: 'पूछें', askVoice: 'सवाल बोलकर पूछें',
    tapAnswer: 'जवाब चुनें या अपना जवाब दें:', speakAnswer: 'जवाब रिकॉर्ड करें', stopRecording: 'रिकॉर्डिंग रोकें', typeAnswer: 'जवाब लिखें',
    answerTranscript: 'आपकी बात ऊपर लिखी है। जाँचें या बदलें, फिर आगे दबाएँ।',
    helpTranscript: 'आपका सवाल ऊपर लिखा है। जाँचें या बदलें, फिर पूछें दबाएँ।',
    recordingHint: 'रिकॉर्डिंग रोकने के बाद आपकी बात जवाब के डिब्बे में दिखेगी।',
    next: 'आगे →', review: 'क्या यह सही है?', reviewHint: 'अपने जवाब देखें। कोई भी जवाब बदल सकते हैं।',
    change: 'यह जवाब बदलें', saving: 'सेव हो रहा है…', saveCandidate: 'मेरी जानकारी सेव करें', saveJob: 'नौकरी की जानकारी सेव करें', saveGrievance: 'मेरा नोट सेव करें',
    demoReference: 'डेमो नंबर:', draftWarning: 'यह सरकारी शिकायत नहीं है। मदद के लिए फोन करें', districtOffice: 'या ज़िला कौशल कार्यालय जाएँ।',
    demoWarning: 'सिर्फ डेमो के लिए सेव हुआ है। यह असली आवेदन या नौकरी नहीं है।',
    publicDemoWarning: 'यह सिर्फ डेमो है। ये जवाब किसी खाते में सेव नहीं हुए हैं।',
    registerNext: 'पोर्टल इस्तेमाल करने के लिए पंजीकरण करें',
    nextActions: 'अब क्या करें?', earlier: 'मेरे पुराने जवाब देखें',
    stagesCandidate: ['अपने बारे में बताएँ', 'जवाब जाँचें', 'जानकारी तैयार'],
    stagesJob: ['नौकरी बताएँ', 'जानकारी जाँचें', 'काम तैयार'],
    stagesGrievance: ['परेशानी बताएँ', 'नोट जाँचें', 'मदद लें'],
  },
  mr: {
    speakIn: 'या भाषेत बोला', question: 'प्रश्न', of: 'पैकी', answered: 'उत्तरे पूर्ण',
    hear: 'प्रश्न ऐका', replay: 'पुन्हा ऐका', stopVoice: 'आवाज थांबवा', voiceOff: 'आवाज बंद करा',
    helpHeading: 'या प्रश्नात मदत हवी आहे?', explain: 'प्रश्न समजावून सांगा', gettingHelp: 'मदत मिळत आहे…', voiceHint: 'पुढचा प्रश्न आपोआप ऐकू येईल. हवे असल्यास आवाज बंद करू शकता.',
    askPlaceholder: 'या प्रश्नाबद्दल विचारा', askGuide: 'विचारा', askVoice: 'बोलून प्रश्न विचारा',
    tapAnswer: 'उत्तर निवडा किंवा स्वतःचे उत्तर द्या:', speakAnswer: 'उत्तर रेकॉर्ड करा', stopRecording: 'रेकॉर्डिंग थांबवा', typeAnswer: 'उत्तर लिहा',
    answerTranscript: 'तुमचे बोलणे वर लिहिले आहे. तपासा किंवा बदला, मग पुढे दाबा.',
    helpTranscript: 'तुमचा प्रश्न वर लिहिला आहे. तपासा किंवा बदला, मग विचारा दाबा.',
    recordingHint: 'रेकॉर्डिंग थांबवल्यावर तुमचे बोलणे उत्तराच्या चौकटीत दिसेल.',
    next: 'पुढे →', review: 'ही माहिती बरोबर आहे का?', reviewHint: 'तुमची उत्तरे तपासा. कोणतेही उत्तर बदलू शकता.',
    change: 'हे उत्तर बदला', saving: 'सेव्ह होत आहे…', saveCandidate: 'माझी माहिती सेव्ह करा', saveJob: 'नोकरीची माहिती सेव्ह करा', saveGrievance: 'माझा मसुदा सेव्ह करा',
    demoReference: 'डेमो क्रमांक:', draftWarning: 'ही अधिकृत तक्रार नाही. मदतीसाठी फोन करा', districtOffice: 'किंवा जिल्हा कौशल्य कार्यालयात जा.',
    demoWarning: 'फक्त डेमोसाठी सेव्ह झाले आहे. हा खरा अर्ज किंवा नोकरी नाही.',
    publicDemoWarning: 'हे फक्त डेमो आहे. ही उत्तरे कोणत्याही खात्यात सेव्ह झालेली नाहीत.',
    registerNext: 'पोर्टल वापरण्यासाठी नोंदणी करा',
    nextActions: 'आता काय करावे?', earlier: 'माझी आधीची उत्तरे पहा',
    stagesCandidate: ['तुमच्याबद्दल सांगा', 'उत्तरे तपासा', 'माहिती तयार'],
    stagesJob: ['नोकरी सांगा', 'माहिती तपासा', 'काम तयार'],
    stagesGrievance: ['अडचण सांगा', 'मसुदा तपासा', 'मदत घ्या'],
  },
} as const;

export function OnboardingAgent({ role, topic = 'onboarding' }: { role: 'student' | 'business'; topic?: 'onboarding' | 'grievance' }) {
  const kind: Kind = topic === 'grievance' ? 'grievance' : role === 'student' ? 'candidate' : 'job';
  const flow = FLOWS[kind];
  const { account, update } = useCitizen();
  const linkedAccount = account?.role === role ? account : null;
  const language = useSiteLanguage();
  const copy = FLOW_COPY[kind][language];
  const ui = UI[language];
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [helping, setHelping] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [helpQuery, setHelpQuery] = useState('');
  const [answerTranscribed, setAnswerTranscribed] = useState(false);
  const [helpTranscribed, setHelpTranscribed] = useState(false);
  const [notice, setNotice] = useState('');
  const [reference, setReference] = useState('');
  const [voiceOn, setVoiceOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const player = useRef<HTMLAudioElement | null>(null);
  const answerInput = useRef<HTMLTextAreaElement | null>(null);
  const helpInput = useRef<HTMLTextAreaElement | null>(null);
  const speechId = useRef(0);
  const question = flow.questions[step];
  const currentQuestion = step < flow.questions.length ? spokenQuestion(kind, step, language) : '';

  function stopSpeech() {
    speechId.current += 1;
    player.current?.pause();
    player.current = null;
    setSpeaking(false);
  }

  useEffect(() => () => {
    speechId.current += 1;
    player.current?.pause();
    recorder.current?.stream.getTracks().forEach(track => track.stop());
  }, []);

  async function speak(content: string, selectedLanguage = language) {
    stopSpeech();
    const requestId = speechId.current;
    setSpeaking(true);
    try {
      const response = await fetch('/api/onboarding/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, language: selectedLanguage }),
      });
      const data = await response.json() as { audio?: string; error?: string };
      if (!response.ok || !data.audio) throw new Error(data.error ?? 'Could not play the voice.');
      if (requestId !== speechId.current) return;
      const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
      player.current = audio;
      audio.onended = () => { if (requestId === speechId.current) setSpeaking(false); };
      audio.onerror = () => { if (requestId === speechId.current) { setSpeaking(false); setNotice(tr('Voice could not play. You can still read the question.', 'आवाज़ नहीं चली। सवाल पढ़कर भी जवाब दे सकते हैं।', 'आवाज चालला नाही. प्रश्न वाचूनही उत्तर देऊ शकता.')); } };
      await audio.play();
    } catch (error) {
      if (requestId === speechId.current) {
        setSpeaking(false);
        setNotice(language === 'en' && error instanceof Error ? error.message : tr('Voice could not play.', 'आवाज़ नहीं चली।', 'आवाज चालला नाही.'));
      }
    }
  }

  function answer(value: string) {
    const clean = value.trim();
    if (!clean || saving || recording || reference || step >= flow.questions.length) return;
    stopSpeech();
    const nextAnswers = { ...answers, [question.key]: clean };
    const nextStep = editing ? flow.questions.length : step + 1;
    setAnswers(nextAnswers);
    setText('');
    setAnswerTranscribed(false);
    setHelpText('');
    setHelpQuery('');
    setHelpTranscribed(false);
    setStep(nextStep);
    setEditing(false);
    setMessages(current => [...current, { role: 'user', content: clean }]);
    setNotice('');
    if (voiceOn) void speak(nextStep < flow.questions.length ? spokenQuestion(kind, nextStep, language) : reviewSpeech(language));
  }

  async function explainQuestion(userQuestion?: string) {
    if (helping || !question) return;
    if (userQuestion) setHelpTranscribed(false);
    setHelping(true);
    setHelpText('');
    setNotice('');
    const request = `I selected ${language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}. I am filling a ${kind === 'candidate' ? 'work profile' : kind === 'job' ? 'job brief' : 'grievance draft'}. The current question is "${currentQuestion}". ${userQuestion ? `My question: "${userQuestion.slice(0, 500)}". Please answer it simply, then return to the current question.` : 'Please explain this question simply and give one example.'}`;
    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          topic,
          language,
          messages: [{ role: 'user', content: request }],
        }),
      });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? 'Help is unavailable.');
      setHelpText(data.message);
      setHelpQuery('');
      if (voiceOn) void speak(data.message);
    } catch {
      // The interview itself must remain useful when Groq is unavailable.
      const fallback = language === 'mr'
        ? 'तुमच्या शब्दांत उत्तर द्या. माहिती नसेल तर “माहित नाही” असे म्हणू शकता.'
        : language === 'hi'
          ? 'अपने शब्दों में जवाब दें। पता न हो तो “मुझे नहीं पता” कह सकते हैं।'
          : `You can answer in your own words. For example: ${question.placeholder.replace(/^For example: /, '')}. It is okay to say "I don't know".`;
      setHelpText(fallback);
      setNotice(tr('Live help is unavailable. You can still continue.', 'अभी सहायक उपलब्ध नहीं है। आप आगे बढ़ सकते हैं।', 'सध्या सहाय्यक उपलब्ध नाही. तुम्ही पुढे जाऊ शकता.'));
      if (voiceOn) void speak(fallback);
    } finally {
      setHelping(false);
    }
  }

  async function submitIntake() {
    setSaving(true);
    setNotice('');
    try {
      const response = await fetch('/api/onboarding/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, answers }),
      });
      const data = await response.json() as { reference?: string; error?: string };
      if (!response.ok || !data.reference) throw new Error(data.error ?? 'Could not save the details.');
      if (linkedAccount) update({ onboarding: { kind, answers, reference: data.reference, completedAt: new Date().toISOString() } });
      setReference(data.reference);
      const ending = kind === 'grievance'
        ? `${copy.complete} ${ui.draftWarning} 1800-233-0202 ${ui.districtOffice}`
        : copy.complete;
      setMessages(current => [...current, { role: 'assistant', content: ending }]);
      if (voiceOn) void speak(completeSpeech(kind, language));
    } catch (error) {
      setNotice(language === 'en' && error instanceof Error ? error.message : tr('Could not save. Please try again.', 'सेव नहीं हुआ। फिर कोशिश करें।', 'सेव्ह झाले नाही. पुन्हा प्रयत्न करा.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleVoice(mode: 'answer' | 'help' = 'answer') {
    if (recording) { recorder.current?.stop(); return; }
    stopSpeech();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice(tr('This browser cannot record your voice. Please type your answer.', 'इस ब्राउज़र में आवाज़ रिकॉर्ड नहीं हो सकती। जवाब लिखें।', 'या ब्राउझरमध्ये आवाज नोंदवता येत नाही. उत्तर लिहा.'));
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
        setSaving(true);
        setNotice(tr('Turning your speech into words…', 'आपकी बात लिखी जा रही है…', 'तुमचे बोलणे लिहिले जात आहे…'));
        try {
          const audio = new Blob(chunks.current, { type: next.mimeType || 'audio/webm' });
          if (audio.size < 1024) throw new Error('No speech was captured. Tap the microphone, talk for a moment, then tap Stop.');
          const form = new FormData();
          const mediaType = audio.type.split(';', 1)[0];
          const extension = mediaType === 'audio/mp4' ? 'm4a' : mediaType === 'audio/ogg' ? 'ogg' : 'webm';
          form.append('audio', audio, `answer.${extension}`);
          form.append('language', language);
          const response = await fetch('/api/onboarding/stt', { method: 'POST', body: form });
          const data = await response.json() as { transcript?: string; error?: string };
          if (!response.ok || !data.transcript?.trim()) throw new Error(data.error ?? 'I could not hear that. Please try again.');
          // Keep recognized words visible and editable. Never advance the
          // interview or send a help request without the person's confirmation.
          if (mode === 'help') {
            setHelpQuery(data.transcript.trim());
            setHelpTranscribed(true);
            setNotice('');
            helpInput.current?.focus();
          } else {
            setText(data.transcript.trim());
            setAnswerTranscribed(true);
            setNotice('');
            answerInput.current?.focus();
          }
        } catch (error) {
          setNotice(language === 'en' && error instanceof Error ? error.message : tr('Could not understand. Please try again or type.', 'समझ नहीं आया। फिर बोलें या लिखें।', 'समजले नाही. पुन्हा बोला किंवा लिहा.'));
        } finally {
          setSaving(false);
        }
      };
      recorder.current = next;
      next.start(250);
      setRecording(true);
      setNotice(tr('Listening… speak, then tap Stop.', 'सुन रहा हूँ… बोलें, फिर रोकें दबाएँ।', 'ऐकत आहे… बोला, मग थांबवा दाबा.'));
    } catch {
      setNotice(tr('Microphone access was not granted. You can type instead.', 'माइक्रोफोन की अनुमति नहीं मिली। आप लिख सकते हैं।', 'मायक्रोफोनची परवानगी मिळाली नाही. तुम्ही लिहू शकता.'));
    }
  }

  const stage = reference ? 2 : step === flow.questions.length ? 1 : 0;
  const stages = kind === 'candidate' ? ui.stagesCandidate
    : kind === 'job' ? ui.stagesJob : ui.stagesGrievance;

  return (
    <section className="gov-card overflow-hidden" aria-label={copy.title}>
      <div className="p-5 sm:p-6 border-b border-[var(--border)]">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <p className="text-[14px] text-[var(--ink-secondary)] max-w-xl leading-relaxed">{copy.intro}</p>
          <label className="text-[13px] font-bold text-[var(--ink)]">
            {ui.speakIn}
            <select value={language} onChange={event => {
              stopSpeech();
              setSiteLanguage(event.target.value as SiteLanguage);
              setHelpText('');
              if (account) update({ language: event.target.value });
            }} className="ml-2 border border-[var(--border-strong)] bg-white rounded-sm px-3 py-2 focus-ring">
              {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
        </div>
        <ol className="grid grid-cols-3 border border-[var(--border)] mt-5" aria-label={tr('Your three steps', 'आपके तीन कदम', 'तुमच्या तीन पायऱ्या')}>
          {stages.map((label, index) => (
            <li key={label} aria-current={index === stage ? 'step' : undefined} className={`min-w-0 px-2 sm:px-4 py-3 border-r last:border-r-0 border-[var(--border)] ${index === stage ? 'bg-[var(--surface-alt)]' : 'bg-white'}`}>
              <span className="block text-[11px] font-bold text-[var(--ink-tertiary)]">{String(index + 1).padStart(2, '0')}</span>
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[var(--ink)] mt-1 leading-snug">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {step < flow.questions.length && (
        <div className="p-5 sm:p-7">
          <div className="flex justify-between gap-3 text-[12px] font-bold text-[var(--ink-secondary)]">
            <span>{ui.question} {step + 1} {ui.of} {flow.questions.length}</span>
            <span>{Math.round((step / flow.questions.length) * 100)}% {ui.answered}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-alt)] mt-2 overflow-hidden" aria-hidden>
            <div className="h-full bg-[var(--accent-student)] transition-all" style={{ width: `${(step / flow.questions.length) * 100}%` }} />
          </div>
          <p className="gov-label mt-6">{copy.fields[step]}</p>
          <h3 className="text-[21px] sm:text-[23px] leading-snug font-bold text-[var(--gov-navy)] mt-2" aria-live="polite">{currentQuestion}</h3>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" onClick={() => {
              if (speaking) { stopSpeech(); setVoiceOn(false); }
              else { setVoiceOn(true); void speak(currentQuestion); }
            }} className="min-h-11 px-4 border border-[var(--gov-navy)] bg-white text-[var(--gov-navy)] font-semibold text-[14px] focus-ring">
              {speaking ? ui.stopVoice : voiceOn ? ui.replay : ui.hear}
            </button>
            {voiceOn && !speaking && <button type="button" onClick={() => { stopSpeech(); setVoiceOn(false); }} className="min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[var(--ink)] font-semibold text-[13px] focus-ring">{ui.voiceOff}</button>}
          </div>
          {voiceOn && <p className="text-[12px] text-[var(--ink-secondary)] mt-2">{ui.voiceHint}</p>}

          {question.options && (
            <div className="mt-6">
              <p className="text-[13px] font-semibold text-[var(--ink-secondary)] mb-2">{ui.tapAnswer}</p>
              <div className="flex flex-wrap gap-2">
                {question.options.map(option => <button key={option} type="button" onClick={() => answer(optionText(option, language))} disabled={saving || recording} className="min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[14px] font-medium hover:border-[var(--gov-navy)] hover:bg-[var(--surface-alt)] disabled:opacity-50 focus-ring">{optionText(option, language)}</button>)}
              </div>
            </div>
          )}
          <div className="mt-6">
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-2" htmlFor={`answer-${kind}`}>{ui.typeAnswer}</label>
            <form onSubmit={(event: FormEvent) => { event.preventDefault(); answer(text); }} className="flex flex-col sm:flex-row gap-2">
              <textarea ref={answerInput} id={`answer-${kind}`} rows={3} value={text} onChange={event => setText(event.target.value)} className="gov-input min-w-0 flex-1 text-[15px] resize-y" placeholder={language === 'en' ? question.placeholder : ui.typeAnswer} aria-label={copy.fields[step]} />
              <button type="submit" disabled={!text.trim() || saving || recording} className="min-h-11 px-5 text-white font-semibold text-[14px] bg-[var(--gov-navy)] disabled:opacity-50 focus-ring self-start sm:self-end">{ui.next}</button>
            </form>
            {answerTranscribed && <p className="mt-2 text-[13px] text-[var(--ink-secondary)]" role="status">{ui.answerTranscript}</p>}
            <button type="button" onClick={() => void toggleVoice('answer')} disabled={saving && !recording} className="mt-3 min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] text-[14px] font-semibold disabled:opacity-50 focus-ring">
              {recording ? ui.stopRecording : ui.speakAnswer}
            </button>
            {!answerTranscribed && <p className="mt-2 text-[12px] text-[var(--ink-secondary)]">{ui.recordingHint}</p>}
          </div>
          {notice && <p className="mt-3 text-[13px] text-[var(--ink-secondary)]" role="status">{notice}</p>}
          <details className="mt-6 border-t border-[var(--border)] pt-4">
            <summary className="cursor-pointer text-[14px] font-semibold text-[var(--gov-navy)] focus-ring">{ui.helpHeading}</summary>
            <div className="pt-4">
              <button type="button" onClick={() => void explainQuestion()} disabled={helping} className="min-h-11 px-4 border border-[var(--border-strong)] bg-white text-[var(--gov-navy)] font-semibold text-[14px] disabled:opacity-50 focus-ring">
                {helping ? ui.gettingHelp : ui.explain}
              </button>
              {helpText && <div className="mt-3 p-4 border border-[var(--border)] bg-[var(--surface-alt)] text-[15px] leading-relaxed text-[var(--ink)]" role="status">{helpText}</div>}
              <form onSubmit={event => { event.preventDefault(); if (helpQuery.trim() && !saving && !recording) void explainQuestion(helpQuery.trim()); }} className="mt-3 flex flex-wrap gap-2">
                <textarea ref={helpInput} rows={2} value={helpQuery} onChange={event => setHelpQuery(event.target.value)} className="gov-input flex-1 min-w-[160px] resize-y" placeholder={ui.askPlaceholder} aria-label={ui.askGuide} />
                <button type="submit" disabled={!helpQuery.trim() || helping || saving || recording} className="min-h-11 px-4 border border-[var(--border-strong)] font-semibold text-[13px] disabled:opacity-50 focus-ring">{ui.askGuide}</button>
                <button type="button" onClick={() => void toggleVoice('help')} disabled={saving && !recording} className="min-h-11 px-4 border border-[var(--border-strong)] font-semibold text-[13px] disabled:opacity-50 focus-ring">{recording ? ui.stopRecording : ui.askVoice}</button>
              </form>
              {helpTranscribed && <p className="mt-2 text-[13px] text-[var(--ink-secondary)]" role="status">{ui.helpTranscript}</p>}
            </div>
          </details>
        </div>
      )}

      {step === flow.questions.length && !reference && (
        <div className="p-5 sm:p-7">
          <h3 className="text-[22px] font-bold text-[var(--gov-navy)]">{ui.review}</h3>
          <p className="mt-1 text-[14px] text-[var(--ink-secondary)]">{ui.reviewHint}</p>
          <dl className="grid sm:grid-cols-2 gap-3 mt-5">
            {flow.questions.map((item, index) => <div key={item.key} className="border border-[var(--border)] bg-white p-4">
              <dt className="text-[12px] font-bold text-[var(--ink-secondary)]">{index + 1}. {copy.fields[index]}</dt>
              <dd className="text-[16px] font-semibold text-[var(--ink)] mt-1 break-words">{answers[item.key]}</dd>
              <button type="button" onClick={() => {
                setEditing(true);
                setStep(index);
                setText(answers[item.key] ?? '');
                if (voiceOn) void speak(spokenQuestion(kind, index, language));
              }} className="mt-2 text-[12px] font-bold gov-link focus-ring">{ui.change}</button>
            </div>)}
          </dl>
          <div className="flex flex-wrap gap-3 mt-5">
            <button type="button" onClick={submitIntake} disabled={saving} className="min-h-11 px-5 bg-[var(--gov-navy)] text-white font-semibold disabled:opacity-50 focus-ring">{saving ? ui.saving : kind === 'candidate' ? ui.saveCandidate : kind === 'job' ? ui.saveJob : ui.saveGrievance}</button>
          </div>
          {notice && <p className="mt-3 text-[13px]" role="status">{notice}</p>}
        </div>
      )}

      {reference && <div className="p-6 border-l-4 border-[var(--signal-rising)] bg-white">
        <p className="text-[20px] font-bold text-[var(--gov-navy)]">{copy.complete}</p>
        <p className="text-[14px] text-[var(--ink)] mt-2">{ui.demoReference} <span className="mono">{reference}</span></p>
        {kind === 'grievance' && <p className="text-[14px] mt-3">{ui.draftWarning} <a className="gov-link font-bold" href="tel:18002330202">1800-233-0202</a> {ui.districtOffice}</p>}
        {kind !== 'grievance' && <p className="text-[14px] mt-3">{linkedAccount ? ui.demoWarning : ui.publicDemoWarning}</p>}
        {kind !== 'grievance' && !linkedAccount && <Link href={`/register?role=${role}`} className="inline-flex min-h-11 items-center mt-4 px-5 bg-[var(--gov-navy)] text-white text-[14px] font-semibold focus-ring">{ui.registerNext}</Link>}
        {kind !== 'grievance' && linkedAccount && <div className="mt-5">
          <p className="text-[14px] font-bold text-[var(--ink)] mb-2">{ui.nextActions}</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {(kind === 'candidate'
              ? [
                  [tr('Find a course', 'कोर्स खोजें', 'अभ्यासक्रम शोधा'), '/dashboard/student/recommend'],
                  [tr('See jobs near me', 'पास की नौकरियाँ देखें', 'जवळच्या नोकऱ्या पहा'), '/dashboard/student/jobs'],
                  [tr('Certify work I know', 'पुराने काम का प्रमाणपत्र', 'आधीच्या कामाचे प्रमाणपत्र'), '/dashboard/student/pathways'],
                ]
              : [
                  [tr('Post a vacancy', 'नौकरी पोस्ट करें', 'नोकरी जाहीर करा'), '/dashboard/business/signals'],
                  [tr('Hire together', 'मिलकर भर्ती करें', 'मिळून भरती करा'), '/dashboard/business/hiring'],
                  [tr('Certify workers', 'कामगारों का प्रमाणपत्र', 'कामगारांचे प्रमाणपत्र'), '/dashboard/business/rpl'],
                ]
            ).map(([label, href]) => <Link key={href} href={href} className="min-h-16 border border-[var(--border-strong)] bg-white px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--gov-navy)] focus-ring">
              <span className="text-[13px] font-semibold text-[var(--gov-navy)]">{label}</span>
              <span aria-hidden className="text-[var(--gov-navy)]">→</span>
            </Link>)}
          </div>
        </div>}
      </div>}
      {messages.length > 0 && <details className="border-t border-[var(--border)] px-5 py-3 text-[12px] text-[var(--ink-secondary)]">
        <summary className="cursor-pointer font-semibold">{ui.earlier}</summary>
        <ol className="mt-2 space-y-1">{messages.filter(message => message.role === 'user').map((message, index) => <li key={index}>{index + 1}. {message.content}</li>)}</ol>
      </details>}
    </section>
  );
}
