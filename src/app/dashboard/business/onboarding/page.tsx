'use client';

import { OnboardingAgent } from '@/components/onboarding/OnboardingAgent';
import { PageHeader } from '@/components/ui/PageHeader';
import { localize, useSiteLanguage } from '@/lib/site-language';

export default function BusinessOnboardingPage() {
  const language = useSiteLanguage();
  return <><PageHeader eyebrow={localize(language, 'Your first steps', 'आपके पहले कदम', 'तुमची पहिली पावले')} title={localize(language, 'Tell us about the job', 'नौकरी के बारे में बताएँ', 'नोकरीबद्दल सांगा')} description={localize(language, 'Answer a few simple questions to make a demo job brief.', 'कुछ आसान सवालों से डेमो नौकरी की जानकारी बनाएँ।', 'काही सोप्या प्रश्नांनी डेमो नोकरीची माहिती तयार करा.')} breadcrumb={[{ label: localize(language, 'Dashboard', 'मेरा पेज', 'माझे पान'), href: '/dashboard/business' }, { label: localize(language, 'Get started', 'शुरू करें', 'सुरू करा') }]} /><OnboardingAgent role="business" /></>;
}
