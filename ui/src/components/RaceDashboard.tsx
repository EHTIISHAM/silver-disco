"use client";

import React, { useState, useEffect } from "react";
import JoinRaceModal from "../components/JoinRaceModal";
import leadingicon from "../assets/Leading-icon.png";
import contact from "../assets/contact.png";
import gift from "../assets/gift.png";
import entry from "../assets/entry.png";
import cup from "../assets/cup.png";
import calendar from "../assets/calendar.png";
import b1 from "../assets/5balls/01.png";
import b2 from "../assets/5balls/02.png";
import b3 from "../assets/5balls/03.png";
import b4 from "../assets/5balls/04.png";
import b5 from "../assets/5balls/05.png";

function getNextRaceStartTime(createdAt: number, timerTillNextRace?: number): string {
  const minutes = timerTillNextRace || 0;
  const startDate = new Date(createdAt + minutes * 60 * 1000);

  // Format HH:MM:SS to keep precision
  const hours = startDate.getHours().toString().padStart(2, "0");
  const mins = startDate.getMinutes().toString().padStart(2, "0");
  const secs = startDate.getSeconds().toString().padStart(2, "0");

  return `${hours}:${mins}:${secs}`;
}

function getRemainingSeconds(starttimeofgame: string) {
  const now = new Date();
  const [hours, minutes, seconds = 0] = starttimeofgame.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, seconds, 0);
  const diffMs = startTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

interface Game {
  status: "Not Started" | "Ongoing" | "Finished";
  gameType: string;
  gameNumber?: string;
  timerTillNextGame?: number; // backend sends int
  participants?: any[];
  entry?: string;
  prizeId?: string;
  prizeTitle?: string | null;
  createdAt: number; // fix from createdAT
}

interface GameResponse {
  games: Game[];
}



