export const APP_RELEASE = {
  version: '2026.11.12',
  items: [
    { title: 'Bola AI', text: 'Yoshga mos savollar, bola holati va xavf belgilariga e’tibor.', path: '/ai-baby-care' },
    { title: 'Eslatmalar', text: 'Vaqtlar, turlar va 10 daqiqadan keyin qayta eslatish.', path: '/mobile-profile?section=notifications' },
    { title: 'Med Reels', text: 'Shifokor va mutaxassislarning foto-video materiallari.', path: '/reels' },
    { title: 'Oila salomatligi', text: 'Har bir oila a’zosi uchun alohida ko‘rsatkich va tarix.', path: '/mobile-profile?section=family&detail=tracking' },
    { title: 'Foto skaneri', text: 'Kameradan qaytganda tanlangan surat saqlanadi.', path: '/ai-farmatsevt' },
    { title: 'Gapiradigan xabarlar', text: 'Yangi xabar va o‘tkazma uchun MED ALL ovozi.', path: '/mobile-profile?section=notifications' },
  ],
};
export const isUnseenRelease = (seen: string | null) => seen !== APP_RELEASE.version;