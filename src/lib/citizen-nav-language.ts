import { localize, type SiteLanguage } from '@/lib/site-language';

const NAV: Record<string, [string, string, string, string]> = {
  '/dashboard/student': ['मुख्य पृष्ठ', 'मुख्यपृष्ठ', 'आपका कोर्स और अगला काम', 'तुमचा अभ्यासक्रम आणि पुढील काम'],
  '/dashboard/student/onboarding': ['शुरू करें', 'सुरू करा', 'बोलकर अपनी जानकारी दें', 'बोलून आपली माहिती द्या'],
  '/dashboard/student/recommend': ['मेरे लिए कोर्स', 'माझ्यासाठी अभ्यासक्रम', 'आपके लिए चुने गए कोर्स', 'तुमच्यासाठी निवडलेले अभ्यासक्रम'],
  '/dashboard/student/cv': ['मेरी काम की जानकारी', 'माझ्या कामाची माहिती', 'अपना परिचय देखें', 'आपली माहिती पहा'],
  '/dashboard/student/demand': ['किस काम में नौकरी है', 'कोणत्या कामात नोकरी आहे', 'बढ़ते काम देखें', 'वाढणारी कामे पहा'],
  '/dashboard/student/jobs': ['मेरे पास की नौकरियाँ', 'माझ्याजवळच्या नोकऱ्या', 'अपने ज़िले की नौकरी देखें', 'आपल्या जिल्ह्यातील नोकऱ्या पहा'],
  '/dashboard/student/syllabus': ['मैं क्या सीख रहा हूँ', 'मी काय शिकत आहे', 'विषय, घंटे और अंक', 'विषय, तास आणि गुण'],
  '/dashboard/student/labs': ['मशीन पर अभ्यास', 'यंत्रावर सराव', 'अभ्यास का समय बुक करें', 'सरावाची वेळ नोंदवा'],
  '/dashboard/student/pathways': ['मेरे काम का प्रमाणपत्र', 'माझ्या कामाचे प्रमाणपत्र', 'जो काम आता है उसका प्रमाण', 'येत असलेल्या कामाचे प्रमाण'],
  '/dashboard/student/assist': ['बोलकर पूछें', 'बोलून विचारा', 'अपनी भाषा में सवाल पूछें', 'आपल्या भाषेत प्रश्न विचारा'],
  '/dashboard/business': ['मुख्य पृष्ठ', 'मुख्यपृष्ठ', 'भर्ती की जानकारी', 'भरतीची माहिती'],
  '/dashboard/business/onboarding': ['शुरू करें', 'सुरू करा', 'नौकरी की जानकारी दें', 'नोकरीची माहिती द्या'],
  '/dashboard/business/signals': ['नौकरी पोस्ट करें', 'नोकरी जाहीर करा', 'किस काम के लिए लोग चाहिए', 'कोणत्या कामासाठी माणसे हवी'],
  '/dashboard/business/hiring': ['मिलकर भर्ती करें', 'मिळून भरती करा', 'दूसरे उद्योगों के साथ', 'इतर उद्योगांबरोबर'],
  '/dashboard/business/syllabus': ['क्या सिखाना चाहिए', 'काय शिकवावे', 'पुराने विषयों को सुधारें', 'जुने विषय सुधारा'],
  '/dashboard/business/machines': ['मशीन किराये पर दें', 'यंत्रे भाड्याने द्या', 'खाली मशीनों से कमाएँ', 'रिकाम्या यंत्रांतून कमवा'],
  '/dashboard/business/rpl': ['कामगारों का प्रमाणपत्र', 'कामगारांचे प्रमाणपत्र', 'अनुभवी कामगारों के लिए', 'अनुभवी कामगारांसाठी'],
  '/dashboard/business/compliance': ['वेतन और मदद', 'पगार आणि मदत', 'वेतन की जानकारी दें', 'पगाराची माहिती द्या'],
};

export function citizenNavText(href: string, language: SiteLanguage, englishLabel: string, englishDescription = '') {
  const values = NAV[href];
  if (!values) return { label: englishLabel, description: englishDescription };
  return {
    label: localize(language, englishLabel, values[0], values[1]),
    description: localize(language, englishDescription, values[2], values[3]),
  };
}
