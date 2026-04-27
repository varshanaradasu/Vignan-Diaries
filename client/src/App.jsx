import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";
import Post from "./pages/Post.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Saved from "./pages/Saved.jsx";
import PublicCollection from "./pages/PublicCollection.jsx";
import Profile from "./pages/Profile.jsx";
import Forgot from "./pages/Forgot.jsx";
import { getToken, clearToken } from "./lib/auth";
import "./App.css";
import Assistant from "./widgets/Assistant.jsx";

const Admin = lazy(() => import("./pages/Admin.jsx"));

function RequireAuth({ children }) {
  const t = getToken();
  if (!t) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();
  const location = useLocation();

  function syncAuthFromToken() {
    const t = getToken();
    setIsLoggedIn(!!t);
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        setRole(payload.role || null);
        setUser({ username: payload.username || "User" });
      } catch {
        setRole(null);
        setUser(null);
      }
    } else {
      setRole(null);
      setUser(null);
    }
  }

  useEffect(() => {
    syncAuthFromToken();
    const onStorage = (e) => {
      if (e.key === "token") syncAuthFromToken();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location]);

  // Theme init
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = saved || (prefersDark ? "dark" : "light");
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  function handleLogout() {
    clearToken();
    setIsLoggedIn(false);
    setRole(null);
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  }

  const initial = (user?.username || "U").charAt(0).toUpperCase();

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="logo-icon">✍️</span>
            <span className="logo-text">VIGNAN DIARIES</span>
          </Link>
          <div className="navbar-links">
            <input
              className="nav-search"
              placeholder="Search posts"
              value={new URLSearchParams(location.search).get("query") || ""}
              onChange={(e) => {
                const v = e.target.value;
                const sp = new URLSearchParams(location.search);
                if (v) sp.set("query", v);
                else sp.delete("query");
                navigate(`/feed?${sp.toString()}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.blur();
                }
              }}
            />
            <button
              className="btn btn-ghost btn-small theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            {isLoggedIn && (
              <Link to="/feed" className="nav-link">
                Feed
              </Link>
            )}
            {isLoggedIn ? (
              <>
                <Link to="/editor" className="btn btn-primary btn-small">
                  New Post
                </Link>
                <div className="profile-menu">
                  <button
                    className="profile-button"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <div className="avatar">{initial}</div>
                    <div className="profile-meta">
                      <div className="profile-name">
                        {user?.username || "User"}
                      </div>
                      <span className={`role-badge ${role || ""}`}>
                        {(role || "").toUpperCase()}
                      </span>
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="dropdown">
                      <Link
                        to="/dashboard"
                        className="dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/saved"
                        className="dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Saved
                      </Link>
                      {role === "admin" && (
                        <Link
                          to="/admin"
                          className="dropdown-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-small">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/feed"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/register" element={<Register />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/c/:username/:name" element={<PublicCollection />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Suspense
                  fallback={<div style={{ padding: 16 }}>Loading…</div>}
                >
                  <Admin />
                </Suspense>
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      <Assistant />
      {/* Bottom nav for mobile */}
      <nav className="bottom-nav">
        <Link to="/" className="bottom-item">
          🏠<span>Home</span>
        </Link>
        <Link to="/feed" className="bottom-item">
          📰<span>Feed</span>
        </Link>
        <Link to="/editor" className="bottom-item">
          ✍️<span>New</span>
        </Link>
        <Link to="/saved" className="bottom-item">
          🔖<span>Saved</span>
        </Link>
        {isLoggedIn ? (
          <button
            className="bottom-item"
            onClick={() => setMenuOpen((v) => !v)}
          >
            🙍<span>Me</span>
          </button>
        ) : (
          <Link to="/login" className="bottom-item">
            🔐<span>Login</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export default App;