const ProgressBar: React.FC<{ time: number; maxTime: number }> = ({ time, maxTime }) => {
  const percentage = Math.min((time / maxTime) * 100, 100);
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div
        className="bg-[#8a6fec] h-2 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const RaceDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [recentRaces, setRecentRaces] = useState<any[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [remaining, setRemaining] = useState<number>(0);
  const currentGameType = games[0]?.gameType || "----";
  const currentGameNumber = games[0]?.gameNumber || "----";
  const currentRaceTime = games[0]?.timerTillNextGame || 0;
  let participantsCount = games[0]?.participants?.length || 0;
  if (currentGameNumber === "----") participantsCount = 0;
  const [participants, setParticipants] = useState<number>(participantsCount);
  const createdAt = games[0]?.createdAt || 0;
  const starttimeofgame = getNextRaceStartTime(createdAt, currentRaceTime);
  const gamestarttime = starttimeofgame.split(":").slice(0,2).join(":") || "xx:xx";
  const currentEntry = games[0]?.entry || "free";
  const currentgift = games[0]?.prizeTitle || "Points Only";
  



  // ✅ Fetch data from backend LeaderboardTemp
  useEffect(() => {
  const fetchRecentRaces = async () => {
    try {
      console.log("🔄 Fetching leaderboard data...");
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/leaderboard?temp=false`);


      // Check if request failed
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();

      // If your backend sends { users: [...] }
      if (data.users && Array.isArray(data.users)) {
        setRecentRaces(data.users.slice(0, 3));
      } else {
        console.error("Unexpected data format");
      }
    } catch (err) {
      console.error("Error fetching leaderboard");
    }
  };

  fetchRecentRaces();
}, []);

useEffect(() => { fetchGames(); }, []);
  const fetchGames = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_PY_SERVER_URL}/api/games/fetch`);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: GameResponse = await res.json(); 

        if (Array.isArray(data.games)) {
        const gamesList = data.games;
        const upcomingGames = gamesList
            .filter((g) => g.status === "Not Started" && typeof g.createdAt === "number")
            .sort((a, b) => a.createdAt! - b.createdAt!);

            if (upcomingGames.length > 0) {
            setGames([upcomingGames[0]]);

            } else {
                setGames([]);
            
            }
        
        }
        else{
            console.error("data fetching good error in filtering")
        }
    } catch (err) {
      console.error("❌ Error fetching games");
    }
  };

useEffect(() => {
  const interval = setInterval(() => {
    fetchGames(); // will update state if a new game appears
  }, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, []);
  useEffect(() => {
    if (!games.length) return;
    const startTime = getNextRaceStartTime(createdAt, currentRaceTime);
    //const totalSeconds = (currentRaceTime || 0) * 60;

    // Update remaining every second
    const timer = setInterval(() => {
      const remain = getRemainingSeconds(startTime);
      setRemaining(remain);

      // When timer ends, auto reload new game
      if (remain <= 0) {
        clearInterval(timer);
        fetchGames();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [games, createdAt, currentRaceTime]);

useEffect(() => {
  if (games?.[0]) {
    setParticipants(games[0].participants?.length || 0);
  }
}, [games]);

useEffect(() => {
  if (!currentGameNumber) return;

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_PY_SERVER_URL}/api/games/fetch`);
      if (!res.ok) return;
      const data: GameResponse = await res.json();
      const updatedGame = data.games?.find(
        (g) => g.gameNumber === currentGameNumber
      );
      if (updatedGame) setParticipants(updatedGame.participants?.length || 0);
    } catch (err) {
      console.error("⚠ Error updating participants", err);
    }
  };

  fetchParticipants();
  const pInterval = setInterval(fetchParticipants, 10000);
  return () => clearInterval(pInterval);
}, [currentGameNumber]);

  if (!games)
    return (
      <div className="text-white text-center py-10">
        <p>Loading next race...</p>
      </div>
    );

  const maxTimeSec = (currentRaceTime || 0) * 60;

  return (
    <div className="w-full flex justify-center px-3 sm:px-6 lg:px-10 py-6">
      <div className="w-full max-w-6xl text-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#121212] rounded-2xl p-4 shadow border border-gray-800 flex flex-col justify-between">
  <div>
    <h2 className="text-sm text-white-600 mb-1">
      Next race{" "}
      <span className="text-indigo-400">
        ({currentGameType ? currentGameType : "null"})
      </span>
    </h2>
    <p className="text-gray-300 text-sm mb-3">
      #{currentGameNumber}
    </p>


    {/* ✅ Dynamic Progress Bar */}
    <ProgressBar time={remaining} maxTime={maxTimeSec} />

    {/* Info grid */}
    <div className="grid grid-cols-2 gap-2 text-sm mb-4 p-2">

      {/* 🕓 Start Time */}
      <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-start text-left">
        <div className="flex items-center justify-start gap-2">
          <img
            src={leadingicon}
            alt="Clock Icon"
            className="w-4 h-4 object-contain opacity-80"
          />
          <span className="text-xl font-semibold text-white leading-none">{gamestarttime}</span>
        </div>
        <span className="text-gray-400 text-xs ml-6 mt-1">Start time</span>
      </div>

      {/* 👥 Participants */}
      <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-start text-left">
        <div className="flex items-center justify-start gap-2">
          <img
            src={contact}
            alt="Participants Icon"
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-base font-semibold text-white">
            {participants}
          </span>

        </div>
        <span className="text-gray-400 text-xs ml-6 mt-1">Participants</span>
      </div>

      {/* 💸 Entry */}
      <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-start text-left">
        <div className="flex items-center justify-start gap-2">
          <img
            src={entry}
            alt="Entry Icon"
            className="w-5 h-5 object-contain"
          />
          <span className="text-base font-semibold text-white">{currentEntry}</span>

        </div>
        <span className="text-gray-400 text-xs ml-6 mt-1">Entry</span>
      </div>

      {/* 🏆 Prize */}
      <div className="bg-[#1a1a1a] p-2 rounded-lg flex flex-col items-start text-left">
        <div className="flex items-center justify-start gap-2">
          <img
            src={gift}
            alt="Prize Icon"
            className="w-5 h-5 object-contain"
          />
          <span className="text-base font-semibold text-white">{currentgift}</span>
        </div>
        <span className="text-gray-400 text-xs ml-6 mt-1">Prize</span>
      </div>

    </div>
  </div>

  {/* 🔘 Join Button */}
  <button
    className="w-full bg-[#121212] text-white font-semibold py-2 rounded-3xl border border-[#522cab] hover:border-blue-600 hover:bg-[#0a0a0a] transition"
    onClick={() => setShowModal(true)}
  >
    Join next Race
  </button>
</div>



        {/* ----- Recent Races (Fetched from Backend) ----- */}
        {/* <div className="bg-[#111] rounded-white 2xl p-4 shadow border border-gray-800"> */}
        <div className="bg-[#121212] rounded-2xl p-4 shadow border border-gray-800 flex flex-col justify-between">

          
          <h2 className="text-sm text--400 mb-3">Recent races</h2>

          {recentRaces.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent races found</p>
          ) : (
            recentRaces.map((race, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl mb-2 hover:bg-gray-800 transition"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm">
                      {race.raceId}
                    </p>
                   <p className="text-sm text-gray-400">
                      <span className="text-[#8b6fed] text-xs font-bold">Winner</span> •{" "}
                      <span className="text-[#767676]">{race.username || "N/A"}</span> •{" "}
                      <span className="text-[#767676]">{race.player}</span>
                    </p>

                    <div className="mt-1 flex items-center space-x-2">
                      <img src={b1} alt="Ball 1" className="w-5 h-5 object-contain" />
                      <img src={b2} alt="Ball 2" className="w-5 h-5 object-contain" />
                      <img src={b3} alt="Ball 3" className="w-5 h-5 object-contain" />
                      <img src={b4} alt="Ball 4" className="w-5 h-5 object-contain" />
                      <img src={b5} alt="Ball 5" className="w-5 h-5 object-contain" />
                    </div>

                  </div>
                </div>
                <span className="text-white-400 text-lg">&gt;</span>
              </div>
            ))
          )}
        </div>

        {/* ----- Championship ----- */}
         <div className="relative rounded-2xl p-4 shadow border border-gray-800 flex flex-col justify-between overflow-hidden">
  {/* 🎨 Updated gradient — 20% purple then fade to black */}
  <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(69,38,140,0.5)_0%,_rgba(69,38,140,0.5)_20%,_rgba(0,0,0,1)_100%)]"></div>

  <div className="relative z-10">
    <h2 className="text-sm font-semibold mb-1 text-white">
      October speed championship
    </h2>
    <p className="text-xs text-gray-400 mb-3">Sponsored by pinballrace.com</p>

    {/* Info boxes */}
    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
      {/* 🗓 Left box (Days Left) */}
      <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-start text-left">
        <div className="flex items-center justify-start space-x-2 mb-1">
          <img
            src={calendar}
            alt="Calendar Icon"
            className="w-5 h-5 object-contain"
          />
          <span className="text-base font-semibold text-white">12 Days</span>
        </div>
        <span className="text-gray-400 text-xs ml-6">Left</span>
      </div>

      {/* 👥 Participants */}
      <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-start text-left">
        <div className="flex items-center justify-start space-x-2 mb-1">
          <img
            src={contact}
            alt="Contact Icon"
            className="w-5 h-5 object-contain"
          />
          <span className="text-base font-semibold text-white">47</span>
        </div>
        <span className="text-gray-400 text-xs ml-6">Participants</span>
      </div>

      {/* 🏆 Gift card prize */}
      <div className="col-span-2 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-start text-left">
        <div className="flex items-center justify-start space-x-2 mb-1">
          <img
            src={cup}
            alt="Trophy Icon"
            className="w-5 h-5 object-contain"
          />
          <span className="text-base font-semibold text-white">$320</span>
        </div>
        <span className="text-gray-400 text-xs ml-6">Gift card prize</span>
      </div>
    </div>
  </div>
</div>



</div>


      {showModal && <JoinRaceModal onClose={() => setShowModal(false)}     
      gameType={currentGameType}
      gameNumber={currentGameNumber} />}
    </div>
  );
};

export default RaceDashboard;




