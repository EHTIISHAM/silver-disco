"use client";

import React, { useState, useEffect } from "react";
import { Crown, Users, CalendarDays, Trophy, Gift } from "lucide-react";

const competitionsData = {
  current: {
    title: "September Speed Championship",
    sponsor: "Sponsored by Lorem Ipsum",
    daysLeft: 12,
    participants: 256,
    liveRankings: 1234,
  },
  past: [
    {
      title: "August Thunder Cup",
      date: "Aug 31, 2024",
      winner: "SpeedDemon",
      participants: 256,
      prize: "$500 Gift card prize",
    },
    {
      title: "Summer Slam Tournament",
      date: "Jul 18, 2024",
      winner: "BallMaster",
      participants: 256,
      prize: "$500 Gift card prize",
    },
    {
      title: "Summer Slam Tournament",
      date: "Jun 3, 2024",
      winner: "PinballPro",
      participants: 256,
      prize: "$500 Gift card prize",
    },
  ],
};

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"AllRaces" | "Competitions">("AllRaces");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRaces = async () => {
      try {
        console.log("🔄 Fetching leaderboard data...");
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard?temp=true&compT=simple`);

        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Leaderboard data received:", data);

        if (data.users && Array.isArray(data.users)) {
          // Map backend data to frontend structure
          const formattedData = data.users.map((user: any, index: number) => ({
            name: user.username || `Player ${index + 1}`,
            position: user.position || index + 1,
            races: user.races || 0,
            wins: user.wins || 0,
            points: user.points || 0,
            pfp: user.pfp,
          }));

          setLeaderboardData(formattedData);
        } else {
          console.warn("⚠ Unexpected data structure:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRaces();
  }, []);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center py-6 px-4">
      {/* Tabs */}
      <div className="flex w-full max-w-2xl bg-[#111] rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("AllRaces")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
            activeTab === "AllRaces" ? "bg-purple-600 text-white" : "text-gray-400"
          }`}
        >
          All Races
        </button>
        <button
          onClick={() => setActiveTab("Competitions")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
            activeTab === "Competitions" ? "bg-purple-600 text-white" : "text-gray-400"
          }`}
        >
          Competitions
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === "AllRaces" && (
        <div className="w-full max-w-2xl bg-gradient-to-b from-purple-700/40 to-black/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-800">
          <h2 className="text-white font-semibold mb-4 text-xl text-left">Leaderboard</h2>


          {loading ? (
            <p className="text-gray-400 text-center">Loading leaderboard...</p>
          ) : leaderboardData.length === 0 ? (
            <p className="text-gray-400 text-center">No leaderboard data found.</p>
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((player) => {
                let icon = null;
                if (player.position === 1) icon ="/crown.png";
                else if (player.position === 2) icon = "/medal-star.png";
                else if (player.position === 3) icon = "/medal.png";

                return (
                  <div
                    key={player.name}
                    className="flex justify-between items-center bg-gradient-to-r from-[#1b1530] to-[#281e48] hover:from-[#2a1e50] hover:to-[#3a2a6a] rounded-xl p-4 shadow-md border border-gray-700 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      {player.pfp ? (
                        <img
                          src={player.pfp}
                          alt="pfp"
                          className="w-10 h-10 rounded-full border border-purple-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                      )}

                      <div>
                        <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {player.position} Position • {player.races} Races •{" "}
                          <span className="text-white font-semibold">{player.wins} Wins</span> •{" "}
                          {player.points} Points
                        </p>
                      </div>
                    </div>
                    <div className="text-yellow-400">{icon}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Competitions Tab */}
      {activeTab === "Competitions" && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="bg-gradient-to-r from-purple-700 via-[#1e1633] to-black rounded-2xl p-5 shadow-lg">
            <h3 className="text-white font-semibold text-lg">{competitionsData.current.title}</h3>
            <p className="text-gray-300 text-sm mb-4">{competitionsData.current.sponsor}</p>

            <div className="grid grid-cols-3 gap-4 text-gray-200">
              <div className="flex flex-col items-center">
                <CalendarDays className="text-purple-400 mb-1" size={20} />
                <p className="text-sm font-semibold">{competitionsData.current.daysLeft} Days</p>
                <p className="text-xs text-gray-400">Days left</p>
              </div>

              <div className="flex flex-col items-center">
                <Users className="text-purple-400 mb-1" size={20} />
                <p className="text-sm font-semibold">{competitionsData.current.participants}</p>
                <p className="text-xs text-gray-400">Participants</p>
              </div>

              <div className="flex flex-col items-center">
                <Trophy className="text-purple-400 mb-1" size={20} />
                <p className="text-sm font-semibold">{competitionsData.current.liveRankings}</p>
                <p className="text-xs text-gray-400">Live rankings</p>
              </div>
            </div>
          </div>

          {/* Past Competitions */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-lg">Past Competitions</h3>
            <div className="space-y-4">
              {competitionsData.past.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-[#1b1530] via-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 border border-[#2b2b2b] shadow-lg hover:shadow-purple-700/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold text-base">{comp.title}</h4>
                    <span className="text-gray-400 text-xs">{comp.date}</span>
                  </div>

                  <div className="flex flex-wrap justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-[150px] bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 flex flex-col items-center text-center hover:border-purple-500/40 transition">
                      <Crown className="text-white mb-1" size={22} />
                      <span className="text-white font-medium text-sm">{comp.winner}</span>
                      <span className="text-gray-500 text-xs mt-1">Winner</span>
                    </div>

                    <div className="flex-1 min-w-[150px] bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 flex flex-col items-center text-center hover:border-purple-500/40 transition">
                      <Users className="text-indigo-400 mb-1" size={20} />
                      <span className="text-white font-medium text-sm">{comp.participants}</span>
                      <span className="text-gray-500 text-xs mt-1">Participants</span>
                    </div>
                  </div>

                  <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-center gap-2 hover:border-purple-500/40 transition">
                    <Gift className="text-purple-400" size={18} />
                    <span className="text-sm text-white font-medium">{comp.prize}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;










