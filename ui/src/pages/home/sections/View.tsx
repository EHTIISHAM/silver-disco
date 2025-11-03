import { useEffect, useState } from "react";
import PinballRaceHeader from "../../../components/PinballRaceHeader";
import LiveStreamCard from "../../../components/LiveStreamCard";
import RaceDashboard from "../../../components/RaceDashboard";
import PinballRaceFooter from "../../../components/PinballRaceFooter";
import Leaderboard from "../../../components/Leaderboard";
import Data from "../../../components/data";
import AccountScreen from "../../../components/account";

type ActiveTab = "Home" | "Winners" | "Data" | "Profile";

const PinballRaceHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("Home");

  // ✅ User state for header props
  const [user, setUser] = useState<{ username?: string; pfp?: string }>({});

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    console.log(`Navigation changed to: ${tab}`);
  };

  // ✅ Fetch user info once (just like your old working setup)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
        const res = await fetch(`${serverUrl}/get_profile`, {
          credentials: "include", // include token cookie
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

  return (
    <div className="bg-black min-h-screen text-white pb-24 flex flex-col">
      {/* ✅ Pass user props to header */}
      <PinballRaceHeader username={user.username} pfp={user.pfp} />

      <main className="flex-1 p-4 space-y-6">
        {activeTab === "Home" && (
          <>
            <LiveStreamCard/>
              
            


            <RaceDashboard />
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







