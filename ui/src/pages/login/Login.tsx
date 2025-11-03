"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdMenu } from "react-icons/md";
import { FaGoogle, FaTwitch } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import logo from "../../assets/orilogo.png";
import Footer from "../../components/Footer";

type Mode = "login" | "signup" | null;

const HomePage = () => {
  const [menuOpened, setMenuOpened] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>(null);
  const [checking, setChecking] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverUrl: string | undefined = import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();

  // ✅ Check session
  useEffect(() => {
    if (!serverUrl) {
      console.warn("VITE_SERVER_URL not set");
      setChecking(false);
      return;
    }
    axios
      .get(`${serverUrl}/home`, { withCredentials: true })
      .then(() => navigate("/home"))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [serverUrl, navigate]);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setError(null);
    setSubmitting(false);
  };

  // ✅ Handle login/signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl) return setError("Server URL missing.");

    try {
      setSubmitting(true);
      setError(null);

      if (authMode === "login") {
        if (!username || !password) return setError("Enter username & password.");
        const res = await axios.post(
          `${serverUrl}/demo_login`,
          { username, password },
          { withCredentials: true }
        );
        if (res.data?.type === "User") navigate("/home");
        else if (res.data?.type === "Admin") navigate("/dashboard");
      } else if (authMode === "signup") {
        if (!username || !email || !password || !confirm)
          return setError("Fill out all fields.");
        if (password !== confirm) return setError("Passwords do not match.");
        const res = await axios.post(
          `${serverUrl}/demo_sign_up`,
          { username, email, password },
          { withCredentials: true }
        );
        if (res.data?.user) navigate("/home");
      }

      setAuthMode(null);
      resetForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Request failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithTiktok = () => {
    if (serverUrl) window.location.href = `${serverUrl}/authenticate_tiktok`;
  };
  const loginWithGoogle = () => {
    if (serverUrl) window.location.href = `${serverUrl}/auth/google`;
  };
  const loginWithTwitch = () => {
    if (serverUrl) window.location.href = `${serverUrl}/unrestricted/twitch`;
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">
        Checking session…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white overflow-hidden">
      <header className="relative flex items-center justify-between px-5 py-4 bg-black border-b border-gray-800">
          <img src={logo} alt="Logo" className="h-10 w-auto" />

          {/* ✨ Center design element */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg" />
          </div>

          <button className="md:hidden" onClick={() => setMenuOpened(!menuOpened)}>
            {!menuOpened ? <MdMenu size={28} /> : <MdClose size={28} />}
          </button>

          <div className="hidden md:flex gap-4">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold"
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold"
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
          </div>
        </header>


      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpened && (
          <motion.div
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center gap-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MdClose
              className="absolute top-5 right-5 text-gray-300 cursor-pointer"
              size={30}
              onClick={() => setMenuOpened(false)}
            />
            <button
              className="w-40 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              onClick={() => {
                setAuthMode("login");
                setMenuOpened(false);
              }}
            >
              Login
            </button>
            <button
              className="w-40 py-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition"
              onClick={() => {
                setAuthMode("signup");
                setMenuOpened(false);
              }}
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HERO SECTION ===== */}
      <main className="flex flex-col items-center justify-center flex-grow text-center px-6 py-12">
        <h1 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-4">
          Welcome to Pinball Race 🎮
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-lg">
          Compete in real-time pinball races, climb the leaderboard, and win exclusive prizes.
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setAuthMode("signup")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-3 rounded-xl text-sm font-semibold"
          >
            Get Started
          </button>
          <button
            onClick={() => setAuthMode("login")}
            className="border border-gray-600 hover:border-gray-400 px-8 py-3 rounded-xl text-sm font-semibold text-gray-300"
          >
            I Already Have an Account
          </button>
        </div>
      </main>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-6 bg-[#111111] border-t border-[#1e1e1e]">
        <h2 className="text-3xl font-bold text-center mb-10">Why You’ll Love It</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Real-Time Racing",
              desc: "Play against others in real-time and prove your skills in epic pinball battles."
            },
            {
              title: "Rewards & Achievements",
              desc: "Earn medals, crowns, and rare in-game rewards for your victories."
            },
            {
              title: "Global Leaderboards",
              desc: "Compete worldwide and climb the ranks to become the ultimate pinball champion."
            }
          ].map((f, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a] hover:border-purple-500 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-20 px-6 text-center bg-[#0f0f0f] border-t border-[#1e1e1e]">
        <h2 className="text-3xl font-bold mb-10">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
          <div>
            <span className="text-purple-400 font-semibold">1. </span>Sign up and create your player profile.
          </div>
          <div>
            <span className="text-purple-400 font-semibold">2. </span>Join a live race or create your own challenge.
          </div>
          <div>
            <span className="text-purple-400 font-semibold">3. </span>Compete, earn rewards, and climb the leaderboard!
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 px-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600">
        <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
        <p className="text-white/90 mb-6">Join thousands of racers and start your journey today!</p>
        <button
          onClick={() => setAuthMode("signup")}
          className="bg-white text-purple-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100"
        >
          Start Racing
        </button>
      </section>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authMode && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-[#1b1530] to-[#281e48] border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-center text-2xl font-bold mb-5">
                {authMode === "login" ? "Login" : "Create Account"}
              </h2>

              {error && (
                <div className="bg-red-900/40 border border-red-600 text-red-300 text-sm rounded-md p-2 mb-4">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" onSubmit={handleAuthSubmit}>
                <input
                  type="text"
                  placeholder="Username"
                  className="bg-black/50 border border-gray-700 p-3 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                {authMode === "signup" && (
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-black/50 border border-gray-700 p-3 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                )}
                <input
                  type="password"
                  placeholder="Password"
                  className="bg-black/50 border border-gray-700 p-3 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {authMode === "signup" && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="bg-black/50 border border-gray-700 p-3 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 outline-none"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg font-semibold text-white transition"
                >
                  {submitting
                    ? authMode === "login"
                      ? "Signing in…"
                      : "Creating account…"
                    : authMode === "login"
                    ? "Login"
                    : "Sign Up"}
                </button>
              </form>

              {/* Social Logins */}
              <div className="mt-5 text-center">
                <p className="text-gray-400 text-sm mb-3">Or continue with</p>
                <div className="flex justify-center gap-3">
                  <button
                    className="bg-[#1b1b1b] hover:bg-[#2a2a2a] p-3 rounded-full border border-gray-700"
                    onClick={loginWithTiktok}
                  >
                    <SiTiktok className="text-pink-500" />
                  </button>
                  <button
                    className="bg-[#1b1b1b] hover:bg-[#2a2a2a] p-3 rounded-full border border-gray-700"
                    onClick={loginWithGoogle}
                  >
                    <FaGoogle className="text-red-500" />
                  </button>
                  <button
                    className="bg-[#1b1b1b] hover:bg-[#2a2a2a] p-3 rounded-full border border-gray-700"
                    onClick={loginWithTwitch}
                  >
                    <FaTwitch className="text-purple-500" />
                  </button>
                </div>
              </div>

              {/* Switch + Close */}
              <div className="flex justify-between items-center mt-6">
                <button
                  className="text-sm text-purple-400 hover:underline"
                  onClick={() =>
                    setAuthMode(authMode === "login" ? "signup" : "login")
                  }
                >
                  {authMode === "login"
                    ? "Need an account? Sign Up"
                    : "Already have an account? Login"}
                </button>
                <MdClose
                  size={22}
                  className="text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => {
                    setAuthMode(null);
                    resetForm();
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default HomePage;







