'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, Stat } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { GapBars, TrendArea, DistrictLines, StackedBars, C } from '@/components/charts/Charts';
import { districts } from '@/data/districts';
import { skills, getSkill } from '@/data/skills';
import { computeGapForDistrict } from '@/data/compute/gapAnalysis';
import { computeDemandTrend } from '@/data/compute/demandTrend';
import { MONTHS } from '@/data/jobPostings';
import { filterImpact, dyingTasks, uncoveredSkills } from '@/data/signals';
import { allSeatCalculations, CONSTRAINT_LABEL } from '@/data/capacity';
import { SECTOR_LABELS, Sector, GapAnalysisResult } from '@/types';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils';
import { localize, useSiteLanguage } from '@/lib/site-language';

const SECTOR_COLOURS: Record<Sector, string> = {
  'auto-ev': C.navy, electrical: C.teal, textile: C.saffron,
  'retail-bpo': C.grey, construction: C.green,
};

export function PublicDemand() {
  const language = useSiteLanguage();
  const tr = (en: string, hi: string, mr: string) => localize(language, en, hi, mr);
  const params = useSearchParams();
  // Seeded from ?district= so a link from the homepage district cards lands correctly.
  const [districtId, setDistrictId] = useState(() => {
    const d = params.get('district');
    return d && districts.some(x => x.id === d) ? d : 'pune';
  });
  const [skillId, setSkillId] = useState('ev-battery-diagnostics');

  const district = districts.find(d => d.id === districtId)!;
  const gaps = computeGapForDistrict(districtId);
  const trend = computeDemandTrend(skillId, districtId);
  const calc = allSeatCalculations().find(c => c.districtId === districtId)!;
  const impact = filterImpact();

  const comparison = useMemo(() => MONTHS.map(month => {
    const row: Record<string, string | number> = { month };
    for (const d of districts) {
      row[d.id] = computeDemandTrend(skillId, d.id).timeSeries.find(s => s.month === month)?.postingsCount ?? 0;
    }
    return row;
  }), [skillId]);

  const sectorStack = useMemo(() => districts.map(d => {
    const g = computeGapForDistrict(d.id);
    const row: Record<string, string | number> = { name: d.name };
    for (const s of Object.keys(SECTOR_LABELS) as Sector[]) {
      row[s] = g.filter(x => x.sector === s && x.gap > 0).reduce((a, x) => a + x.gap, 0);
    }
    return row;
  }), []);

  const totalUnmet = gaps.filter(g => g.gap > 0).reduce((a, g) => a + g.gap, 0);
  const rising = gaps.filter(g => g.trend === 'rising').length;
  const declining = gaps.filter(g => g.trend === 'declining').length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <PageHeader
        eyebrow={tr('Open Data', 'खुली जानकारी', 'खुली माहिती')}
        title={tr('Labour Market Dashboard', 'नौकरी और काम की जानकारी', 'नोकरी आणि कामाची माहिती')}
        description={tr('Explore simulated hiring trends by district and trade.', 'अपने ज़िले में किस काम के लिए लोगों की ज़रूरत है, यहाँ देखें।', 'आपल्या जिल्ह्यात कोणत्या कामासाठी माणसे हवी आहेत ते येथे पहा.')}
        breadcrumb={[{ label: tr('Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ'), href: '/' }, { label: tr('Labour Market Data', 'काम की जानकारी', 'कामाची माहिती') }]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Stat label={tr('Claims screened', 'जाँची गई नौकरियाँ', 'तपासलेल्या नोकऱ्या')} value={formatNumber(impact.raw)}
          sub={tr('Raw vacancy claims received', 'मिली हुई नौकरी की सूचनाएँ', 'मिळालेल्या नोकरीच्या सूचना')} accent="var(--gov-navy)" />
        <Stat label={tr('Counted as demand', 'सही मानी गई नौकरियाँ', 'खऱ्या मानलेल्या नोकऱ्या')} value={formatNumber(impact.weighted)}
          sub={tr(`${impact.removedPercent}% removed as noise`, `${impact.removedPercent}% गलत या दोहराई गई सूचनाएँ हटाईं`, `${impact.removedPercent}% चुकीच्या किंवा पुन्हा आलेल्या सूचना काढल्या`)} tone="positive" accent="var(--gov-navy)" />
        <Stat label={tr('Unmet demand here', 'अभी खाली काम', 'अजून रिकामी कामे')} value={formatNumber(totalUnmet)}
          sub={tr(`across ${gaps.filter(g => g.gap > 0).length} trades in ${district.name}`, `${district.name} में ${gaps.filter(g => g.gap > 0).length} तरह के काम`, `${district.name} येथे ${gaps.filter(g => g.gap > 0).length} प्रकारची कामे`)}
          tone="warn" accent="var(--gov-navy)" />
        <Stat label={tr('Growing / contracting', 'बढ़ते / घटते काम', 'वाढती / कमी होत असलेली कामे')} value={`${rising} / ${declining}`}
          sub={tr('Trades by direction of travel', 'काम की माँग का रुझान', 'कामाच्या मागणीचा कल')} accent="var(--gov-navy)" />
        <Stat label={tr('Seat ceiling', 'प्रशिक्षण की सीमा', 'प्रशिक्षणाची मर्यादा')} value={formatNumber(calc.hardLimit)}
          sub={language === 'en' ? `bound by ${CONSTRAINT_LABEL[calc.bindingConstraint].toLowerCase()}` : tr('', 'उपलब्ध प्रशिक्षण क्षमता के अनुसार', 'उपलब्ध प्रशिक्षण क्षमतेनुसार')}
          tone="warn" accent="var(--gov-navy)" />
      </div>

      <div className="gov-card p-4 mb-5 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <label className="gov-label" htmlFor="pd-dist">{tr('District', 'ज़िला', 'जिल्हा')}</label>
          <select id="pd-dist" className="gov-input" value={districtId} onChange={e => setDistrictId(e.target.value)}>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="min-w-[240px]">
          <label className="gov-label" htmlFor="pd-skill">{tr('Trade', 'काम', 'काम')}</label>
          <select id="pd-skill" className="gov-input" value={skillId} onChange={e => setSkillId(e.target.value)}>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="pb-0.5 flex flex-wrap gap-2">
          <Badge variant={trend.direction === 'rising' ? 'rising' : trend.direction === 'declining' ? 'declining' : 'stable'} dot>
            {formatPercent(trend.yoyChangePercent)} {tr('year on year', 'पिछले साल से', 'मागील वर्षापेक्षा')}
          </Badge>
          <Badge variant="default">
            {formatCurrency(getSkill(skillId)!.salaryRange[0])}–{formatCurrency(getSkill(skillId)!.salaryRange[1])}/{tr('mo', 'महीना', 'महिना')}
          </Badge>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-5 mb-5">
        <Card title={`${getSkill(skillId)?.name} — ${district.name}`}
          subtitle={tr('Vacancies vs training supply', 'नौकरियाँ और प्रशिक्षण की जगह', 'नोकऱ्या आणि प्रशिक्षणाच्या जागा')}>
          <TrendArea data={trend.timeSeries}
            supplyLine={Math.round((gaps.find(g => g.skillId === skillId)?.currentSupply ?? 0) / 12)}
            height={270} />
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <div>
              <p className="text-[10.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">{tr('Current', 'अभी', 'सध्या')}</p>
              <p className="text-[19px] font-bold mono">{formatNumber(trend.currentMonthlyDemand)}<span className="text-[11px] font-normal text-[var(--ink-tertiary)]">/mo</span></p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">{tr('6-month forecast', 'अगले ६ महीने', 'पुढील ६ महिने')}</p>
              <p className="text-[19px] font-bold mono">{formatNumber(trend.forecast6m)}<span className="text-[11px] font-normal text-[var(--ink-tertiary)]">/mo</span></p>
            </div>
            <div>
              <p className="text-[10.5px] uppercase font-bold tracking-wide text-[var(--ink-tertiary)]">{tr('Trend slope', 'बदल की रफ्तार', 'बदलाचा वेग')}</p>
              <p className="text-[19px] font-bold mono">{trend.slope > 0 ? '+' : ''}{trend.slope.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card title={tr('Same trade across all six districts', 'यही काम सभी छह ज़िलों में', 'हेच काम सहा जिल्ह्यांत')}
          subtitle={tr('Where the work actually is', 'काम कहाँ है', 'काम कुठे आहे')}>
          <DistrictLines data={comparison}
            series={districts.map((d, i) => ({
              key: d.id, name: d.name,
              color: [C.navy, C.green, C.saffron, C.teal, C.red, C.grey][i % 6],
            }))}
            height={270} />
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-5 mb-5">
        <Card title={`${tr('Demand vs supply', 'नौकरी की ज़रूरत और प्रशिक्षित लोग', 'कामाची गरज आणि प्रशिक्षित लोक')} — ${district.name}`}
          subtitle={tr('Positive bars are unmet demand; negative bars are training surplus', 'ऊपर की पट्टी: ज़्यादा नौकरियाँ; नीचे की पट्टी: ज़्यादा प्रशिक्षण', 'वरचा पट्टा: जास्त नोकऱ्या; खालचा पट्टा: जास्त प्रशिक्षण')}>
          <GapBars data={gaps.slice(0, 14).map(g => ({ skillName: g.skillName, gap: g.gap, trend: g.trend }))}
            height={400} />
        </Card>

        <div className="space-y-5">
          <Card title={tr('Unmet demand by sector', 'काम के क्षेत्र के अनुसार ज़रूरत', 'कामाच्या क्षेत्रानुसार गरज')} subtitle={tr('Composition of the shortfall across districts', 'ज़िलों में कितने लोगों की कमी है', 'जिल्ह्यांत किती माणसांची कमतरता आहे')}>
            <StackedBars data={sectorStack}
              series={(Object.keys(SECTOR_LABELS) as Sector[]).map(s => ({
                key: s, name: SECTOR_LABELS[s], color: SECTOR_COLOURS[s],
              }))}
              height={280} />
          </Card>

          <Card title={tr('Skills with demand and no course', 'काम है, पर कोर्स नहीं', 'काम आहे, पण अभ्यासक्रम नाही')}
            subtitle={tr('In the onboarding queue', 'नए कोर्स की तैयारी', 'नवीन अभ्यासक्रमाची तयारी')}>
            <ul className="space-y-2">
              {uncoveredSkills.slice(0, 5).map(u => (
                <li key={u.id} className="flex items-start justify-between gap-3 border border-[var(--border)] rounded-sm px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[var(--ink)]">{u.skillName}</p>
                    <p className="text-[11px] text-[var(--ink-tertiary)]">
                      {districts.find(d => d.id === u.districtId)?.name} · {formatCurrency(u.medianWageOffered)}/mo ·{' '}
                      {u.evidenceSignalCount} {tr('corroborated signals', 'पुष्टि की गई सूचनाएँ', 'खात्री केलेल्या सूचना')}
                    </p>
                  </div>
                  <Badge variant={u.status === 'live' ? 'rising' : u.status === 'unaddressed' ? 'declining' : 'warn'} dot>
                    {u.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card title={`${tr('Full trade register', 'सभी कामों की सूची', 'सर्व कामांची यादी')} — ${district.name}`} subtitle={tr('Demand and trajectory', 'कहाँ ज़्यादा काम है', 'कुठे जास्त काम आहे')} dense>
          <Table
            columns={[
              { key: 'skill', header: tr('Trade', 'काम', 'काम'), render: (g: GapAnalysisResult) => (
                <div>
                  <p className="text-[12.5px] font-semibold">{g.skillName}</p>
                  <p className="text-[10.5px] text-[var(--ink-tertiary)]">{SECTOR_LABELS[g.sector]}</p>
                </div>
              ), sortValue: g => g.skillName },
              { key: 'demand', header: tr('Demand/yr', 'नौकरियाँ/साल', 'नोकऱ्या/वर्ष'), align: 'right',
                render: g => <span className="mono">{formatNumber(g.annualDemand)}</span>, sortValue: g => g.annualDemand },
              { key: 'supply', header: tr('Seats/yr', 'जगह/साल', 'जागा/वर्ष'), align: 'right', hideBelow: 'sm',
                render: g => <span className="mono">{formatNumber(g.currentSupply)}</span>, sortValue: g => g.currentSupply },
              { key: 'gap', header: tr('Gap', 'कमी', 'कमतरता'), align: 'right',
                render: g => (
                  <span className={`mono font-bold ${g.gap > 0 ? 'text-[var(--signal-warn)]' : 'text-[var(--signal-stable)]'}`}>
                    {g.gap > 0 ? formatNumber(g.gap) : `(${formatNumber(Math.abs(g.gap))})`}
                  </span>
                ), sortValue: g => g.gap },
              { key: 'trend', header: tr('Trend', 'रुझान', 'कल'),
                render: g => (
                  <Badge variant={g.trend === 'rising' ? 'rising' : g.trend === 'declining' ? 'declining' : 'stable'} dot>
                    {formatPercent(g.yoyChangePercent)}
                  </Badge>
                ), sortValue: g => g.yoyChangePercent },
            ]}
            rows={gaps}
            rowKey={g => g.skillId}
            onRowClick={g => setSkillId(g.skillId)}
            highlight={g => g.skillId === skillId ? 'var(--gov-navy)' : undefined}
          />
        </Card>

        <Card title={tr('Skills that are disappearing', 'कम होते काम', 'कमी होत असलेली कामे')} subtitle={tr('Decline tracked below the trade name', 'जिन कामों की माँग घट रही है', 'ज्या कामांची मागणी कमी होत आहे')}>
          <ul className="space-y-2.5">
            {dyingTasks.filter(t => t.affectedDistrictIds.includes(districtId)).map(t => (
              <li key={t.id} className="border border-[var(--border)] rounded-sm p-3"
                style={{ boxShadow: `inset 3px 0 0 ${t.severity === 'critical' ? 'var(--signal-declining)' : 'var(--signal-warn)'}` }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[12.5px] font-bold text-[var(--ink)] leading-snug">{t.taskName}</p>
                  <Badge variant={t.severity === 'critical' ? 'declining' : 'warn'}>{t.hoursChangeYoY}%</Badge>
                </div>
                <p className="text-[11.5px] text-[var(--ink-secondary)] leading-snug">
                  {tr('Displaced by', 'इससे बदला गया', 'याने बदलले')} {t.displacedBy}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/courses" className="text-[12.5px] gov-link font-semibold mt-3 inline-block">
            {tr('See which courses still teach these →', 'ये काम सिखाने वाले कोर्स देखें →', 'हे काम शिकवणारे अभ्यासक्रम पहा →')}
          </Link>
        </Card>
      </div>
    </div>
  );
}
