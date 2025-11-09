import React, { useState,useEffect  } from "react";
import { X } from "lucide-react";

import Ball1 from "../assets/balls/1.png";
import Ball2 from "../assets/balls/2.png";
import Ball3 from "../assets/balls/3.png";
import Ball4 from "../assets/balls/4.png";
import Ball5 from "../assets/balls/5.png";
import Ball6 from "../assets/balls/6.png";
import Ball7 from "../assets/balls/7.png";
import Ball8 from "../assets/balls/8.png";
import Ball9 from "../assets/balls/9.png";
import Ball10 from "../assets/balls/10.png";
import Ball11 from "../assets/balls/11.png";
import Ball12 from "../assets/balls/12.png";
import Ball13 from "../assets/balls/13.png";
import Ball14 from "../assets/balls/14.png";
import Ball15 from "../assets/balls/15.png";

const importedBalls = [
  Ball1, Ball2, Ball3, Ball4, Ball5,
  Ball6, Ball7, Ball8, Ball9, Ball10,
  Ball11, Ball12, Ball13, Ball14, Ball15,
];

const balls = importedBalls.map((img, index) => ({
  id: index + 1,
  img,
}));

interface JoinRaceModalProps {
  onClose: () => void;
  gameType: string;
  gameNumber: string;
}

const JoinRaceModal: React.FC<JoinRaceModalProps> = ({ onClose, gameType, gameNumber }) => {
  const [selectedBall, setSelectedBall] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const serverUrl = import.meta.env.VITE_PY_SERVER_URL;
  const serverurl1 = import.meta.env.VITE_SERVER_URL

  // Fetch user email on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${serverurl1}/api/user/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data?.user?.email) setUserEmail(data.user.email);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, [serverurl1]);

  const handleJoin = async () => {
    if (!selectedBall || !userEmail) return;

      try {
        const res = await fetch(
        `${serverUrl}/api/games/join?email=${encodeURIComponent(userEmail)}&ball=${selectedBall}`,
        {
            method: "GET",
            credentials: "include",
        }
        );

if (!res.ok) {
        let errorDetail = "Failed to join race";
        
        // Attempt to parse the response body, which usually contains the error details (like the FastAPI 'detail')
        try {
            const errorBody = await res.json();
            // Assuming FastAPI error format { "detail": "User already joined the game" }
            if (errorBody && errorBody.detail) {
                errorDetail = errorBody.detail;
            } else {
                // Fallback for non-JSON or unexpected structure
                errorDetail = `Server returned status ${res.status}`;
            }
        } catch (e) {
            // Handle case where response is not JSON (e.g., plain text 500 error)
            errorDetail = `Request failed with status ${res.status}`;
        }
        
        // Throw an error that contains the specific error message
        throw new Error(errorDetail); 
    }
      const result = await res.json();
      console.log("Joined successfully:", result);
      alert("Successfully joined the race!");
      onClose(); // Close modal after join
    } catch (err) {
        alert("Error Joining the Race")
}
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-[#1a1a1a] w-[90%] sm:w-[420px] rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#1a1a1a]">
          <div>
            <h2 className="text-white font-semibold text-lg">Join race</h2>
            <p className="text-gray-400 text-xs">
              Select one ball (1–15) for race{" "}
              {gameNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        <div>
        {/* Game Type */}
        <div className="p-4 bg-[#1f1f1f] flex items-center justify-between">
        {/* Left side */}
        <div className="flex flex-col">
          <h3 className="text-white-400 text-sm mb-1">Game type</h3>
          <p className="text-gray-400 text-sm">Type chosen for your game is:</p>
        </div>

        {/* Right side */}
        <div className="flex items-center">
          <span className="text-indigo-400 font-semibold text-base">{gameType}</span>
        </div>
        </div>
 


          {/* Ball Grid */}
          <div className="grid grid-cols-5 gap-3 justify-items-center bg-[#1f1f1f] p-2 rounded-lg">
            {balls.map((ball) => (
              <div
                key={ball.id}
                onClick={() => setSelectedBall(ball.id)}
                className={`rounded-xl overflow-hidden cursor-pointer border-2 transition 
                  ${selectedBall === ball.id
                    ? "border-white-500"
                    : "border-transparent"
                  }`}
              >
                <img
                    src={ball.img}
                    alt={`Ball ${ball.id}`}
                    // Use the 16.5 classes for a precise match to 65.6px (66px)
                    className="object-cover w-16.5 h-16.5 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t border-gray-800 bg-[#1a1a1a] space-x-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold text-white transition 
              ${selectedBall
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-700 cursor-not-allowed"
              }`}
            disabled={!selectedBall || !userEmail}
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRaceModal;







