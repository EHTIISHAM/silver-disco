import { useState } from "react";
import logo from "../assets/logo.png";
import { MdClose, MdLogout, MdMenu } from "react-icons/md";
import axios from "axios";

interface Header {
  username?: string;
  pfp?: string;
}

const Headers = ({ username, pfp }: Header) => {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const [menuOpened, setMenuOpened] = useState(false);

  const logout = async () => {
    try {
      // Call backend to clear the HttpOnly cookie
      await axios.post(`${serverUrl}/unrestricted/logout`, {}, { withCredentials: true });


      // Redirect to login page
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const profileImage = pfp && pfp.trim() !== "" ? pfp : logo;

  return (
    <header className="heading">
      <button
        className="hamburger"
        style={{
          background: "transparent",
          outline: "none",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => setMenuOpened(!menuOpened)}
      >
        {!menuOpened ? (
          <MdMenu size={30} fill="var(--text)" />
        ) : (
          <MdClose size={30} fill="var(--text)" />
        )}
      </button>

      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>

      <ul className="nav-links">
        <li>
          <a href="/">Home</a>
        </li>
       

        {!username ? (
          <li className="cta">
            <a className="btn-primary" href="/">
              Login
            </a>
            <a className="btn-secondary" href="/">
              Sign Up
            </a>
          </li>
        ) : (
          <li className="userProfile">
            <img src={profileImage} alt="Profile Picture" />
            <button className="btn-secondary" onClick={logout}>
              <MdLogout size={24} fill="var(--inverted-text)" />
            </button>
          </li>
        )}
      </ul>

      {menuOpened ? (
        <ul className="mobile-nav-links nav-links">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/terms_of_service.pdf" target="_blank">
              Terms of Service
            </a>
          </li>
          <li>
            <a href="/privacy_policy.pdf" target="_blank">
              Privacy Policy
            </a>
          </li>

          {!username ? (
            <li className="cta">
              <a className="btn-primary" href="/login">
                Login
              </a>
              <a className="btn-secondary" href="/signUp">
                Sign Up
              </a>
            </li>
          ) : (
            <li className="userProfile">
              <img src={profileImage} alt="Profile Picture" />
              <button className="btn-secondary" onClick={logout}>
                <MdLogout size={24} fill="var(--inverted-text)" />
              </button>
            </li>
          )}
        </ul>
      ) : null}
    </header>
  );
};

export default Headers;






