'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { localize, useSiteLanguage } from '@/lib/site-language';

export function GrievanceHeader() {
  const language = useSiteLanguage();
  return <PageHeader
    eyebrow={localize(language, 'Support', 'मदद', 'मदत')}
    title={localize(language, 'Tell us your problem', 'अपनी परेशानी बताएँ', 'तुमची अडचण सांगा')}
    description={localize(language, 'Speak or type. We will help you make a note and find the next step.', 'बोलें या लिखें। हम आपकी बात लिखने और अगला कदम समझने में मदद करेंगे।', 'बोला किंवा लिहा. तुमची अडचण नोंदवायला आणि पुढचा मार्ग शोधायला आम्ही मदत करू.')}
    breadcrumb={[
      { label: localize(language, 'Home', 'मुख्य पृष्ठ', 'मुख्यपृष्ठ'), href: '/' },
      { label: localize(language, 'Help', 'मदद', 'मदत'), href: '/help' },
      { label: localize(language, 'Conversation', 'बातचीत', 'संवाद') },
    ]}
  />;
}
