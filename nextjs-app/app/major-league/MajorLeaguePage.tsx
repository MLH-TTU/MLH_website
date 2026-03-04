"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { getLeagueManager } from "@/lib/major-league";
import type { MonthKey, MonthHackathonData } from "@/lib/major-league";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function MajorLeaguePage() {
  const manager = useMemo(() => getLeagueManager(), []);
  const months = useMemo(() => manager.getAvailableMonths(), [manager]);
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(months[0]);

  const selected = useMemo(() => {
    return manager.getLeagueData(selectedMonth) ?? manager.getAllLeagues()[0];
  }, [selectedMonth, manager]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Animated background gradient */}
      <div className="pointer-events-none fixed inset-0 opacity-30">
        <div className={`absolute -top-40 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br ${selected.color.gradient} blur-[140px] animate-pulse`} />
        <div className="absolute top-1/2 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with back button */}
      <header className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-12 pb-20">
        <div className="text-center mb-12">
          {/* Huge Logo with special effects */}
          <div className="relative inline-flex items-center justify-center mb-8">
            {/* Glow effect behind logo */}
            <div className={`absolute inset-0 bg-gradient-to-r ${selected.color.gradient} opacity-20 blur-3xl rounded-full scale-150 animate-pulse`}></div>
            
            {/* Main logo container */}
            <div className="relative group">
              {/* Rotating ring effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${selected.color.gradient} rounded-3xl opacity-75 blur-md group-hover:blur-lg transition-all duration-500 animate-spin-slow`}></div>
              
              {/* Logo */}
              <div className="relative h-40 w-40 md:h-56 md:w-56 lg:h-64 lg:w-64 overflow-hidden rounded-3xl bg-white dark:bg-gray-800 ring-4 ring-white dark:ring-gray-700 shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                <Image
                  src="/mlh-major-league.png"
                  alt="Major League Hacking"
                  fill
                  className="object-contain p-6 md:p-8"
                  priority
                />
              </div>
              
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full blur-sm animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-400 rounded-full blur-sm animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            Major League <span className={`bg-gradient-to-r ${selected.color.gradient} bg-clip-text text-transparent`}>2026</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A 1-week hackathon sprint: <span className="font-bold text-gray-900 dark:text-white">5 days</span> to ideate, 
            <span className="font-bold text-gray-900 dark:text-white"> 2 days</span> to build & ship 🚀
          </p>

          {/* Month Selector - The Star of the Show */}
          <div className="inline-flex flex-col items-center gap-4 mb-12">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Select Your Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value as MonthKey)}
              className={cx(
                "text-2xl font-bold px-8 py-4 rounded-2xl",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                "ring-2 ring-gray-300 dark:ring-gray-600",
                "hover:ring-4 hover:ring-opacity-50",
                "focus:outline-none focus:ring-4 focus:ring-opacity-50",
                "shadow-2xl hover:shadow-3xl",
                "transition-all duration-300 cursor-pointer",
                "hover:scale-105 active:scale-95"
              )}
              style={{
                boxShadow: `0 20px 60px -15px rgba(0, 0, 0, 0.3)`,
              }}
            >
              {months.map((m) => (
                <option key={m} value={m} className="text-lg">
                  {m} 2026
                </option>
              ))}
            </select>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={selected.devpostUrl}
              target="_blank"
              rel="noreferrer"
              className={cx(
                "px-8 py-4 rounded-xl font-bold text-white text-lg",
                "bg-gradient-to-r shadow-xl hover:shadow-2xl",
                "transform hover:scale-105 active:scale-95 transition-all duration-200",
                selected.color.gradient
              )}
            >
              Submit to Devpost →
            </a>
            <a
              href={selected.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 rounded-xl font-bold text-gray-900 dark:text-white text-lg bg-white dark:bg-gray-800 ring-2 ring-gray-300 dark:ring-gray-600 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Join Discord
            </a>
          </div>
        </div>

        {/* Theme Card */}
        <div className={cx(
          "max-w-4xl mx-auto rounded-3xl p-8 md:p-12",
          "bg-gradient-to-br shadow-2xl",
          "transform hover:scale-[1.02] transition-all duration-300",
          selected.color.gradient
        )}>
          <div className="text-center text-white">
            <div className="text-sm font-bold uppercase tracking-wider mb-3 opacity-90">
              {selected.month} Theme
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              {selected.theme}
            </h2>
            <p className="text-xl md:text-2xl opacity-95 font-medium">
              {selected.tagline}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center text-lg font-semibold">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {formatDate(selected.startDate)} - {formatDate(selected.endDate)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Timeline & Tracks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Week Timeline */}
            <ContentCard title="📅 Week Timeline">
              <div className="space-y-3">
                {[
                  { day: "Day 1", title: "Kickoff + Team Up", phase: "ideation" },
                  { day: "Day 2", title: "Problem & User Research", phase: "ideation" },
                  { day: "Day 3", title: "Sketch & Plan MVP", phase: "ideation" },
                  { day: "Day 4", title: "Validate with Mentors", phase: "ideation" },
                  { day: "Day 5", title: "Prep to Build", phase: "ideation" },
                  { day: "Day 6", title: "Build Day 🔨", phase: "build" },
                  { day: "Day 7", title: "Polish + Submit 🚀", phase: "build" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]",
                      item.phase === "ideation"
                        ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800"
                        : "bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800"
                    )}
                  >
                    <div className={cx(
                      "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white",
                      item.phase === "ideation" ? "bg-blue-500" : "bg-red-500"
                    )}>
                      {item.day.split(" ")[1]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.day}</div>
                    </div>
                    <span className={cx(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      item.phase === "ideation"
                        ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200"
                        : "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
                    )}>
                      {item.phase === "ideation" ? "Ideation" : "Build"}
                    </span>
                  </div>
                ))}
              </div>
            </ContentCard>

            {/* Tracks */}
            <ContentCard title="🎯 Tracks">
              <div className="flex flex-wrap gap-3">
                {selected.tracks.map((track, idx) => (
                  <span
                    key={idx}
                    className={cx(
                      "px-5 py-3 rounded-full font-bold text-white",
                      "bg-gradient-to-r shadow-lg hover:shadow-xl",
                      "transform hover:scale-105 transition-all duration-200 cursor-default",
                      selected.color.gradient
                    )}
                  >
                    {track}
                  </span>
                ))}
              </div>
            </ContentCard>

            {/* Resources */}
            <ContentCard title="📚 Resources">
              <div className="grid sm:grid-cols-2 gap-3">
                {selected.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:shadow-lg transition-all duration-200 group"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {resource.label}
                    </span>
                  </a>
                ))}
              </div>
            </ContentCard>
          </div>

          {/* Right Column - Prizes & Office Hours */}
          <div className="space-y-8">
            {/* Prizes */}
            <ContentCard title="🏆 Prizes">
              <div className="space-y-4">
                {selected.prizes.map((prize, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 ring-1 ring-yellow-200 dark:ring-yellow-800 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{prize.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {prize.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {prize.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>

            {/* Office Hours */}
            <ContentCard title="⏰ Office Hours">
              <div className="space-y-3">
                {selected.officeHours.map((hour, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-200 dark:ring-purple-800"
                  >
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {hour.day} • {hour.time}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      with {hour.host}
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>

            {/* Submission Checklist */}
            <ContentCard title="✅ Submission Checklist">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Clear project title + description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Demo video (60-90 seconds)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Repo link + setup instructions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>What you built + what's next</span>
                </li>
              </ul>
            </ContentCard>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Major League Hacking • MLH TTU Chapter</p>
          <p className="mt-2">Built for fast shipping, like a hackathon should be 🚀</p>
        </div>
      </footer>
    </div>
  );
}

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-2xl transition-all duration-300">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
        {title}
      </h2>
      {children}
    </div>
  );
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return dateStr;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[m - 1]} ${d}`;
}
