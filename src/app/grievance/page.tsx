import { OnboardingAgent } from '@/components/onboarding/OnboardingAgent';
import { SiteFooter } from '@/components/gov/SiteFooter';
import { SiteHeader } from '@/components/gov/SiteHeader';
import { GrievanceHeader } from '@/components/onboarding/GrievanceHeader';

export const metadata = { title: 'Start a Grievance Conversation' };

export default function GrievancePage() {
  return <><SiteHeader /><main id="main-content" className="flex-1 bg-[var(--surface)]"><div className="mx-auto max-w-3xl px-4 py-8"><GrievanceHeader /><OnboardingAgent role="student" topic="grievance" /></div></main><SiteFooter /></>;
}
