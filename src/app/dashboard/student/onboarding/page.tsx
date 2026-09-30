'use client';

import { OnboardingAgent } from '@/components/onboarding/OnboardingAgent';
import { PageHeader } from '@/components/ui/PageHeader';
import { localize, useSiteLanguage } from '@/lib/site-language';

export default function StudentOnboardingPage() {
  const language = useSiteLanguage();
  return <><PageHeader eyebrow={localize(language, 'Your first steps', 'आपके पहले कदम', 'तुमची पहिली पावले')} title={localize(language, 'Get started with Pragati', 'प्रगति के साथ शुरू करें', 'प्रगतीबरोबर सुरुवात करा')} description={localize(language, 'Tell us about your work to make a simple profile.', 'अपने काम के बारे में बताएँ और सरल जानकारी बनाएँ।', 'आपल्या कामाबद्दल सांगा आणि सोपी माहिती तयार करा.')} breadcrumb={[{ label: localize(language, 'Dashboard', 'मेरा पेज', 'माझे पान'), href: '/dashboard/student' }, { label: localize(language, 'Get started', 'शुरू करें', 'सुरू करा') }]} /><OnboardingAgent role="student" /></>;
}
