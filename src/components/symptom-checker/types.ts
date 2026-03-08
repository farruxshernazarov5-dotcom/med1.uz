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
  nonMatchingSymptoms?: string[];
  riskLevel: "high" | "medium" | "low";
  specialist: string;
  icd10Code?: string;
  icd11Code?: string;
  snomedCode?: string;
  differentialNotes?: string;
  suggestedTests?: string[];
  clinicalEvidence?: string;
}

export interface DifferentialDiagnosis {
  primarySuspect: string;
  ruledOut: string[];
  needsMoreInfo: string[];
  clinicalReasoning: string;
}

export interface SuggestedLabTest {
  testName: string;
  purpose: string;
  urgency: "urgent" | "routine";
}

export interface SuggestedImaging {
  type: string;
  bodyPart: string;
  purpose: string;
}

export interface MedicalReference {
  source: string;
  title: string;
  relevance: string;
}

export interface SymptomAnalysis {
  diseases: DiseaseResult[];
  riskLevel: "high" | "medium" | "low";
  recommendations: string[];
  urgentAction: boolean;
  followUpQuestions: string[];
  differentialDiagnosis?: DifferentialDiagnosis;
  suggestedLabTests?: SuggestedLabTest[];
  suggestedImaging?: SuggestedImaging[];
  medicalReferences?: MedicalReference[];
}

// Medical knowledge API types
export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubDate: string;
  url: string;
}

export interface MedlinePlusResult {
  url: string;
  title: string;
  source: string;
}

export interface MedicalKnowledgeResult {
  pubmedArticles: PubMedArticle[];
  medlinePlusResults: MedlinePlusResult[];
  icdReferences: { code: string; url: string; source: string }[];
  totalResults: number;
}
