import { Link } from 'react-router-dom'
import { getToken } from '../lib/auth'
import '../styles/Landing.css'

export default function Landing() {
  const isLoggedIn = !!getToken()

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero pro-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Vignan Diaries</span>
            <br />
            Your Campus, Your Voice
          </h1>
          <p className="hero-subtitle">
            The official community space for Vignan University students and faculty.
            Share research, events, placements, clubs, and campus life — all in one place.
          </p>
          <div className="hero-cta">
            {isLoggedIn ? (
              <>
                <Link to="/feed" className="btn btn-primary btn-large">Open Feed</Link>
                <Link to="/editor" className="btn btn-secondary btn-large">Create Post</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">Get Started Now</Link>
                <Link to="/login" className="btn btn-secondary btn-large">Sign In</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-illustration pro-mock">
          <div className="mock mock-feed">
            <div className="mock-bar"></div>
            <div className="mock-card"></div>
            <div className="mock-card"></div>
          </div>
          <div className="mock mock-post">
            <div className="mock-cover"></div>
            <div className="mock-lines"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features pro-features">
        <h2 className="section-title">Built for Vignan University</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Academics & Research</h3>
            <p>Post about labs, projects and papers across 18+ research centers. Showcase innovations and outcomes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Placements & Careers</h3>
            <p>Share CRT tips, mock interview material and company experiences—help peers land roles.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Clubs & Events</h3>
            <p>From SAC activities to Vignan Mahotsav—announce, recap, and relive the best moments.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏷️</div>
            <h3>Student Support</h3>
            <p>Collect resources on counseling, scholarships, hostels, sports and services in one hub.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Global Exposure</h3>
            <p>Share internship journeys, higher‑ed admits and exchange programs to guide juniors.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Write Fast</h3>
            <p>Clean editor with autosave, cover images and instant publishing.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats pro-stats">
        <div className="stat-item">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Posts Published</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">5K+</div>
          <div className="stat-label">Active Writers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">50K+</div>
          <div className="stat-label">Monthly Readers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99.9%</div>
          <div className="stat-label">Uptime</div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section pro-cta">
        <h2>Join Vignan Diaries</h2>
        <p>Be part of a student–faculty network that learns, shares and grows together.</p>
        {isLoggedIn ? (
          <Link to="/editor" className="btn btn-primary btn-large">Create a Post</Link>
        ) : (
          <Link to="/register" className="btn btn-primary btn-large">Get Started Now</Link>
        )}
      </section>
    </div>
  )
}
