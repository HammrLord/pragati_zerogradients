'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, Stat, Note } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { TrendArea } from '@/components/charts/Charts';
import { courses } from '@/data/courses';
import { districts } from '@/data/districts';
import { getSkill } from '@/data/skills';
import { getSyllabus, hasDetailedSyllabus, MODULE_TYPE_LABEL } from '@/data/syllabus';
import { experimentsForCourse, significanceLabel } from '@/data/experiments';
import { dyingTasks } from '@/data/signals';
import { computeDemandTrend } from '@/data/compute/demandTrend';
import { schemes } from '@/data/schemes';
import { CourseType } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { localize, useSiteLanguage } from '@/lib/site-language';

const TYPE_TONE: Record<CourseType, 'officer' | 'employer' | 'student' | 'default'> = {
  ITI: 'officer', Polytechnic: 'employer', PMKVY: 'student', Private: 'default',
};

const MODULE_TONE = {
  theory: 'officer', practical: 'student', ojt: 'employer', 'soft-skill': 'default',
} as const;


/* ------------------------------------------------------------------ */
/*  Course sort orders                                                  */
/*                                                                      */
/*  Sorting here is not cosmetic. Each order answers a different planning */
/*  question, so the options are grouped by who is asking it — a         */
/*  candidate deciding what to enrol in, or an officer deciding what to  */
/*  notify. `value` pulls the number the order ranks on, and `unit`      */
/*  renders it on the card so the ordering is legible rather than magic. */
/* ------------------------------------------------------------------ */

interface CourseMetrics {
  demandYoY: number;
  wageCeiling: number;
  durationMonths: number;
  totalHours: number;
  practicalShare: number;
  seatsVacant: number;
  fillRate: number;
  staleModules: number;
  nsqfLevel: number;
}

interface SortOrder {
  id: string;
  label: string;
  group: 'Career planning' | 'Course quality' | 'Seat planning' | 'Reference';
  /** Explains what the order is for — shown under the control. */
  rationale: string;
  value: (m: CourseMetrics) => number;
  /** desc = highest first */
  direction: 'asc' | 'desc';
  /** How the ranked value reads on the card. */
  format: (m: CourseMetrics) => string;
}

const SORT_ORDERS: SortOrder[] = [
  {
    id: 'demand', label: 'Demand growth — fastest growing first', group: 'Career planning',
    rationale: 'Ranks by the year-on-year change in demo job postings for the course’s primary trade. This is the default because local demand matters before committing to a long course.',
    value: m => m.demandYoY, direction: 'desc',
    format: m => `${m.demandYoY >= 0 ? '+' : ''}${m.demandYoY}% demand YoY`,
  },
  {
    id: 'wage', label: 'Wage ceiling — highest first', group: 'Career planning',
    rationale: 'Ranks by the top of the salary band for the best-paying skill the course teaches.',
    value: m => m.wageCeiling, direction: 'desc',
    format: m => `up to ${formatCurrency(m.wageCeiling)}/mo`,
  },
  {
    id: 'duration', label: 'Time to qualify — shortest first', group: 'Career planning',
    rationale: 'For candidates who need to be earning quickly. A 3-month PMKVY course and a 24-month ITI trade are very different commitments.',
    value: m => m.durationMonths, direction: 'asc',
    format: m => `${m.durationMonths} months`,
  },
  {
    id: 'vacancy', label: 'Seats still vacant — most first', group: 'Career planning',
    rationale: 'Where you can realistically still get admitted this intake.',
    value: m => m.seatsVacant, direction: 'desc',
    format: m => `${m.seatsVacant} seats vacant`,
  },
  {
    id: 'practical', label: 'Hands-on share — most practical first', group: 'Course quality',
    rationale: 'Practical and on-the-job hours as a share of total contact hours. Employers hire on bench time, not theory marks.',
    value: m => m.practicalShare, direction: 'desc',
    format: m => `${Math.round(m.practicalShare * 100)}% hands-on`,
  },
  {
    id: 'stale', label: 'Stale content — worst first', group: 'Course quality',
    rationale: 'Ranks by how many modules still teach a task the Dying Task Watch has flagged. This is the revision queue.',
    value: m => m.staleModules, direction: 'desc',
    format: m => (m.staleModules ? `${m.staleModules} stale module${m.staleModules > 1 ? 's' : ''}` : 'no stale modules'),
  },
  {
    id: 'hours', label: 'Total contact hours — most first', group: 'Course quality',
    rationale: 'Depth of the programme, independent of how many months it is spread across.',
    value: m => m.totalHours, direction: 'desc',
    format: m => `${formatNumber(m.totalHours)} hours`,
  },
  {
    id: 'fill', label: 'Oversubscription — most contested first', group: 'Seat planning',
    rationale: 'Enrolment against notified seats. A course at 100% with demand still rising is where seats should be added.',
    value: m => m.fillRate, direction: 'desc',
    format: m => `${Math.round(m.fillRate * 100)}% filled`,
  },
  {
    id: 'underfilled', label: 'Under-subscription — emptiest first', group: 'Seat planning',
    rationale: 'The other half of the same question. Courses that cannot fill are candidates for closure or redesign.',
    value: m => m.fillRate, direction: 'asc',
    format: m => `${Math.round(m.fillRate * 100)}% filled`,
  },
  {
    id: 'nsqf', label: 'NSQF level — highest first', group: 'Reference',
    rationale: 'Exit qualification level, for mapping progression routes.',
    value: m => m.nsqfLevel, direction: 'desc',
    format: m => `NSQF Level ${m.nsqfLevel}`,
  },
];

