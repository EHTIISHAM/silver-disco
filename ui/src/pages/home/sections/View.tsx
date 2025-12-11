import { useEffect, useState } from "react";
import PinballRaceHeader from "../../../components/PinballRaceHeader";
import LiveStreamCard from "../../../components/LiveStreamCard";
import RaceDashboard from "../../../components/RaceDashboard";
import PinballRaceFooter from "../../../components/PinballRaceFooter";
import Leaderboard from "../../../components/Leaderboard";
import Data from "../../../components/data";
import AccountScreen from "../../../components/account";

type ActiveTab = "Home" | "Winners" | "Data" | "Profile";

interface UserData {
  _id: string;
  username?: string;
  email?: string;
  clientToken?: string;
  connectedAccounts?: {
    google: boolean;
    tiktok: boolean;
    twitch: boolean;
  };
}

const PinballRaceHome: React.FC = () => {
  // ✅ Load saved tab from localStorage, or default to "Home"
  const [user_data, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedTab = localStorage.getItem("activeTab") as ActiveTab | null;
    return savedTab || "Home";
  });

  // ✅ User state for header props
  const [user, setUser] = useState<{ username?: string; pfp?: string }>({});

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab); // ✅ Save tab choice
    console.log(`Navigation changed to: ${tab}`);
  };

  // ✅ Fetch user info once
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const serverUrl =
          import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
        const res = await fetch(`${serverUrl}/get_profile`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("⚠️ Failed to fetch user profile:", res.status);
          return;
        }

        const data = await res.json();
        const userData = data.user || data;

        setUser({
          username: userData.username,
          pfp: userData.pfp,
        });
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);
// add a button that will call offline game when cliecked call join race model but the ball selected will be for offline game
// that ball selected will be sent to offline game and the user will be able to play offline game with that ball
// returning the url from the backend and opening it in a new tab
// max games per day is 3 
  return (
    <div className="bg-black min-h-screen text-white pb-24 flex flex-col">
      <PinballRaceHeader username={user.username} pfp={user.pfp} />
    
      <main className="flex-1 p-4 space-y-6">
        {activeTab === "Home" && (
          <>
            <LiveStreamCard />
            <RaceDashboard />
            <button
              onClick={async () => {
                try {
                    // Fetch user info
                    const userRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/me`, {
                        credentials: "include",
                    });
                    const userJson = await userRes.json();
                    if (userJson.user) setUserData(userJson.user);
                    const response = await fetch(`${import.meta.env.VITE_PY_SERVER_URL}/api/games/offline/url`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ userId: user_data?._id }),
                      credentials: "include",
                    });

                  if (!response.ok) {
                    console.warn("⚠️ Failed to fetch offline game URL:", response.status);
                    return;
                  }

                  const data = await response.json();
                  const offlineGameUrl = data.url;

                  if (offlineGameUrl) {
                    window.open(offlineGameUrl, "_blank");
                  } else {
                    console.warn("⚠️ Offline game URL not found in response");
                  }
                } catch (err) {
                  console.error("❌ Error fetching offline game URL:", err);
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Play Offline Game
            </button>
          </>
        )}
        {activeTab === "Winners" && <Leaderboard />}
        {activeTab === "Data" && <Data />}
        {activeTab === "Profile" && <AccountScreen />}
      </main>

      <PinballRaceFooter activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default PinballRaceHome;


