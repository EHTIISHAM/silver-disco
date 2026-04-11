import { useState } from "react";
import logo from "../assets/logo.png";
import { MdLogout } from "react-icons/md";
import { HiBars3, HiXMark } from "react-icons/hi2";
import axios from "axios";
import HowToPlay from "../components/howtoplay";
import HowPointsWork from "../components/howpointsworks";
import SponsorPage from "../components/sponcerpage";

interface Header {
  username?: string;
  pfp?: string;
}

type ActivePage = "how-to-play" | "how-points-work" | "sponsor" | null;

const Headers = ({ username, pfp }: Header) => {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const [menuOpened, setMenuOpened] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>(null);

  const logout = async () => {
    try {
      await axios.post(`${serverUrl}/unrestricted/logout`, {}, { withCredentials: true });
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const profileImage = pfp && pfp.trim() !== "" ? pfp : logo;

  const openPage = (page: ActivePage) => {
    setActivePage(page);
    setMenuOpened(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "how-to-play":     return <HowToPlay />;
      case "how-points-work": return <HowPointsWork />;
      case "sponsor":         return <SponsorPage />;
      default:                return null;
    }
  };

  const pageLinks: { label: string; page: ActivePage }[] = [
    { label: "How to Play",      page: "how-to-play" },
    { label: "How Points Work",  page: "how-points-work" },
    { label: "Sponsor the Race", page: "sponsor" },
  ];

  return (
    <>
      <header className="heading">

        {/* Logo — left */}
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>

          {/* Login / Signup or Profile — always visible */}
          {!username ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <a className="btn-primary" href="/login">Login</a>
              <a className="btn-secondary" href="/signUp">Sign Up</a>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src={profileImage}
                alt="Profile"
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
              />
              <button className="btn-secondary" onClick={logout}>
                <MdLogout size={20} fill="var(--inverted-text)" />
              </button>
            </div>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpened(!menuOpened)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #444",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {menuOpened
              ? <HiXMark size={20} color="var(--text)" />
              : <HiBars3 size={20} color="var(--text)" />
            }
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {menuOpened && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setMenuOpened(false)}
        />
      )}

      {/* Slide-in sidebar from right */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: menuOpened ? 0 : "-260px",
          width: "240px",
          height: "100vh",
          background: "#121212",
          borderLeft: "1px solid #2a2a2a",
          zIndex: 50,
          transition: "right 0.25s ease",
          display: "flex",
          flexDirection: "column",
          paddingTop: "72px",
          fontFamily: "Arial, Inter, sans-serif",
          overflowY: "auto",
        }}
      >
        {/* Standard nav links */}
        {[
          { label: "Home", href: "/" },
          { label: "Terms of Service", href: "/terms_of_service.pdf", target: "_blank" },
          { label: "Privacy Policy", href: "/privacy_policy.pdf", target: "_blank" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.target}
            style={{
              display: "block",
              color: "#f0f0f0",
              fontSize: "15px",
              padding: "14px 24px",
              borderBottom: "1px solid #2a2a2a",
              textDecoration: "none",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            {item.label}
          </a>
        ))}

        {/* Divider label */}
        <div
          style={{
            padding: "10px 24px 6px",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#555",
            fontFamily: "Arial, Inter, sans-serif",
          }}
        >
          Info
        </div>

        {/* 3 page render links */}
        {pageLinks.map((item) => (
          <button
            key={item.page}
            onClick={() => openPage(item.page)}
            style={{
              background: "none",
              border: "none",
              borderBottom: "1px solid #2a2a2a",
              color: "#f0f0f0",
              fontSize: "15px",
              textAlign: "left",
              padding: "14px 24px",
              cursor: "pointer",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Full-screen overlay for rendered pages */}
      {activePage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "#000000",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setActivePage(null)}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 101,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#121212",
              border: "none",
              borderBottom: "1px solid #2a2a2a",
              color: "#f0f0f0",
              fontSize: "14px",
              padding: "12px 20px",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Arial, Inter, sans-serif",
            }}
          >
            ← Back
          </button>

          {renderActivePage()}
        </div>
      )}
    </>
  );
};

export default Headers;