"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Crown } from "lucide-react";

import first from "../assets/1st.png";
import second from "../assets/2nd.png";
import third from "../assets/3rd.png";
//import crown from "../assets/crown.png";
import contact from "../assets/contact.png";
import gift from "../assets/gift.png";
import calendar from "../assets/calendar.png";
import cup from "../assets/cup.png";
import live from "../assets/live.png";

interface Player {
  name: string;
  position: number;
  races: number;
  wins: number;
  points: number;
  pfp?: string;
  date?: string;
}

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
      title: "Spring Sprint",
      date: "Jun 3, 2024",
      winner: "PinballPro",
      participants: 256,
      prize: "$500 Gift card prize",
    },
  ],
};

// Helper: filter leaderboard by date range
function filterByDateRange(data: Player[], range: string, customDate?: string) {
  const now = new Date();

  return data.filter((player) => {
    if (!player.date) return true;
    const playerDate = new Date(player.date);

    switch (range) {
      case "Today":
        return playerDate.toDateString() === now.toDateString();
      case "Yesterday":
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return playerDate.toDateString() === yesterday.toDateString();
      case "Last 7 days":
        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 7);
        return playerDate >= last7Days;
      case "Last 30 days":
        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 30);
        return playerDate >= last30Days;
      case "Last 90 days":
        const last90Days = new Date();
        last90Days.setDate(now.getDate() - 90);
        return playerDate >= last90Days;
      case "12 Months":
        const last12Months = new Date();
        last12Months.setFullYear(last12Months.getFullYear() - 1);
        return playerDate >= last12Months;
      case "Custom date":
        if (!customDate) return true;
        const target = new Date(customDate);
        return playerDate.toDateString() === target.toDateString();
      default:
        return true; // "All time"
    }
  });
}

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"AllRaces" | "Competitions">("AllRaces");
  const [leaderboardData, setLeaderboardData] = useState<Player[]>([]);
  const [filteredData, setFilteredData] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDateOptions, setShowDateOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState("This Week");
  const [customDate, setCustomDate] = useState<string | undefined>();

  const dateOptions = [
    "Today",
    "Yesterday",
    "Last 7 days",
    "Last 30 days",
    "Last 90 days",
    "12 Months",
    "All time",
    "Custom date",
  ];

  useEffect(() => {
    const fetchRecentRaces = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard?temp=false&compT=simple`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();

        if (data.users && Array.isArray(data.users)) {
          const formatted: Player[] = data.users.map((user: any, i: number) => ({
            name: user.username || `Player ${i + 1}`,
            position: user.position || i + 1,
            races: user.races || 0,
            wins: user.wins || 0,
            points: user.points || 0,
            pfp: user.pfp,
            date: user.date || new Date(Date.now() - i * 86400000).toISOString(),
          }));

          setLeaderboardData(formatted);
          setFilteredData(formatted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRaces();
  }, []);

  useEffect(() => {
    const result = filterByDateRange(leaderboardData, selectedDate, customDate);
    setFilteredData(result);
  }, [selectedDate, customDate, leaderboardData]);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center py-6 px-4">
      {/* Tabs */}
      <div className="flex w-full max-w-2xl bg-[#111] rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("AllRaces")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
            activeTab === "AllRaces" ? "bg-[#8a6fec] text-white" : "text-gray-400"
          }`}
        >
          All Races
        </button>
        <button
          onClick={() => setActiveTab("Competitions")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
            activeTab === "Competitions" ? "bg-[#8a6fec] text-white" : "text-gray-400"
          }`}
        >
          Competitions
        </button>
      </div>

      {/* All Races Tab */}
      {activeTab === "AllRaces" && (
        <div
          className="w-full max-w-2xl bg-gradient-to-b via-[#1e1b2e] to-black backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-800 relative"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(39, 21, 82, 0.4), #1e1b2e, #000000)",
          }}
        >
          {/* Header with Dropdown */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold text-xl text-left">Leaderboard</h2>

            <div className="relative w-[48%] sm:w-[180px]">
              <button
                onClick={() => setShowDateOptions(!showDateOptions)}
                className="bg-[#2b2b36] text-gray-300 text-sm px-3 py-2 rounded-full w-full text-left flex justify-between items-center"
              >
                {selectedDate === "Custom date" && customDate
                  ? new Date(customDate).toDateString()
                  : selectedDate}
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showDateOptions && (
                <div className="absolute top-11 left-0 w-full bg-[#1c1c22] border border-purple-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                  {dateOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (option === "Custom date") {
                          const picker = document.createElement("input");
                          picker.type = "date";
                          picker.style.position = "fixed";
                          picker.style.top = "-1000px";
                          picker.style.opacity = "0";
                          document.body.appendChild(picker);

                          picker.onchange = (e: any) => {
                            setCustomDate(e.target.value);
                            setSelectedDate("Custom date");
                            setShowDateOptions(false);
                            document.body.removeChild(picker);
                          };

                          if (picker.showPicker) picker.showPicker();
                          else picker.click();
                        } else {
                          setSelectedDate(option);
                          setCustomDate(undefined);
                          setShowDateOptions(false);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b36] rounded-xl transition relative"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Data */}
          {loading ? (
            <p className="text-gray-400 text-center">Loading leaderboard...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-gray-400 text-center">
              No leaderboard data found for selected date.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredData.map((player) => {
                let icon = null;
                if (player.position === 1)
                  icon = <img src={first} alt="1st" className="w-5 h-5 object-contain" />;
                else if (player.position === 2)
                  icon = <img src={second} alt="2nd" className="w-5 h-5 object-contain" />;
                else if (player.position === 3)
                  icon = <img src={third} alt="3rd" className="w-5 h-5 object-contain" />;

                return (
                  <div
                    key={`${player.name}-${player.position}`}
                    className="flex justify-between items-center bg-white/5 backdrop-blur-md rounded-xl p-4 shadow-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                        <p className="text-sm">
                          <span className="text-[#8b6fed] font-semibold">
                            {player.position} Position
                          </span>{" "}
                          • <span className="text-gray-400">{player.races} Races</span> •{" "}
                          <span className="text-gray-400">{player.wins} Wins</span> •{" "}
                          <span className="text-gray-400">{player.points} Points</span>
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
        <div className="w-full max-w-2xl rounded-2xl space-y-6">
          {/* Current Competition */}
          <div className="relative rounded-2xl p-5 shadow-lg border border-purple-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#271552]/80 to-black/40 blur-sm"></div>

            <div className="relative z-10">
              <h3 className="text-white font-bold text-2xl mb-1">
                {competitionsData.current.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {competitionsData.current.sponsor}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1c1c22]/60 rounded-xl flex items-center space-x-3 p-4 backdrop-blur-sm">
                  <img src={calendar} alt="calendar" className="w-5 h-5 object-contain" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {competitionsData.current.daysLeft} Days
                    </p>
                    <p className="text-gray-300 text-xs">Days left</p>
                  </div>
                </div>

                <div className="bg-[#1c1c22]/60 rounded-xl flex items-center space-x-3 p-4 backdrop-blur-sm">
                  <img src={contact} alt="participants" className="w-5 h-5 object-contain" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {competitionsData.current.participants}
                    </p>
                    <p className="text-gray-300 text-xs">Participants</p>
                  </div>
                </div>

                <div className="bg-[#1c1c22]/60 col-span-2 rounded-xl flex justify-between items-center p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <img src={cup} alt="cup" className="w-5 h-5 object-contain" />
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {competitionsData.current.liveRankings.toLocaleString()}
                      </p>
                      <p className="text-gray-300 text-xs">Live rankings</p>
                    </div>
                  </div>
                  <img src={live} alt="Live" className="w-6 h-6 object-contain animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Past Competitions */}
          <div className="bg-[#121212] py-10 px-6 rounded-2xl flex justify-center">
            <div className="w-full rounded-2xl max-w-3xl">
              <h3 className="text-white font-bold text-2xl mb-6 text-left">
                Past Competitions
              </h3>

              <div className="space-y-6">
                {competitionsData.past.map((comp, index) => (
                  <div
                    key={index}
                    className="relative bg-[#1c1c22] p-6 rounded-2xl shadow-lg border border-gray-800 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[#1f1f1f]"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-semibold text-lg">{comp.title}</h4>
                        <span className="text-xs text-gray-400 bg-[#121212] px-3 py-1 rounded-full">
                          {comp.date}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#121212] p-4 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                          <Crown className="text-white mb-1" size={22} />
                          <div>
                            <p className="text-white font-semibold">{comp.winner}</p>
                            <p className="text-gray-400 text-xs">Winner</p>
                          </div>
                        </div>

                        <div className="bg-[#121212] p-4 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                          <img src={contact} alt="participants" className="w-5 h-5 object-contain" />
                          <div>
                            <p className="text-white font-semibold">
                              {comp.participants}
                            </p>
                            <p className="text-gray-400 text-xs">Participants</p>
                          </div>
                        </div>

                        <div className="col-span-2 bg-[#121212] p-4 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                          <img src={gift} alt="prize" className="w-5 h-5 object-contain" />
                          <div>
                            <p className="text-white font-semibold">{comp.prize}</p>
                            <p className="text-gray-400 text-xs">Gift card prize</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;




