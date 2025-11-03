// src/components/PinballRaceHeader.tsx
import React, { useEffect, useState } from "react";
import {IoNotificationsOutline } from "react-icons/io5";
import logo from "../assets/orilogo.png";

interface Props {
  pfp?: string | null;
  username?: string | null;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
}

const PinballRaceHeader: React.FC<Props> = ({
  pfp,
  username,
  
  onNotificationsClick,
}) => {
  const [userPfp, setUserPfp] = useState<string | undefined>(pfp ?? undefined);
  const [userName, setUserName] = useState<string | undefined>(username ?? undefined);
  const fallbackPfp = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Fetch user info if props not provided
  useEffect(() => {
    // ✅ If parent provided pfp or username, use them directly
    if (pfp || username) {
      setUserPfp(pfp ?? undefined);
      setUserName(username ?? undefined);
      return;
    }

    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    if (!serverUrl) {
      console.warn("VITE_SERVER_URL not set; using fallback avatar.");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${serverUrl}/get_profile`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("Failed to fetch profile:", res.status);
          return;
        }

        const data = await res.json();
        const userData = data.user || data;

        if (mounted) {
          setUserPfp(userData.pfp ?? userData.profilePic ?? undefined);
          setUserName(userData.username ?? undefined);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pfp, username]);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#121212] text-white shadow-md h-16 w-full">
      <div className="flex items-center">
        <img
          src={userPfp || fallbackPfp}
          alt={userName || "User"}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
        />
        {userName && <span className="ml-2 text-sm font-medium">{userName}</span>}
      </div>

      <div className="flex justify-center items-center">
        <img src={logo} alt="Pinball Race Logo" className="h-30 object-contain select-none" />
      </div>

      <div className="flex items-center space-x-2">
        

        <button
          onClick={onNotificationsClick}
          className="p-2 rounded-full border border-gray-600 hover:bg-gray-800 transition"
          aria-label="Notifications"
        >
          <IoNotificationsOutline size={20} />
        </button>
      </div>
    </header>
  );
};

export default PinballRaceHeader;




