export type User = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type Assessment = {
  id: string;
  title: string;
  status: string;
  category?: string;
  categoryId?: string;
  targetGroup?: string;
  responseCount?: number;
  publicToken?: string;
  publicUrl?: string;
  questions?: Question[];
};
export type Question = {
  id?: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  options: { id?: string; optionText: string; score: number }[];
};
export type Category = {
  id: string;
  name: string;
  description?: string | null;
  _count?: { assessments: number };
};