const SORT_GROUPS = ['Career planning', 'Course quality', 'Seat planning', 'Reference'] as const;

const SORT_PUBLIC: Record<string, { hi: string; mr: string }> = {
  demand: { hi: 'जहाँ नौकरियाँ बढ़ रही हैं', mr: 'जिथे नोकऱ्या वाढत आहेत' },
  wage: { hi: 'सबसे ज़्यादा तनख्वाह', mr: 'सर्वाधिक पगार' },
  duration: { hi: 'सबसे कम समय', mr: 'सर्वात कमी वेळ' },
  vacancy: { hi: 'सबसे ज़्यादा खाली जगह', mr: 'सर्वाधिक रिकाम्या जागा' },
  practical: { hi: 'सबसे ज़्यादा काम करके सीखना', mr: 'सर्वाधिक प्रत्यक्ष काम' },
  stale: { hi: 'पुराना पढ़ाया जाने वाला काम', mr: 'जुने शिकवले जाणारे काम' },
  hours: { hi: 'सबसे ज़्यादा पढ़ाई के घंटे', mr: 'सर्वाधिक प्रशिक्षणाचे तास' },
  fill: { hi: 'सबसे ज़्यादा भरे हुए कोर्स', mr: 'सर्वाधिक भरलेले अभ्यासक्रम' },
  underfilled: { hi: 'सबसे कम भरे हुए कोर्स', mr: 'सर्वात कमी भरलेले अभ्यासक्रम' },
  nsqf: { hi: 'सबसे ऊँचा स्तर', mr: 'सर्वात उच्च स्तर' },
};

