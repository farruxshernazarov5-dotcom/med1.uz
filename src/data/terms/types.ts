export type MedicalTerm = {
  id: string;
  term: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  origin?: string;
  treatment?: string;
  prevention?: string;
  recommendations?: string;
  source: string;
  image?: string;
};
