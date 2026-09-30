/** A fictional, internally consistent worker story for the hackathon walkthrough. */
export const demoCandidate = {
  name: 'Aarav Patil',
  districtId: 'pune',
  skillId: 'ev-battery-diagnostics',
  courseId: 'pune-ev-01',
  poolId: 'POOL-PN-EV-01',
  /** Five-point self-report estimates, not a test or employer assessment. */
  capabilities: [
    { label: 'Pack wiring & visual checks', hi: 'पैक वायरिंग और देखकर जाँच', mr: 'पॅक वायरिंग आणि पाहून तपासणी', current: 4, target: 4 },
    { label: 'Basic multimeter checks', hi: 'मल्टीमीटर से बुनियादी जाँच', mr: 'मल्टिमीटरने प्राथमिक तपासणी', current: 3, target: 4 },
    { label: 'High-voltage isolation', hi: 'उच्च वोल्टेज सुरक्षा', mr: 'उच्च दाबाची सुरक्षितता', current: 0, target: 4 },
    { label: 'BMS / CAN fault reading', hi: 'BMS / CAN खराबी पढ़ना', mr: 'BMS / CAN बिघाड वाचणे', current: 0, target: 4 },
  ],
} as const;
