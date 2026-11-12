export function babyAge(birth: string, now = new Date()) {
  const date = new Date(`${birth}T00:00:00`);
  if (!Number.isFinite(date.getTime()) || date > now) return null;
  let months = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
  if (now.getDate() < date.getDate()) months--;
  return { months: Math.max(0, months), days: Math.floor((now.getTime() - date.getTime()) / 86400000) };
}

export function childUrgency(ageDays: number | undefined, temperature: string, danger: boolean) {
  if (danger) return "emergency";
  const value = Number(temperature);
  if (temperature.trim() && Number.isFinite(value) && value >= 38) {
    return ageDays === undefined || ageDays < 90 ? "urgent" : "doctor";
  }
  return "none";
}

export function childQuestions(months: number | undefined) {
  if (months === undefined) return ["Bolaning yoshiga mos parvarish rejasini tuzing", "Qaysi belgilar pediatr ko‘rigini talab qiladi?"];
  if (months < 6) return ["Emizish va xavfsiz uyqu bo‘yicha yoshiga mos tavsiya bering", "Bola yig‘laganda nimalarga e’tibor berish kerak?"];
  if (months < 12) return ["Qo‘shimcha ovqatni xavfsiz kiritish rejasini tuzing", "Yoshiga mos o‘yin va rivojlanish mashqlarini tavsiya qiling"];
  return ["Yoshiga mos nutq va o‘yin mashg‘ulotlarini tavsiya qiling", "Ovqatlanish va uyqu tartibi bo‘yicha maslahat bering"];
}