"use client";

import PointsDistribution from "./pointsbar";
import Crown1 from "../assets/crown.png";
import Medal_start1 from "../assets/medalstar.png";
import Medal1 from "../assets/medal.png";
import clock from "../assets/Leading-icon.png";
import timer from "../assets/timer.png";
import ball5 from "../assets/5balls/03.png";
import hashtag from "../assets/hashtag.png";
import gift from "../assets/gift.png";
import FavoriteBalls from "./FavoriteBalls";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 🟣 Weekly Points Graph (kept as you had it)
const WeeklyPointsTrend = ({ graphData }: { graphData: any[] }) => {
  return (
    <div className="w-full max-w-md bg-[#121212] rounded-xl p-4 shadow-lg mt-6">
      <h3 className="text-white font-semibold text-lg mb-4">
        Weekly Points Trend
      </h3>
      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={graphData}
            margin={{
              top: 10,
              right: 10,
              left: -30,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#333333"
              vertical={false}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, "dataMax + 50"]}
              tickFormatter={(tick: number) => tick.toString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1e24",
                border: "1px solid #444",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#ffffff" }}
              formatter={(value: number) => [`${value} Points`, ""]}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 🟣 Performance Stats (kept logic)
const PerformanceStats = () => {
  const [stats, setStats] = useState({
    totalRaces: 0,
    totalPoints: 0,
    totalWins: 0,
    finishRate: 0,
    weeklyPoints: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/user/stats", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok || res.status === 200) {
          setStats({
            totalRaces: data.totalRaces ?? 0,
            totalPoints: data.totalPoints ?? 0,
            totalWins: data.totalWins ?? 0,
            finishRate: data.finishRate ?? 0,
            weeklyPoints: data.weeklyPoints ?? [],
          });
        } else {
          console.error("Failed to fetch stats:", data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-md text-center text-gray-400 mt-10">
        Loading your stats...
      </div>
    );
  }

  return (
    // need to create a round box around it
    <div className="box-border flex flex-col items-start p-3 gap-5 bg-[#121212] border border-[#242424] rounded-[20px] mx-auto">
      <h2 className="text-white font-semibold text-2xl mb-4">Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1f1f1f] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <p className="text-4xl font-bold text-white mb-1">
            {stats.totalRaces}
          </p>
          <p className="text-sm text-gray-400">Total races</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <p className="text-4xl font-bold text-green-500 mb-1">
            {stats.totalPoints}
          </p>
          <p className="text-sm text-gray-400">Total points</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <p className="text-4xl font-bold text-blue-400 mb-1">
            {stats.totalWins}
          </p>
          <p className="text-sm text-gray-400">Number of wins</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <p className="text-4xl font-bold text-red-400 mb-1">
            {stats.finishRate}%
          </p>
          <p className="text-sm text-gray-400">Average finish rate</p>
        </div>
      </div>

      {/* Graph below stats (left as-is) */}
      <WeeklyPointsTrend graphData={stats.weeklyPoints} />

      <div className="w-full max-w-md mt-6">
        <PointsDistribution />
      </div>
      <div className="w-full max-w-md mt-6">
        <FavoriteBalls />
      </div>
    </div>
  );
};

interface UserData {
  user?: {
    _id: string;
    email?: string;
    username?: string;
  };
}
interface ApiTopFinisher {
  name: string;
  position: string;
  time: string;
  ball: string;
  iconType: string; // "crown" | "medal"
}
interface ApiRace {
  id: string;
  mode: string;
  startTimestamp: number;
  endTimestamp: number;
  duration: string;
  position: string;
  yourBall: string;
  topFinishers: ApiTopFinisher[];
}
interface UiTopFinisher extends Omit<ApiTopFinisher, 'iconType'> {
  icon: string; // The imported image path
}

export interface UiRace extends Omit<ApiRace, 'topFinishers'> {
  timeRange: string;
  topFinishers: UiTopFinisher[];
}
const formatTimeRange = (startMs: number, endMs: number): string => {
  const format = (ms: number): string => {
    const date = new Date(ms);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };
  return `${format(startMs)} – ${format(endMs)}`;
};

// 🟣 Main Component — syntax fixed, icon references fixed, ball/hash placed correctly
export default function RaceHistory() {
  const [activeTab, setActiveTab] = useState("history");
  const [selectedDate, setSelectedDate] = useState("Today");
  const [races, setRaces] = useState<UiRace[]>([]);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState("All");
  const [showGameTypeOptions, setShowGameTypeOptions] = useState(false);
  const [, setUserData] = useState<UserData>({});
  const dateOptions = [
    "Today",
    "Yesterday",
    "Last 7 days",
    "Last 30 days",
    "Last 90 days",
    "12 months",
    "All time",
    "Custom date",
  ];

  const gameTypeOptions = ["Regular", "Lottery", "Elimination"];
  // using use effect fect users data from api already done in account.tsx
  useEffect(() => {
  const fetchUserAndRace = async () => {
    try {
      // Fetch user info
      const userRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/me`, {
        credentials: "include",
      });
      const userJson = await userRes.json();
      const user_id = userJson.user?._id;
      const username = userJson.user?.username;
      const email = userJson.user?.email;
      setUserData({ user: { _id: user_id, username, email } });

      const raceRes = await fetch(`${import.meta.env.VITE_PY_SERVER_URL}/api/user/race-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user_id ,limit: 100,gameType: selectedGameType}),
      });
      if (!raceRes.ok) throw new Error("Network response was not ok");
      const data = await raceRes.json() as ApiRace[];      
      const mappedRaces: UiRace[] = data.map((r) => ({
          ...r,
          timeRange: formatTimeRange(r.startTimestamp, r.endTimestamp),
          // Map the backend data to UI structure
          topFinishers: r.topFinishers.map((f) => ({
              ...f,
              // Logic to assign the correct imported image variable
              icon: f.position === "1st" ? Crown1 : (f.position === "2nd" ? Medal_start1 : Medal1)
          }))
        }));

        setRaces(mappedRaces);
    } catch (error) {
      console.error("Error fetching user or stats:", error);
    }
  };
  fetchUserAndRace();
}, []);


  return (
    <div className="w-full max-w-md box-border flex flex-col items-start p-3 gap-5bg-[#121212] border border-[#242424] rounded-[20px] self-stretch flex-none order-1 z-[1] m-auto">
      {/* Tabs */}
      <div className="flex bg-[#1c1c22] rounded-xl p-1 mb-6 w-full max-w-md">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            activeTab === "history" ? "bg-[#8b6fed]" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Race History
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            activeTab === "performance" ? "bg-[#8b6fed]" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("performance")}
        >
          Performance
        </button>
      </div>

      {activeTab === "history" && (
        <>
          {/* Race History Header */}
          
          <div className="w-full max-w-md mb-2">
            <h2 className="text-white font-semibold text-lg">Race history</h2>
          

          {/* Filters */}
          <div className="flex justify-between items-center w-full max-w-md bg-[#1c1c22] p-3 rounded-xl mb-5 relative">
            {/* Game Type Dropdown */}
            <div className="relative w-[48%]">
              <button
                onClick={() => setShowGameTypeOptions(!showGameTypeOptions)}
                className="bg-[#2b2b36] text-gray-300 text-sm px-3 py-2 rounded-full w-full text-left flex justify-between items-center"
              >
                {selectedGameType}
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {showGameTypeOptions && (
                <div className="absolute top-12 left-0 w-full bg-[#1c1c22] border border-gray-700 rounded-2xl shadow-lg z-10 overflow-hidden">
                  {gameTypeOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedGameType(option);
                        setShowGameTypeOptions(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b36] transition ${
                        option === selectedGameType ? "bg-[#2b2b36]" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Dropdown */}
            <div className="relative w-[48%]">
              <button
                onClick={() => setShowDateOptions(!showDateOptions)}
                className="bg-[#2b2b36] text-gray-300 text-sm px-3 py-2 rounded-full w-full text-left flex justify-between items-center"
              >
                {selectedDate}
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {showDateOptions && (
                <div className="absolute top-12 left-0 w-full bg-[#1c1c22] border border-gray-700 rounded-2xl shadow-lg z-10 overflow-hidden">
                  {dateOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (option === "Custom date") {
                          const picker = document.createElement("input");
                          picker.type = "date";
                          picker.onchange = (e: any) =>
                            setSelectedDate(e.target.value);
                          picker.click();
                        } else {
                          setSelectedDate(option);
                        }
                        setShowDateOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b36] rounded-xl transition"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Race Cards list */}
          <div className="w-full max-w-md space-y-4">
            {races.map((race, index) => (
              <div
                key={index}
                className="bg-[#1f1f1f] rounded-2xl p-4 border border-gray-800 shadow-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{race.id}</span>
                  <span className="bg-[#1f1f1f] text-white text-xs px-2 py-1 rounded-lg">
                    {race.mode}
                  </span>
                </div>

                {/* 2x2 stat boxes */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-300">
                  {/* Time range */}
                  <div className="flex flex-col items-start bg-[#121212] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <img src={clock}  alt="winner" className="w-5 h-5 object-contain" />
                      <p className="font-semibold text-white text-sm">
                        {race.timeRange}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Time range</p>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col items-start bg-[#121212] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <img src={timer}  alt="winner" className="w-5 h-5 object-contain" />
                      <p className="font-semibold text-white text-sm">
                        {race.duration}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Duration</p>
                  </div>

                  {/* Your position */}
                  <div className="flex flex-col items-start bg-[#121212] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <img src={gift}  alt="winner" className="w-5 h-5 object-contain" />
                      <p className="font-semibold text-purple-400 text-sm">
                        {race.position}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Your position</p>
                  </div>

                  {/* Your ball: shows '#' and ball number 7 on Left */}
                    <div className="flex items-center justify-between bg-[#121212] rounded-xl p-3">
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                        <img src={hashtag} alt="#" className="w-5 h-5 object-contain" />
                        <img src={ball5} alt="ball" className="w-5 h-5 object-contain" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Your ball</p>
                    </div>
                    </div>
                </div>

                {/* Top 3 finishers */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Top 3 finishers</p>
                  <div className="space-y-2">
                    {race.topFinishers.map((f, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-[#121212] p-3 rounded-xl border border-gray-800"
                      >
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {f.name}
                          </p>
                          <p className="text-xs">
                            <span className="text-purple-400 font-semibold">
                              {f.position} Position
                            </span>{" "}
                            <span className="text-gray-400">• {f.ball}</span>{" "}
                            <span className="text-gray-400">• {f.time}</span>
                          </p>
                        </div>

                        {/* show the imported icon image */}
                        <img
                          src={f.icon}
                          alt={`${f.name}-icon`}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            ))}
          </div>
          </div>
        </>
      )}

      {activeTab === "performance" && <PerformanceStats />}
    </div>
  );
}
