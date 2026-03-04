export type MonthKey =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

export interface OfficeHour {
  day: string;
  time: string;
  host: string;
}

export interface Prize {
  title: string;
  description: string;
  icon: string;
}

export interface Resource {
  label: string;
  url: string;
}

export interface ColorTheme {
  primary: string;
  secondary: string;
  gradient: string;
}

export interface MonthHackathonData {
  month: MonthKey;
  theme: string;
  tagline: string;
  startDate: string;
  endDate: string;
  devpostUrl: string;
  discordUrl: string;
  kickoffUrl?: string;
  submissionGuideUrl?: string;
  officeHours: OfficeHour[];
  tracks: string[];
  prizes: Prize[];
  resources: Resource[];
  color: ColorTheme;
}
