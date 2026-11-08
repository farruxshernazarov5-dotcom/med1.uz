export const HEALTH_FIELDS = ['systolic','diastolic','heart_rate','spo2','glucose','weight_kg','height_cm','temperature'] as const;
export function latestMetric(logs: Record<string, any>[], key: string) {
  return [...logs].reverse().find(log => log[key] != null);
}
export function healthInputError(form: Record<string,string>): string | null {
  const provided=HEALTH_FIELDS.filter(key=>form[key]?.trim());
  if(!provided.length) return 'Kamida bitta ko‘rsatkich kiriting';
  for(const key of provided) {
    const value=Number(form[key]);
    if(!Number.isFinite(value)||value<=0) return 'Ko‘rsatkich musbat son bo‘lishi kerak';
    if(key==='spo2'&&value>100) return 'SpO₂ 100% dan oshmasin';
  }
  return null;
}