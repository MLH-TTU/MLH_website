import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('LandingPage: Rendering, user:', user?.email || 'not authenticated');

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-3'
      }`}>
        <div className={`mx-auto transition-all duration-300 ${
          isScrolled 
            ? 'max-w-4xl' 
            : 'max-w-7xl'
        }`}>
          <div 
            className={`transition-all duration-300 ${
              isScrolled
                ? 'mx-auto w-fit rounded-full px-8 py-3'
                : 'px-8 py-4 rounded-none'
            }`}
            style={isScrolled ? {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            } : {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className={`flex items-center justify-between ${
              isScrolled ? 'min-w-[900px]' : ''
            }`}>
              {/* Left side - Logo/Brand */}
              <div className="flex items-center space-x-3">
                <img 
                  src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                  alt="MLH Logo" 
                  className={`w-auto transition-all duration-300 ${
                    isScrolled ? 'h-6' : 'h-7'
                  }`}
                />
                {/* Vertical separator line */}
                <div className={`w-px bg-gray-400 transition-all duration-300 ${
                  isScrolled ? 'h-7' : 'h-8'
                }`}></div>
                {/* TTU Logo */}
                <img 
                  src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                  alt="TTU Logo" 
                  className={`w-auto transition-all duration-300 ${
                    isScrolled ? 'h-6' : 'h-7'
                  }`}
                />
              </div>
              
              {/* Right side - Navigation */}
              <div className="flex items-center space-x-6">
                <a href="#about" className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isScrolled ? 'text-sm' : 'text-base'
                }`}>
                  About
                </a>
                <a href="#events" className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isScrolled ? 'text-sm' : 'text-base'
                }`}>
                  Events
                </a>
                <a href="/team" className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  isScrolled ? 'text-sm' : 'text-base'
                }`}>
                  Team
                </a>
                
                {/* Auth buttons */}
                <div className="flex items-center space-x-3">
                  {user ? (
                    <>
                      <span className={`text-gray-600 ${
                        isScrolled ? 'text-sm' : 'text-base'
                      }`}>
                        Welcome, {user.firstName || user.email}
                      </span>
                      <button 
                        onClick={() => navigate(user.hasCompletedOnboarding ? '/profile' : '/onboarding')}
                        className={`bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 ${
                          isScrolled ? 'px-4 py-1.5 text-sm' : 'px-5 py-2 text-base'
                        }`}
                      >
                        {user.hasCompletedOnboarding ? 'Profile' : 'Complete Setup'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => navigate('/login')}
                        className={`text-gray-600 hover:text-gray-900 transition-colors ${
                          isScrolled ? 'text-sm' : 'text-base'
                        }`}
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => navigate('/login')}
                        className={`bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 ${
                          isScrolled ? 'px-4 py-1.5 text-sm' : 'px-5 py-2 text-base'
                        }`}
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
                
                <button className={`bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all duration-300 ${
                  isScrolled ? 'px-5 py-2 text-sm' : 'px-6 py-2.5 text-base'
                }`}>
                  Join Discord
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated MLH Logo */}
          <div className="mb-12 flex justify-center">
            <div className="animate-pulse-scale">
              <img 
                src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                alt="MLH Logo" 
                className="h-16 w-auto"
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight">
            Build. Hack. Learn<br />
            <span className="text-gray-900">at Texas Tech.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            The official Major League Hacking chapter at TTU. A community for developers, 
            designers, and creators of all skill levels.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://ttu.campuslabs.com/engage/organization/majorleaguehacking"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors min-w-[200px] text-center"
            >
              Become a Member
            </a>
            <a 
              href="#events"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-full text-lg font-medium border border-gray-300 transition-colors min-w-[200px] text-center"
            >
              See Upcoming Events
            </a>
          </div>
        </div>
      </main>

      {/* Who Are We Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Image */}
            <div className="relative">
              {/* Creative MLH Trust Badge decorations */}
              {/* Top right badge - rotated */}
              <div className="absolute -top-8 -right-6 transform rotate-12 opacity-90 z-20">
                <a href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=white" target="_blank">
                  <img 
                    src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-white.svg" 
                    alt="Major League Hacking 2026 Hackathon Season" 
                    className="w-16 h-auto hover:scale-110 transition-transform duration-300"
                  />
                </a>
              </div>

              {/* Bottom left badge - smaller and tilted */}
              <div className="absolute -bottom-4 -left-4 transform -rotate-6 opacity-80 z-20">
                <a href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=white" target="_blank">
                  <img 
                    src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-white.svg" 
                    alt="Major League Hacking 2026 Hackathon Season" 
                    className="w-12 h-auto hover:scale-110 transition-transform duration-300"
                  />
                </a>
              </div>

              {/* Floating badge - top left, subtle */}
              <div className="absolute -top-6 -left-8 transform rotate-45 opacity-60 z-10">
                <img 
                  src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-white.svg" 
                  alt="MLH Badge Decoration" 
                  className="w-10 h-auto"
                />
              </div>

              {/* Main image with enhanced styling */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50">
                <img 
                  src="/team-photo.JPG" 
                  alt="MLH TTU Chapter Team" 
                  className="w-full h-auto object-cover"
                />
                {/* Subtle overlay with MLH branding hint */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5"></div>
              </div>

              {/* Corner accent badge - bottom right */}
              <div className="absolute -bottom-2 -right-2 transform rotate-3 opacity-70 z-20">
                <img 
                  src="https://s3.amazonaws.com/logged-assets/trust-badge/2026/mlh-trust-badge-2026-white.svg" 
                  alt="MLH Badge Decoration" 
                  className="w-8 h-auto"
                />
              </div>
            </div>

            {/* Right side - Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  Who are we
                </h2>
                <div className="w-16 h-1 bg-green-400 mb-8"></div>
              </div>

              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  At the MLH TTU Chapter, we're a vibrant community of Texas Tech students passionate about 
                  technology, innovation, and collaborative learning. We bring together developers, designers, 
                  entrepreneurs, and tech enthusiasts from all backgrounds and skill levels.
                </p>
                
                <p>
                  Through our partnership with Major League Hacking, we provide hands-on hackathons, 
                  technical workshops, networking events, and mentorship opportunities that bridge the gap 
                  between classroom theory and real-world application.
                </p>
                
                <p>
                  Whether you're a complete beginner curious about coding or an experienced developer looking 
                  to expand your skills, our chapter offers a supportive environment where you can learn, 
                  build, and connect with like-minded peers who share your passion for technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section id="events" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Upcoming Events
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join us for exciting hackathons, workshops, and networking events throughout the semester
            </p>
          </div>

          {/* Calendar-Style Events Display */}
          <div className="max-w-4xl mx-auto">
            {/* No Events State */}
            <div className="text-center py-16">
              {/* Calendar Icon */}
              <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>

              {/* Message */}
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Stay Tuned for Upcoming Events!
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                We're planning some amazing hackathons, workshops, and tech talks for this semester. 
                Follow us on social media or join our Discord to be the first to know when events are announced.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors min-w-[200px]">
                  Join Discord
                </button>
                <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-full text-lg font-medium border-2 border-gray-300 transition-colors min-w-[200px]">
                  Follow Updates
                </button>
              </div>
            </div>

            {/* Future: When events exist, this would be replaced with actual event cards */}
            {/* 
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              Event cards would go here with calendar-style design
            </div>
            */}
          </div>

          {/* Event Types Preview */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Hackathons</h4>
              <p className="text-gray-600">24-48 hour coding competitions where you build amazing projects</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Workshops</h4>
              <p className="text-gray-600">Hands-on learning sessions covering the latest technologies</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V11h2.5c.83 0 1.5.67 1.5 1.5V18h2v-5.5c0-1.1-.9-2-2-2H13v-.5c0-1.1-.9-2-2-2H9.5C8.67 8 8 8.67 8 9.5V18H4z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Networking</h4>
              <p className="text-gray-600">Connect with industry professionals and fellow students</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-8">
          {/* Top section with logos and social icons */}
          <div className="flex items-center justify-between mb-8">
            {/* Left side - Logo/Brand */}
            <div className="flex items-center space-x-3">
              <img 
                src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                alt="MLH Logo" 
                className="h-8 w-auto"
              />
              {/* Vertical separator line */}
              <div className="h-10 w-px bg-gray-400"></div>
              {/* TTU Logo */}
              <img 
                src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                alt="TTU Logo" 
                className="h-8 w-auto"
              />
            </div>

            {/* Right side - Social Media Icons */}
            <div className="flex items-center space-x-4">
              {/* Discord */}
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Twitter/X */}
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              {/* Email */}
              <a href="mailto:mlh@ttu.edu" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Divider line */}
          <div className="border-t border-gray-600 mb-6"></div>

          {/* Copyright */}
          <div className="text-center text-gray-400 text-sm">
            © 2025 MLH at TTU - All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;