'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { TrendArea } from '@/components/charts/Charts';
import { demoCandidate } from '@/data/demoCandidate';
import { courses } from '@/data/courses';
import { hiringPools, poolSeatsCommitted, poolWageFloor } from '@/data/hiring';
import { computeDemandTrend } from '@/data/compute/demandTrend';
import { computeGapForDistrict } from '@/data/compute/gapAnalysis';
import { getSyllabus } from '@/data/syllabus';
import { localize, useSiteLanguage } from '@/lib/site-language';

const number = (value: number) => value.toLocaleString('en-IN');

export function CandidateDemoStory() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const { districtId, skillId, courseId, poolId } = demoCandidate;
  const trend = computeDemandTrend(skillId, districtId);
  const gap = computeGapForDistrict(districtId).find(item => item.skillId === skillId);
  const course = courses.find(item => item.id === courseId);
  const pool = hiringPools.find(item => item.id === poolId);
  const syllabus = getSyllabus(courseId);
  if (!gap || !course || !pool || !syllabus) return null;

  const signedSeats = poolSeatsCommitted(pool);
  const vacancy = course.currentSeats - course.enrolled;
  const safetyModule = syllabus.modules.find(module => module.code === 'EV-01');
  const diagnosticsModule = syllabus.modules.find(module => module.code === 'EV-03');

  return (
    <section className="mb-6" aria-labelledby="demo-worker-heading">
      <div className="gov-card p-5 mb-4 border-l-4 border-l-[var(--accent-student)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-student)]">
              {tr('Illustrative worker journey · demo data', 'उदाहरण कामगार यात्रा · डेमो डेटा', 'उदाहरण कामगार प्रवास · डेमो माहिती')}
            </p>
            <h2 id="demo-worker-heading" className="text-[21px] font-bold text-[var(--gov-navy)] mt-1">
              {demoCandidate.name}: {tr('from factory helper to EV technician', 'फ़ैक्टरी सहायक से EV तकनीशियन', 'कारखाना मदतनीस ते EV तंत्रज्ञ')}
            </h2>
            <p className="text-[14px] text-[var(--ink-secondary)] mt-2 max-w-3xl leading-relaxed">
              {tr('A 12th-pass worker with one year of on-call pack-assembly work in Chakan wants a more stable battery-diagnostics role. This example connects what he says in onboarding to local jobs, the course syllabus and actual seat constraints in the demo dataset.',
                'चाकण में एक साल पैक-असेंबली काम कर चुका 12वीं पास कामगार बैटरी जाँच का स्थिर काम चाहता है। यह उदाहरण उसके जवाबों को स्थानीय मांग, पाठ्यक्रम और उपलब्ध सीटों से जोड़ता है।',
                'चाकणमध्ये एक वर्ष पॅक असेंब्लीचे काम केलेल्या बारावी उत्तीर्ण कामगाराला बॅटरी तपासणीचे स्थिर काम हवे आहे. हे उदाहरण त्याची उत्तरे स्थानिक मागणी, अभ्यासक्रम आणि जागांशी जोडते.')}
            </p>
          </div>
          <Link href="/dashboard/student/onboarding" className="text-[13px] font-bold px-4 py-2.5 border border-[var(--accent-student)] text-[var(--accent-student)] rounded-sm focus-ring hover:bg-[var(--surface-alt)]">
            {tr('Try the conversation →', 'बातचीत शुरू करें →', 'संभाषण सुरू करा →')}
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-4">
        <Card title={tr('Local demand for this role', 'इस काम की स्थानीय मांग', 'या कामाची स्थानिक मागणी')}
          subtitle={tr('EV battery diagnostics · Pune · simulated monthly job-posting series', 'EV बैटरी जाँच · पुणे · नमूना मासिक नौकरी डेटा', 'EV बॅटरी तपासणी · पुणे · नमुना मासिक नोकरी माहिती')}>
          <TrendArea data={trend.timeSeries} height={210} label={tr('Demo job postings', 'नमूना नौकरियाँ', 'नमुना नोकऱ्या')} />
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)] text-center">
            <div><p className="text-[11px] text-[var(--ink-tertiary)]">{tr('Recent / month', 'हाल में / माह', 'अलीकडे / महिना')}</p><p className="text-[20px] font-bold mono">{number(trend.currentMonthlyDemand)}</p></div>
            <div><p className="text-[11px] text-[var(--ink-tertiary)]">{tr('Change', 'बदलाव', 'बदल')}</p><p className="text-[20px] font-bold mono text-[var(--signal-rising)]">{trend.yoyChangePercent > 0 ? '+' : ''}{trend.yoyChangePercent}%</p></div>
            <div><p className="text-[11px] text-[var(--ink-tertiary)]">{tr('Annual seat gap', 'सालाना सीट अंतर', 'वार्षिक जागांची तूट')}</p><p className="text-[20px] font-bold mono">{number(gap.gap)}</p></div>
          </div>
          <p className="text-[11px] text-[var(--ink-tertiary)] mt-3 leading-relaxed">
            {tr('The annual gap compares recent monthly postings × 12 with course seats. It is a planning signal, not a promise of a job.',
              'सालाना अंतर हाल की मासिक नौकरियाँ × 12 और प्रशिक्षण सीटों की तुलना है। यह योजना का संकेत है, नौकरी की गारंटी नहीं।',
              'वार्षिक तूट म्हणजे अलीकडील मासिक नोकऱ्या × १२ आणि प्रशिक्षण जागांची तुलना. हा नियोजनाचा संकेत आहे, नोकरीची हमी नाही.')}
          </p>
        </Card>

        <Card title={tr('What he knows and what the course teaches', 'वह क्या जानता है और पाठ्यक्रम क्या सिखाता है', 'त्याला काय येते आणि अभ्यासक्रम काय शिकवतो')}
          subtitle={tr('Illustrative self-report, 0–5 scale · target reflects course modules, not a tested score', 'नमूना स्व-मूल्यांकन, 0–5 · लक्ष्य पाठ्यक्रम से है, परीक्षा परिणाम नहीं', 'नमुना स्व-मूल्यांकन, 0–5 · लक्ष्य अभ्यासक्रमावर आधारित, परीक्षेचा निकाल नाही')}>
          <div className="space-y-3">
            {demoCandidate.capabilities.map(item => (
              <div key={item.label}>
                <div className="flex justify-between gap-2 text-[12px] mb-1">
                  <span className="font-semibold">{localize(language, item.label, item.hi, item.mr)}</span>
                  <span className="mono text-[var(--ink-tertiary)]">{item.current}/5 · {item.target}/5</span>
                </div>
                <div className="h-3 bg-[var(--surface-alt)] border border-[var(--border)] relative" role="img" aria-label={`${localize(language, item.label, item.hi, item.mr)}: ${item.current} of 5, target ${item.target} of 5`}>
                  <div className="h-full bg-[var(--accent-student)]" style={{ width: `${item.current * 20}%` }} />
                  <div className="absolute h-full border-r-2 border-[var(--signal-rising)] top-0" style={{ left: `${item.target * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--ink-tertiary)] mt-3">
            {tr('Blue = what Aarav reports · green marker = training target. Safety and BMS diagnostics are the priority gaps.',
              'नीला = आरव के बताए कौशल · हरा निशान = प्रशिक्षण लक्ष्य। सुरक्षा और BMS जाँच सबसे ज़रूरी हैं।',
              'निळा = आरवने सांगितलेली कौशल्ये · हिरवी खूण = प्रशिक्षण लक्ष्य. सुरक्षा आणि BMS तपासणी महत्त्वाची आहे.')}
          </p>
        </Card>
      </div>

      <div className="gov-card p-4 grid md:grid-cols-3 gap-4 text-[13px]">
        <div>
          <p className="font-bold text-[var(--gov-navy)]">{tr('1. Course capacity', '1. प्रशिक्षण सीटें', '१. प्रशिक्षण जागा')}</p>
          <p className="text-[var(--ink-secondary)] mt-1">{course.name}: <strong>{course.enrolled}/{course.currentSeats}</strong> {tr('seats filled', 'सीटें भरी हैं', 'जागा भरल्या आहेत')}. {vacancy === 0 ? tr('Next intake needed; do not promise an immediate seat.', 'अगले बैच की ज़रूरत है; अभी सीट का वादा नहीं।', 'पुढील तुकडी हवी; लगेच जागेचे आश्वासन नाही.') : tr(`${vacancy} seats remain.`, `${vacancy} सीटें बची हैं।`, `${vacancy} जागा उरल्या आहेत.`)}</p>
        </div>
        <div>
          <p className="font-bold text-[var(--gov-navy)]">{tr('2. Update the teaching plan', '2. पढ़ाई में सुधार', '२. प्रशिक्षणात सुधारणा')}</p>
          <p className="text-[var(--ink-secondary)] mt-1">{safetyModule?.title} ({safetyModule?.hours}h) + {diagnosticsModule?.title} ({diagnosticsModule?.hours}h). {tr('Prioritise the insulation tester, CAN analyser and trainers for these modules.', 'इनके लिए इंसुलेशन टेस्टर, CAN उपकरण और प्रशिक्षक को प्राथमिकता दें।', 'यासाठी इन्सुलेशन टेस्टर, CAN उपकरण आणि प्रशिक्षकांना प्राधान्य द्या.')}</p>
        </div>
        <div>
          <p className="font-bold text-[var(--gov-navy)]">{tr('3. Employer check', '3. नियोक्ता प्रमाण', '३. नियोक्ता पडताळणी')}</p>
          <p className="text-[var(--ink-secondary)] mt-1"><strong>{signedSeats}</strong> {tr('signed seats in the Pune cluster pool, with a wage floor from', 'पुणे समूह में पक्की सीटें, न्यूनतम मासिक वेतन', 'पुणे समूहातील करारबद्ध जागा, किमान मासिक वेतन')} <strong>₹{number(poolWageFloor(pool))}</strong>. {tr('That batch is already in work trials, not open for Aarav to apply to.', 'वह बैच अब कार्य-परीक्षण में है, आरव के लिए अभी खुला नहीं है।', 'ती तुकडी आता कामाच्या चाचणीत आहे, आरवसाठी अर्जाला खुली नाही.')}</p>
        </div>
      </div>
    </section>
  );
}
