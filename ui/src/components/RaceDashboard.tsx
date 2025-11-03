"use client";

import React, { useState, useEffect } from "react";
import { FaUser, FaGift } from "react-icons/fa";
import { IoTimeOutline } from "react-icons/io5";
import JoinRaceModal from "../components/JoinRaceModal";

// ✅ Dynamic ProgressBar Component (added inline)
interface ProgressBarProps {
  time: number; // e.g. 1, 2, 3, 5, 10
  maxTime?: number; // default 10
}

const ProgressBar: React.FC<ProgressBarProps> = ({ time, maxTime = 10 }) => {
  const percentage = Math.min((time / maxTime) * 100, 100);

  return (
    <div className="w-full">
      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
        <div
          className="bg-[#8b6fed] h-2 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-right text-xs text-gray-400 mb-3">{time} min</p>
    </div>
  );
};

const RaceDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [recentRaces, setRecentRaces] = useState<any[]>([]);

  // Example dynamic time value
  const currentRaceTime = 3; // 0–10 range for demo

  // ✅ Fetch data from backend LeaderboardTemp
  useEffect(() => {
  const fetchRecentRaces = async () => {
    try {
      console.log("🔄 Fetching leaderboard data...");
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard?temp=true&compT=simple`);


      // Check if request failed
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Leaderboard data received:", data);

      // If your backend sends { users: [...] }
      if (data.users && Array.isArray(data.users)) {
        setRecentRaces(data.users.slice(0, 3));
      } else {
        console.warn("⚠ Unexpected data structure:", data);
      }
    } catch (err) {
      console.error("❌ Error fetching leaderboard:", err);
    }
  };

  fetchRecentRaces();
}, []);


  return (
    <div className="w-full flex justify-center px-3 sm:px-6 lg:px-10 py-6">
      <div className="w-full max-w-6xl text-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ----- Current Race ----- */}
        <div className="bg-[#111] rounded-2xl p-4 shadow border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm text-gray-400 mb-1">
              Current race <span className="text-indigo-400">( ---- )</span>
            </h2>
            <p className="text-gray-300 text-sm mb-3">#xxxxxxxx</p>

            {/* ✅ Dynamic Progress Bar */}
            <ProgressBar time={currentRaceTime} maxTime={10} />

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="flex items-center space-x-1 mb-1 text-base font-semibold">
                  <IoTimeOutline /> <span>xx:xx</span>
                </span>
                <span className="text-gray-400 text-xs">Start time</span>
              </div>

              <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="flex items-center space-x-1 mb-1 text-base font-semibold">
                  <FaUser /> <span>xx</span>
                </span>
                <span className="text-gray-400 text-xs">Participants</span>
              </div>

              <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="mb-1 text-base font-semibold">---</span>
                <span className="text-gray-400 text-xs">Entry</span>
              </div>

              <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="flex items-center space-x-1 mb-1 text-base font-semibold">
                  <FaGift /> <span>---</span>
                </span>
                <span className="text-gray-400 text-xs">Prize</span>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            className="w-full bg-black text-white font-semibold py-2 rounded-3xl border border-[#522cab] hover:border-blue-600 hover:bg-[#0a0a0a] transition"
            onClick={() => setShowModal(true)}
          >
            Join next match
          </button>
        </div>

        {/* ----- Recent Races (Fetched from Backend) ----- */}
        <div className="bg-[#111] rounded-2xl p-4 shadow border border-gray-800">
          <h2 className="text-sm text-gray-400 mb-3">Recent races</h2>

          {recentRaces.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent races found</p>
          ) : (
            recentRaces.map((race, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl mb-2 hover:bg-gray-800 transition"
              >
                <div className="flex items-center space-x-3">
                  {race.pfp ? (
                    <img
                      src={race.pfp}
                      alt={race.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs">
                      ?
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {race.raceId}
                    </p>
                    <p className="text-xs text-gray-400">
                      Winner:{" "}
                      <span className="text-indigo-400">
                        {race.username || "N/A"}
                      </span>{" "}
                      • {race.type}
                    </p>
                    <div className="mt-1 space-x-1 text-lg">
                      <span>🎱</span>
                      <span>🔥</span>
                      <span>🏆</span>
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">&gt;</span>
              </div>
            ))
          )}
        </div>

        {/* ----- Championship ----- */}
        <div className="relative rounded-2xl p-4 shadow border border-gray-800 flex flex-col justify-between overflow-hidden">
<div className="absolute inset-0 bg-[linear-gradient(to_right,_#3730a3_0%,_#312e81_30%,_#000000_80%,_#000000_100%)]"></div>




          <div className="relative z-10">
            <h2 className="text-sm font-semibold mb-1 text-white">
              September speed championship
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Sponsored by Lorem Ipsum
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="mb-1 text-base font-semibold text-white">
                  12 Days
                </span>
                <span className="text-gray-400 text-xs">Left</span>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="flex items-center space-x-1 mb-1 text-base font-semibold text-white">
                  <FaUser /> <span>256</span>
                </span>
                <span className="text-gray-400 text-xs">Participants</span>
              </div>

              <div className="col-span-2 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="flex items-center space-x-1 mb-1 text-base font-semibold text-white">
                  <FaGift /> <span>$500</span>
                </span>
                <span className="text-gray-400 text-xs">Gift card prize</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <JoinRaceModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default RaceDashboard;




