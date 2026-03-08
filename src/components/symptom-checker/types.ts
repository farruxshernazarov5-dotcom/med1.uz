export interface PatientInfo {
  symptoms: string[];
  age: string;
  gender: string;
  duration: string;
  painLevel: number;
  existingConditions: string;
  allergies: string;
}

export interface DiseaseResult {
  name: string;
  probability: number;
  description: string;
  matchingSymptoms: string[];
  riskLevel: "high" | "medium" | "low";
  specialist: string;
}

export interface SymptomAnalysis {
  diseases: DiseaseResult[];
  riskLevel: "high" | "medium" | "low";
  recommendations: string[];
  urgentAction: boolean;
  followUpQuestions: string[];
}
