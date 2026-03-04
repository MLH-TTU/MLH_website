import { MonthHackathonData, MonthKey, OfficeHour, Prize, Resource, ColorTheme } from './types';

/**
 * MonthLeague class - Represents a single month's hackathon league
 * Uses Builder pattern for easy creation and modification
 */
export class MonthLeague {
  private data: MonthHackathonData;

  constructor(month: MonthKey) {
    // Initialize with defaults
    this.data = {
      month,
      theme: '',
      tagline: '',
      startDate: '',
      endDate: '',
      devpostUrl: 'https://devpost.com/',
      discordUrl: 'https://discord.com/',
      officeHours: [],
      tracks: [],
      prizes: [],
      resources: [],
      color: {
        primary: 'blue',
        secondary: 'cyan',
        gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      },
    };
  }

  setTheme(theme: string, tagline: string): this {
    this.data.theme = theme;
    this.data.tagline = tagline;
    return this;
  }

  setDates(startDate: string, endDate: string): this {
    this.data.startDate = startDate;
    this.data.endDate = endDate;
    return this;
  }

  setUrls(devpost: string, discord: string, kickoff?: string, submissionGuide?: string): this {
    this.data.devpostUrl = devpost;
    this.data.discordUrl = discord;
    if (kickoff) this.data.kickoffUrl = kickoff;
    if (submissionGuide) this.data.submissionGuideUrl = submissionGuide;
    return this;
  }

  addOfficeHour(day: string, time: string, host: string): this {
    this.data.officeHours.push({ day, time, host });
    return this;
  }

  setOfficeHours(hours: OfficeHour[]): this {
    this.data.officeHours = hours;
    return this;
  }

  addTrack(track: string): this {
    this.data.tracks.push(track);
    return this;
  }

  setTracks(tracks: string[]): this {
    this.data.tracks = tracks;
    return this;
  }

  addPrize(title: string, description: string, icon: string): this {
    this.data.prizes.push({ title, description, icon });
    return this;
  }

  setPrizes(prizes: Prize[]): this {
    this.data.prizes = prizes;
    return this;
  }

  addResource(label: string, url: string): this {
    this.data.resources.push({ label, url });
    return this;
  }

  setResources(resources: Resource[]): this {
    this.data.resources = resources;
    return this;
  }

  setColorTheme(primary: string, secondary: string, gradient: string): this {
    this.data.color = { primary, secondary, gradient };
    return this;
  }

  build(): MonthHackathonData {
    return { ...this.data };
  }

  getData(): MonthHackathonData {
    return this.data;
  }
}

/**
 * LeagueManager class - Manages all month leagues
 * Singleton pattern for centralized management
 */
export class LeagueManager {
  private static instance: LeagueManager;
  private leagues: Map<MonthKey, MonthLeague>;

  private constructor() {
    this.leagues = new Map();
  }

  static getInstance(): LeagueManager {
    if (!LeagueManager.instance) {
      LeagueManager.instance = new LeagueManager();
    }
    return LeagueManager.instance;
  }

  addLeague(league: MonthLeague): this {
    const data = league.getData();
    this.leagues.set(data.month, league);
    return this;
  }

  getLeague(month: MonthKey): MonthLeague | undefined {
    return this.leagues.get(month);
  }

  getLeagueData(month: MonthKey): MonthHackathonData | undefined {
    return this.leagues.get(month)?.getData();
  }

  getAllLeagues(): MonthHackathonData[] {
    return Array.from(this.leagues.values()).map(league => league.getData());
  }

  getAvailableMonths(): MonthKey[] {
    return Array.from(this.leagues.keys());
  }

  hasLeague(month: MonthKey): boolean {
    return this.leagues.has(month);
  }

  removeLeague(month: MonthKey): boolean {
    return this.leagues.delete(month);
  }

  clear(): void {
    this.leagues.clear();
  }
}
