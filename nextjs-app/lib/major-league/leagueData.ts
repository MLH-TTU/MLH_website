import { MonthLeague, LeagueManager } from './MonthLeague';

/**
 * Initialize all league data
 * This is where you add/edit month leagues
 */
export function initializeLeagues(): LeagueManager {
  const manager = LeagueManager.getInstance();
  manager.clear(); // Clear any existing data

  // January League
  const january = new MonthLeague('January')
    .setTheme('New Year, New Stack', 'Build something that helps people start fresh in 2026')
    .setDates('2026-01-05', '2026-01-11')
    .setUrls(
      'https://devpost.com/',
      'https://discord.com/',
      'https://www.youtube.com/',
      'https://devpost.com/'
    )
    .setOfficeHours([
      { day: 'Tuesday', time: '6:00 PM CT', host: 'Mentor Crew' },
      { day: 'Thursday', time: '6:00 PM CT', host: 'Alumni Builders' },
    ])
    .setTracks(['Beginner Friendly', 'AI Helper Tools', 'Campus Life', 'Productivity'])
    .setPrizes([
      { title: 'Best Overall', description: 'Most complete + useful project with a clear demo', icon: '🏆' },
      { title: 'Best Rookie Build', description: 'First-time hackers bringing the heat', icon: '🌟' },
      { title: 'Best Design', description: 'Clean UI, great UX, and strong storytelling', icon: '🎨' },
    ])
    .setResources([
      { label: 'Next.js Docs', url: 'https://nextjs.org/docs' },
      { label: 'GitHub Student Pack', url: 'https://education.github.com/pack' },
      { label: 'Tailwind Docs', url: 'https://tailwindcss.com/docs' },
    ])
    .setColorTheme('blue', 'cyan', 'from-blue-500 via-cyan-500 to-blue-600');

  // February League
  const february = new MonthLeague('February')
    .setTheme('Love Letters to Lubbock', "Build for community + connection this Valentine's season")
    .setDates('2026-02-02', '2026-02-08')
    .setUrls(
      'https://devpost.com/',
      'https://discord.com/',
      'https://www.youtube.com/',
      'https://devpost.com/'
    )
    .setOfficeHours([
      { day: 'Monday', time: '7:00 PM CT', host: 'Community Leads' },
      { day: 'Wednesday', time: '7:00 PM CT', host: 'Mentor Crew' },
    ])
    .setTracks(['Social Impact', 'Events & Clubs', 'Mental Wellness', 'Maps & Local'])
    .setPrizes([
      { title: 'Most Heartfelt', description: 'Build that genuinely improves lives', icon: '❤️' },
      { title: 'Best Technical Execution', description: 'Solid engineering + robustness', icon: '⚡' },
      { title: 'Community Choice', description: 'Voted by the TTU community', icon: '🎯' },
    ])
    .setResources([
      { label: 'Devpost Tips', url: 'https://devpost.com/' },
      { label: 'Figma', url: 'https://www.figma.com/' },
      { label: 'Supabase', url: 'https://supabase.com/' },
    ])
    .setColorTheme('pink', 'rose', 'from-pink-500 via-rose-500 to-red-500');

  // March League
  const march = new MonthLeague('March')
    .setTheme('Spring Sprint', 'Ship a prototype in 7 days with a crisp demo')
    .setDates('2026-03-02', '2026-03-08')
    .setUrls(
      'https://devpost.com/',
      'https://discord.com/',
      'https://www.youtube.com/',
      'https://devpost.com/'
    )
    .setOfficeHours([
      { day: 'Tuesday', time: '5:30 PM CT', host: 'Builder Support' },
      { day: 'Friday', time: '5:30 PM CT', host: 'Demo Doctors' },
    ])
    .setTracks(['Web Apps', 'Mobile', 'Data Viz', 'APIs'])
    .setPrizes([
      { title: 'Best Demo', description: 'Clear story, smooth flow, strong wow factor', icon: '🎬' },
      { title: 'Best Use of APIs', description: 'Smart integrations that add real value', icon: '🔌' },
      { title: 'Speed Demon', description: 'Fastest working prototype', icon: '⚡' },
    ])
    .setResources([
      { label: 'Vercel Deploy', url: 'https://vercel.com/docs' },
      { label: 'Cloudflare', url: 'https://developers.cloudflare.com/' },
      { label: 'Open Source Licenses', url: 'https://choosealicense.com/' },
    ])
    .setColorTheme('green', 'emerald', 'from-green-500 via-emerald-500 to-teal-500');

  // Add all leagues to manager
  manager.addLeague(january).addLeague(february).addLeague(march);

  return manager;
}

/**
 * Get the league manager instance with initialized data
 */
export function getLeagueManager(): LeagueManager {
  const manager = LeagueManager.getInstance();
  
  // Initialize if empty
  if (manager.getAllLeagues().length === 0) {
    initializeLeagues();
  }
  
  return manager;
}