export function CourseCatalogue() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const sortName = (order: SortOrder) => language === 'en' ? order.label : SORT_PUBLIC[order.id][language];
  const sortMetric = (metrics: CourseMetrics) => {
    if (language === 'en') return sort.format(metrics);
    switch (sort.id) {
      case 'demand': return `${metrics.demandYoY >= 0 ? '+' : ''}${metrics.demandYoY}% ${tr('', 'नौकरी की माँग', 'नोकरीची मागणी')}`;
      case 'wage': return `${tr('', 'महीने में', 'महिन्याला')} ${formatCurrency(metrics.wageCeiling)}`;
      case 'duration': return `${metrics.durationMonths} ${tr('', 'महीने', 'महिने')}`;
      case 'vacancy': return `${metrics.seatsVacant} ${tr('', 'जगह खाली', 'जागा रिकाम्या')}`;
      case 'practical': return `${Math.round(metrics.practicalShare * 100)}% ${tr('', 'अभ्यास', 'सराव')}`;
      case 'stale': return `${metrics.staleModules} ${tr('', 'पुराने भाग', 'जुने भाग')}`;
      case 'hours': return `${formatNumber(metrics.totalHours)} ${tr('', 'घंटे', 'तास')}`;
      case 'fill': case 'underfilled': return `${Math.round(metrics.fillRate * 100)}% ${tr('', 'जगह भरीं', 'जागा भरल्या')}`;
      default: return `NSQF ${tr('', 'स्तर', 'स्तर')} ${metrics.nsqfLevel}`;
    }
  };
  const params = useSearchParams();
  const router = useRouter();

  const [districtId, setDistrictId] = useState('all');
  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('demand');

  // The URL is the source of truth for the open course and the type filter, so a
  // shared link (/courses?id=pune-ev-01) opens the right syllabus directly.
  const openId = params.get('id');
  const type = (params.get('type') as CourseType | null) ?? 'all';

  function setType(next: CourseType | 'all') {
    const q = new URLSearchParams(params.toString());
    if (next === 'all') q.delete('type'); else q.set('type', next);
    q.delete('id');
    router.push(`/courses${q.toString() ? `?${q}` : ''}`);
  }

  const sort = SORT_ORDERS.find(o => o.id === sortId) ?? SORT_ORDERS[0];

  /**
   * Filter, then measure, then sort. The metrics are computed once per course
   * rather than inside the comparator — the demand trend runs a regression over
   * a 24-month series and must not be recomputed on every comparison.
   */
  const filtered = useMemo(() => {
    const order = SORT_ORDERS.find(o => o.id === sortId) ?? SORT_ORDERS[0];
    const matches = courses.filter(c => {
      if (districtId !== 'all' && c.districtId !== districtId) return false;
      if (type !== 'all' && c.type !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        const skillNames = c.skillIds.map(s => getSkill(s)?.name.toLowerCase() ?? '').join(' ');
        if (!c.name.toLowerCase().includes(q) && !skillNames.includes(q)) return false;
      }
      return true;
    });

    const measured = matches.map(c => {
      const syl = getSyllabus(c.id);
      const practicalHours = syl.modules
        .filter(m => m.type === 'practical' || m.type === 'ojt')
        .reduce((a, m) => a + m.hours, 0);
      const primary = c.skillIds[0];

      const metrics: CourseMetrics = {
        demandYoY: primary ? computeDemandTrend(primary, c.districtId).yoyChangePercent : 0,
        wageCeiling: Math.max(0, ...c.skillIds.map(s => getSkill(s)?.salaryRange[1] ?? 0)),
        durationMonths: c.durationMonths,
        totalHours: syl.totalHours,
        practicalShare: syl.totalHours ? practicalHours / syl.totalHours : 0,
        seatsVacant: Math.max(0, c.currentSeats - c.enrolled),
        fillRate: c.currentSeats ? c.enrolled / c.currentSeats : 0,
        staleModules: syl.modules.filter(m => m.decayFlag).length,
        nsqfLevel: syl.nsqfLevel,
      };
      return { course: c, syllabus: syl, metrics };
    });

    return measured.sort((a, b) => {
      const delta = order.value(a.metrics) - order.value(b.metrics);
      // Ties fall back to course name so the order is stable and predictable.
      if (delta === 0) return a.course.name.localeCompare(b.course.name);
      return order.direction === 'asc' ? delta : -delta;
    });
  }, [districtId, type, query, sortId]);

  const open = openId ? courses.find(c => c.id === openId) : null;

  /* ---------------- Detail view ---------------- */
  if (open) {
    const syllabus = getSyllabus(open.id);
    const district = districts.find(d => d.id === open.districtId)!;
    const experiments = experimentsForCourse(open.id);
    const scheme = schemes.find(s => s.code === open.scheme);
    const practicalHours = syllabus.modules
      .filter(m => m.type === 'practical' || m.type === 'ojt')
      .reduce((a, m) => a + m.hours, 0);
    const decaying = syllabus.modules.filter(m => m.decayFlag);
    const primarySkill = open.skillIds[0];
    const trend = primarySkill ? computeDemandTrend(primarySkill, open.districtId) : null;

    return (
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <PageHeader
          eyebrow={`${open.type} · ${district.name} ${tr('District', 'ज़िला', 'जिल्हा')}`}
          title={open.name}
          description={
            <>
              {open.durationMonths} {tr('months', 'महीने', 'महिने')} · {syllabus.totalHours.toLocaleString('en-IN')} {tr('contact hours', 'प्रशिक्षण के घंटे', 'प्रशिक्षणाचे तास')} ·
              NSQF {tr('Level', 'स्तर', 'स्तर')} {syllabus.nsqfLevel} · {tr('syllabus', 'पाठ्यक्रम', 'अभ्यासक्रम')} {syllabus.version}
            </>
          }
          breadcrumb={[
            { label: tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ'), href: '/' },
            { label: tr('Course Catalogue', 'कोर्स', 'अभ्यासक्रम'), href: '/courses' },
            { label: open.name },
          ]}
          actions={
            <button onClick={() => router.push('/courses')}
              className="text-[13px] font-semibold px-4 py-2.5 border border-[var(--border-strong)] rounded-sm hover:bg-[var(--surface-alt)] focus-ring">
              {tr('← Back to catalogue', '← सभी कोर्स देखें', '← सर्व अभ्यासक्रम पहा')}
            </button>
          }
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <Stat label={tr('Duration', 'समय', 'कालावधी')} value={`${open.durationMonths} ${tr('mo', 'महीने', 'महिने')}`}
            sub={tr(`${syllabus.totalHours.toLocaleString('en-IN')} contact hours`, `${syllabus.totalHours.toLocaleString('en-IN')} प्रशिक्षण घंटे`, `${syllabus.totalHours.toLocaleString('en-IN')} प्रशिक्षण तास`)} accent="var(--gov-navy)" />
          <Stat label={tr('Hands-on share', 'काम करके सीखना', 'प्रत्यक्ष काम करून शिकणे')} value={`${Math.round((practicalHours / syllabus.totalHours) * 100)}%`}
            sub={tr(`${practicalHours.toLocaleString('en-IN')} hours on the bench`, `${practicalHours.toLocaleString('en-IN')} घंटे अभ्यास`, `${practicalHours.toLocaleString('en-IN')} तास सराव`)} tone="positive" accent="var(--gov-navy)" />
          <Stat label={tr('Seats', 'जगह', 'जागा')} value={`${open.enrolled}/${open.currentSeats}`}
            sub={tr(`${open.currentSeats - open.enrolled} vacant this intake`, `${open.currentSeats - open.enrolled} जगह खाली`, `${open.currentSeats - open.enrolled} जागा रिकाम्या`)}
            tone={open.enrolled >= open.currentSeats ? 'warn' : 'positive'} accent="var(--gov-navy)" />
          <Stat label={tr('Exit level', 'पूरा होने पर स्तर', 'पूर्ण झाल्यावर स्तर')} value={`NSQF L${syllabus.nsqfLevel}`}
            sub={`${syllabus.modules.length} ${tr('modules', 'भाग', 'भाग')}`} accent="var(--gov-navy)" />
          <Stat label={tr('Funded under', 'योजना', 'योजना')} value={open.scheme ?? tr('State', 'राज्य', 'राज्य')}
            sub={scheme?.ministry ?? 'Government of Maharashtra'} accent="var(--gov-navy)" />
        </div>

        {decaying.length > 0 && (
          <div className="mb-5">
            <Note tone="warn" title={tr('Part of this syllabus teaches work that is disappearing', 'इस कोर्स में कुछ ऐसे काम हैं जिनकी ज़रूरत घट रही है', 'या अभ्यासक्रमात काही कामांची गरज कमी होत आहे')}>
              {tr(`${decaying.map(m => m.code).join(', ')} teach tasks that are disappearing. Replacement content is under trial — results below.`, 'नीचे उन भागों की जानकारी है। इन्हें नए काम से बदलने की जाँच चल रही है।', 'खाली त्या भागांची माहिती आहे. त्याऐवजी नवीन काम शिकवण्याची चाचणी चालू आहे.')}
            </Note>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          <div className="space-y-5">
            <Card title={tr('Syllabus — module breakdown', 'कोर्स में क्या सीखेंगे', 'अभ्यासक्रमात काय शिकाल')}
              subtitle={hasDetailedSyllabus(open.id)
                ? tr('Published module plan with hours, tools and assessable outcomes', 'हर भाग के घंटे, औज़ार और सीखी जाने वाली बातें', 'प्रत्येक भागाचे तास, साधने आणि शिकायच्या गोष्टी')
                : tr('Indicative module plan derived from the notified duration and NSQF level', 'कोर्स की मुख्य जानकारी', 'अभ्यासक्रमाची मुख्य माहिती')}>
              <div className="space-y-2.5">
                {syllabus.modules.map(m => {
                  const dt = m.decayFlag ? dyingTasks.find(t => t.id === m.decayFlag) : null;
                  return (
                    <details key={m.code} className="border border-[var(--border)] rounded-sm group"
                      style={dt ? { boxShadow: 'inset 3px 0 0 var(--signal-declining)' } : undefined}>
                      <summary className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 cursor-pointer hover:bg-[var(--surface)] list-none">
                        <span className="mono text-[11px] font-bold text-[var(--gov-navy)] bg-[var(--accent-officer-light)] px-1.5 py-0.5 rounded-sm">
                          {m.code}
                        </span>
                        <span className="text-[13px] font-semibold text-[var(--ink)] flex-1 min-w-0">{m.title}</span>
                        <Badge variant={MODULE_TONE[m.type]}>{language === 'en' ? MODULE_TYPE_LABEL[m.type] : m.type === 'theory' ? tr('', 'पढ़ाई', 'शिकणे') : m.type === 'practical' ? tr('', 'अभ्यास', 'सराव') : m.type === 'ojt' ? tr('', 'काम पर सीखना', 'कामावर शिकणे') : tr('', 'सामान्य हुनर', 'इतर कौशल्ये')}</Badge>
                        <span className="mono text-[12px] font-bold text-[var(--ink-secondary)] w-14 text-right">{m.hours} {tr('h', 'घं.', 'ता.')}</span>
                        {dt && <Badge variant="declining" dot>{tr('stale', 'पुराना', 'जुने')}</Badge>}
                        <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--ink-tertiary)] group-open:rotate-180 transition-transform" fill="currentColor">
                          <path d="M1 4l5 5 5-5z" />
                        </svg>
                      </summary>
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[var(--border)] bg-[var(--surface)]">
                        <Progress value={m.hours} max={syllabus.totalHours}
                          color={dt ? 'var(--signal-declining)' : 'var(--gov-navy)'} height={5}
                          label={tr(`${Math.round((m.hours / syllabus.totalHours) * 100)}% of total course hours`, `कुल घंटों का ${Math.round((m.hours / syllabus.totalHours) * 100)}%`, `एकूण तासांपैकी ${Math.round((m.hours / syllabus.totalHours) * 100)}%`)} />
                        <div className="mt-3">
                          <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-tertiary)] mb-1">
                            {tr('Tools & equipment', 'औज़ार और मशीनें', 'साधने आणि यंत्रे')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.tools.map(t => (
                              <span key={t} className="text-[11px] bg-white border border-[var(--border)] px-2 py-0.5 rounded-sm text-[var(--ink-secondary)]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-tertiary)] mb-1">
                            {tr('Assessable outcomes', 'आप क्या सीखेंगे', 'तुम्ही काय शिकाल')}
                          </p>
                          <ul className="space-y-1">
                            {m.outcomes.map(o => (
                              <li key={o} className="flex gap-2 text-[12px] text-[var(--ink-secondary)]">
                                <span className="text-[var(--gov-navy)] font-bold">›</span>{o}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {dt && (
                          <div className="mt-3 pt-3 border-t border-[var(--border)]">
                            <p className="text-[11px] font-bold text-[var(--signal-declining)] uppercase tracking-wide mb-1">
                              Dying Task Watch — {dt.id}
                            </p>
                            <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed">
                              <strong>{dt.taskName}</strong> is down {Math.abs(dt.hoursChangeYoY)}% in work-hours
                              year on year, displaced by {dt.displacedBy}. {dt.recommendedAction}
                            </p>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </Card>

            {experiments.length > 0 && (
              <Card title={tr('Live syllabus experiments on this course', 'इस कोर्स में नए तरीके की जाँच', 'या अभ्यासक्रमात नवीन पद्धतीची चाचणी')}
                subtitle={tr('Decided by cohort outcomes', 'प्रशिक्षण के नतीजों के अनुसार', 'प्रशिक्षणाच्या निकालांनुसार')}>
                <div className="space-y-4">
                  {experiments.map(e => {
                    const sig = significanceLabel(e.pValue);
                    return (
                      <div key={e.id} className="border border-[var(--border)] rounded-sm p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <p className="mono text-[11px] text-[var(--ink-tertiary)]">{e.id}</p>
                          <Badge variant={
                            e.status === 'promoted' ? 'rising' : e.status === 'running' ? 'warn'
                            : e.status === 'rolled-back' ? 'declining' : 'officer'
                          } dot>{e.status.replace('-', ' ')}</Badge>
                        </div>
                        <p className="text-[12.5px] text-[var(--ink-secondary)] italic leading-relaxed mb-3">{e.hypothesis}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {[e.armA, e.armB].map((arm, i) => (
                            <div key={arm.label} className="border border-[var(--border)] rounded-sm p-3"
                              style={{ background: i === 1 ? 'var(--signal-rising-light)' : 'var(--surface)' }}>
                              <p className="text-[12px] font-bold">{arm.label}</p>
                              <p className="text-[11px] text-[var(--ink-secondary)] mt-1 leading-snug">{arm.changeSummary}</p>
                              <p className="text-[11.5px] mono mt-2">
                                {arm.trialPassRate}% gate · {arm.placementRate}% placed · {formatCurrency(arm.medianWage)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="text-[12px]">
                            Lift <strong className="mono text-[var(--signal-rising)]">+{e.liftPercent}%</strong>
                          </span>
                          <Badge variant={sig.tone}>{sig.label}</Badge>
                        </div>
                        {e.decision && (
                          <p className="text-[12px] text-[var(--ink-secondary)] mt-2 pt-2 border-t border-[var(--border)]">
                            <strong className="text-[var(--gov-navy)]">Decision: </strong>{e.decision}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card title={tr('Assessment pattern', 'जाँच कैसे होगी', 'तपासणी कशी होईल')}>
              <div className="space-y-3">
                {syllabus.assessmentPattern.map(a => (
                  <Progress key={a.component} value={a.weight} color="var(--gov-navy)"
                    label={a.component} showValue height={8} />
                ))}
              </div>
              <p className="text-[12px] text-[var(--ink-secondary)] mt-3 leading-relaxed">
                {tr('The practical component is scored from machine telemetry rather than an instructor’s tick-box, so the mark on the certificate is backed by an equipment log.', 'काम करके दिखाने के अंक मशीन के रिकॉर्ड से जाँचे जाते हैं।', 'काम करून दाखवण्याचे गुण यंत्राच्या नोंदीवरून तपासले जातात.')}
              </p>
            </Card>

            <Card title={tr('Skills taught', 'कौन सा काम सीखेंगे', 'कोणते काम शिकाल')}>
              <ul className="space-y-2">
                {open.skillIds.map(sid => {
                  const s = getSkill(sid);
                  if (!s) return null;
                  const t = computeDemandTrend(sid, open.districtId);
                  return (
                    <li key={sid} className="border border-[var(--border)] rounded-sm px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--ink)]">{s.name}</p>
                          <p className="text-[11px] text-[var(--ink-tertiary)]">
                            NSQF L{s.nsqfLevel} · {formatCurrency(s.salaryRange[0])}–{formatCurrency(s.salaryRange[1])}/mo
                          </p>
                        </div>
                        <Badge variant={t.direction === 'rising' ? 'rising' : t.direction === 'declining' ? 'declining' : 'stable'} dot>
                          {formatPercent(t.yoyChangePercent)}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {trend && trend.timeSeries.length > 0 && (
              <Card title={`${district.name} ${tr('demand', 'में नौकरियाँ', 'येथे नोकऱ्या')}`}
                subtitle={tr(`Verified monthly vacancies for ${getSkill(primarySkill)?.name}`, `${getSkill(primarySkill)?.name} के लिए हर महीने की नौकरियाँ`, `${getSkill(primarySkill)?.name} साठी दर महिन्याच्या नोकऱ्या`)}>
                <TrendArea data={trend.timeSeries} height={200} />
                <p className="text-[12px] text-[var(--ink-secondary)] mt-3">
                  {tr('Current demand', 'अभी की ज़रूरत', 'सध्याची गरज')} <strong className="mono">{formatNumber(trend.currentMonthlyDemand)}</strong>/{tr('month', 'महीना', 'महिना')},
                  {' '}{tr('moving', 'पिछले साल से बदलाव', 'मागील वर्षापेक्षा बदल')} <strong className="mono">{formatPercent(trend.yoyChangePercent)}</strong>.
                  {' '}{tr('Six-month forecast', 'अगले ६ महीने', 'पुढील ६ महिने')} <strong className="mono">{formatNumber(trend.forecast6m)}</strong>/{tr('month', 'महीना', 'महिना')}.
                </p>
              </Card>
            )}

            {scheme && (
              <Card title={`${tr('Funded under', 'योजना', 'योजना')} ${scheme.code}`} subtitle={scheme.ministry}>
                <p className="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed">{scheme.description}</p>
                <dl className="mt-3 space-y-2 text-[12px]">
                  <div><dt className="text-[var(--ink-tertiary)] font-semibold">{tr('Support', 'मदद', 'मदत')}</dt><dd>{scheme.funds}</dd></div>
                  <div><dt className="text-[var(--ink-tertiary)] font-semibold">{tr('Eligibility', 'कौन ले सकता है', 'कोण घेऊ शकते')}</dt><dd>{scheme.eligibility}</dd></div>
                </dl>
              </Card>
            )}

            <div className="gov-card p-4">
              <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed mb-3">
                Applications for this course are made through your candidate dashboard.
              </p>
              <Link href="/register?role=student"
                className="block text-center text-white font-bold text-[13.5px] py-2.5 rounded-sm focus-ring"
                style={{ background: 'var(--gov-navy)' }}>
                Register &amp; apply →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Listing ---------------- */
  const totalSeats = filtered.reduce((a, r) => a + r.course.currentSeats, 0);
  const totalHours = filtered.reduce((a, r) => a + r.syllabus.totalHours, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <PageHeader
        eyebrow={tr('Notified Courses', 'उपलब्ध कोर्स', 'उपलब्ध अभ्यासक्रम')}
        title={tr('Course Catalogue & Syllabus', 'कोर्स और क्या पढ़ाया जाता है', 'अभ्यासक्रम आणि काय शिकवले जाते')}
        description={tr('Every notified course, with its full syllabus published openly.', 'अपने ज़िले का कोर्स खोजें। काम सीखने में कितना समय लगेगा और कितनी जगह हैं, यहाँ देखें।', 'आपल्या जिल्ह्यातील अभ्यासक्रम शोधा. काम शिकायला किती वेळ लागतो आणि किती जागा आहेत ते येथे पहा.')}
        breadcrumb={[{ label: tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ'), href: '/' }, { label: tr('Course Catalogue', 'कोर्स', 'अभ्यासक्रम') }]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label={tr('Courses listed', 'दिख रहे कोर्स', 'दिसणारे अभ्यासक्रम')} value={filtered.length} sub={tr(`of ${courses.length} notified state-wide`, `राज्य में कुल ${courses.length}`, `राज्यात एकूण ${courses.length}`)} accent="var(--gov-navy)" />
        <Stat label={tr('Seats in this view', 'प्रशिक्षण की जगह', 'प्रशिक्षणाच्या जागा')} value={formatNumber(totalSeats)} sub={tr('Current intake', 'अभी के प्रवेश', 'सध्याचे प्रवेश')} accent="var(--gov-navy)" />
        <Stat label={tr('Contact hours published', 'प्रशिक्षण के घंटे', 'प्रशिक्षणाचे तास')} value={formatNumber(totalHours)} sub={tr('Module-level detail for every course', 'हर कोर्स की जानकारी', 'प्रत्येक अभ्यासक्रमाची माहिती')} accent="var(--gov-navy)" />
        <Stat label={tr('Districts covered', 'दिख रहे ज़िले', 'दिसणारे जिल्हे')} value={districts.length} sub={tr('Phase-I pilot', 'पहले चरण का डेमो', 'पहिल्या टप्प्याचा डेमो')} accent="var(--gov-navy)" />
      </div>

      <div className="gov-card p-4 mb-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="gov-label" htmlFor="q">{tr('Search course or skill', 'कोर्स या काम खोजें', 'अभ्यासक्रम किंवा काम शोधा')}</label>
          <input id="q" className="gov-input" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={tr('e.g. electrician, EV, welding, CAD', 'जैसे: इलेक्ट्रिशियन, वेल्डिंग', 'उदा. इलेक्ट्रिशियन, वेल्डिंग')} />
        </div>
        <div className="min-w-[180px]">
          <label className="gov-label" htmlFor="f-dist">{tr('District', 'ज़िला', 'जिल्हा')}</label>
          <select id="f-dist" className="gov-input" value={districtId} onChange={e => setDistrictId(e.target.value)}>
            <option value="all">{tr('All districts', 'सभी ज़िले', 'सर्व जिल्हे')}</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="min-w-[170px]">
          <label className="gov-label" htmlFor="f-type">{tr('Course type', 'कोर्स का प्रकार', 'अभ्यासक्रमाचा प्रकार')}</label>
          <select id="f-type" className="gov-input" value={type} onChange={e => setType(e.target.value as CourseType | 'all')}>
            <option value="all">{tr('All types', 'सभी प्रकार', 'सर्व प्रकार')}</option>
            <option value="ITI">ITI (NCVT/SCVT)</option>
            <option value="Polytechnic">{tr('Polytechnic diploma', 'पॉलिटेक्निक डिप्लोमा', 'पॉलिटेक्निक डिप्लोमा')}</option>
            <option value="PMKVY">{tr('PMKVY 4.0 short-term', 'पीएमकेवीवाई छोटा कोर्स', 'पीएमकेवीवाई लहान अभ्यासक्रम')}</option>
            <option value="Private">{tr('Private / other', 'निजी / अन्य', 'खाजगी / इतर')}</option>
          </select>
        </div>
        <div className="min-w-[270px]">
          <label className="gov-label" htmlFor="f-sort">{tr('Sort by', 'किस आधार पर दिखाएँ', 'कशानुसार दाखवा')}</label>
          <select id="f-sort" className="gov-input" value={sortId} onChange={e => setSortId(e.target.value)}>
            {SORT_GROUPS.map(g => (
              <optgroup key={g} label={g === 'Career planning' ? tr(g, 'काम की योजना', 'कामाची योजना') : g === 'Course quality' ? tr(g, 'कोर्स की गुणवत्ता', 'अभ्यासक्रमाची गुणवत्ता') : g === 'Seat planning' ? tr(g, 'प्रशिक्षण की जगह', 'प्रशिक्षणाच्या जागा') : tr(g, 'अन्य जानकारी', 'इतर माहिती')}>
                {SORT_ORDERS.filter(o => o.group === g).map(o => (
                  <option key={o.id} value={o.id}>{sortName(o)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 px-1">
        <p className="text-[12.5px] text-[var(--ink-secondary)]">
          <span className="font-semibold text-[var(--ink)]">{filtered.length}</span>{' '}
          {tr(`course${filtered.length === 1 ? '' : 's'}, sorted by`, 'कोर्स, इस आधार पर क्रम में:', 'अभ्यासक्रम, या क्रमाने:')}{' '}
          <span className="font-semibold text-[var(--gov-navy)]">{sortName(sort)}</span>.{' '}
          {language === 'en' && <span className="text-[var(--ink-tertiary)]">{sort.rationale}</span>}
        </p>
        {sortId !== 'demand' && (
          <button onClick={() => setSortId('demand')}
            className="shrink-0 text-[11.5px] gov-link font-semibold">
            {tr('Reset to default sort', 'पहले जैसा क्रम करें', 'मूळ क्रम लावा')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><p className="text-[13px] text-[var(--ink-tertiary)]">{tr('No courses match these filters.', 'इस खोज में कोई कोर्स नहीं मिला।', 'या शोधात कोणताही अभ्यासक्रम सापडला नाही.')}</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ course: c, syllabus: syl, metrics }, rank) => {
            const d = districts.find(x => x.id === c.districtId)!;
            const fill = Math.round(metrics.fillRate * 100);
            const stale = metrics.staleModules;
            const primary = c.skillIds[0];
            const trend = primary ? computeDemandTrend(primary, c.districtId) : null;
            return (
              <button key={c.id} onClick={() => router.push(`/courses?id=${c.id}`)}
                className="gov-card p-4 text-left hover:border-[var(--gov-navy)] hover:shadow-sm transition-all focus-ring flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h2 className="text-[14.5px] font-bold text-[var(--ink)] leading-snug">{c.name}</h2>
                    <p className="text-[11px] text-[var(--ink-tertiary)] mt-0.5">
                      {d.name} · <span className="mono">{c.id}</span>
                    </p>
                  </div>
                  <Badge variant={TYPE_TONE[c.type]}>{c.type}</Badge>
                </div>

                {/* The value this card was ranked on, so the ordering is legible. */}
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-dashed border-[var(--border)]">
                  <span className="w-5 h-5 shrink-0 grid place-items-center rounded-sm bg-[var(--gov-navy)] text-white text-[10px] font-bold mono">
                    {rank + 1}
                  </span>
                  <span className="text-[12px] font-bold text-[var(--gov-navy)] mono">
                    {sortMetric(metrics)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.skillIds.slice(0, 3).map(s => (
                    <span key={s} className="text-[10.5px] bg-[var(--surface-alt)] border border-[var(--border)] px-1.5 py-0.5 rounded-sm text-[var(--ink-secondary)]">
                      {getSkill(s)?.name}
                    </span>
                  ))}
                </div>

                <dl className="grid grid-cols-3 gap-2 text-center py-2.5 border-y border-[var(--border)] mb-3">
                  <div>
                    <dt className="text-[9.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">{tr('Duration', 'समय', 'कालावधी')}</dt>
                    <dd className="text-[13.5px] font-bold mono">{c.durationMonths} {tr('mo', 'महीने', 'महिने')}</dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">{tr('Hours', 'घंटे', 'तास')}</dt>
                    <dd className="text-[13.5px] font-bold mono">{formatNumber(syl.totalHours)}</dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">NSQF</dt>
                    <dd className="text-[13.5px] font-bold mono">L{syl.nsqfLevel}</dd>
                  </div>
                </dl>

                <Progress value={c.enrolled} max={c.currentSeats}
                  color={fill >= 95 ? 'var(--signal-declining)' : fill >= 70 ? 'var(--signal-warn)' : 'var(--signal-rising)'}
                  label={tr(`${c.enrolled} of ${c.currentSeats} seats filled`, `${c.currentSeats} में से ${c.enrolled} जगह भरीं`, `${c.currentSeats} पैकी ${c.enrolled} जागा भरल्या`)} height={6} />

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  {c.scheme && <Badge variant="default">{c.scheme}</Badge>}
                  <Badge variant="default">{syl.modules.length} {tr('modules', 'भाग', 'भाग')}</Badge>
                  {trend && (
                    <Badge variant={trend.direction === 'rising' ? 'rising' : trend.direction === 'declining' ? 'declining' : 'stable'} dot>
                      {formatPercent(trend.yoyChangePercent)} {tr('demand', 'नौकरी की ज़रूरत', 'कामाची गरज')}
                    </Badge>
                  )}
                  {stale > 0 && <Badge variant="declining" dot>{stale} {tr(`stale module${stale > 1 ? 's' : ''}`, 'पुराने भाग', 'जुने भाग')}</Badge>}
                </div>

                <span className="text-[12.5px] font-bold text-[var(--gov-navy)] mt-3">{tr('View full syllabus →', 'पूरा पाठ्यक्रम देखें →', 'संपूर्ण अभ्यासक्रम पहा →')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
