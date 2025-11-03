import React, { useState } from "react";
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
}

const JoinRaceModal: React.FC<JoinRaceModalProps> = ({ onClose }) => {
  const [selectedBall, setSelectedBall] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-[#1a1a1a] w-[90%] sm:w-[420px] rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <div>
            <h2 className="text-white font-semibold text-lg">Join race</h2>
            <p className="text-gray-400 text-xs">
              Select one ball (1–15) for race{" "}
              <span className="text-indigo-400">#18092501</span>.
              Entry closes 30 seconds before start time.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Game Type */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-White-300 text-sm mb-1">Game type</h3>
            <p className="text-gray-400 text-sm">
              Type chosen for your game is:{" "}
              <span className="text-indigo-400 font-medium">Eliminator</span>
            </p>
          </div>

          {/* Ball Grid */}
          <div className="grid grid-cols-5 gap-3 justify-items-center">
            {balls.map((ball) => (
              <div
                key={ball.id}
                onClick={() => setSelectedBall(ball.id)}
                className={`rounded-xl overflow-hidden cursor-pointer border-2 transition 
                  ${selectedBall === ball.id ? "border-indigo-500" : "border-transparent"}`}
              >
                <img
                  src={ball.img}
                  alt={`Ball ${ball.id}`}
                  className="object-cover w-16 h-16 sm:w-20 sm:h-20 rounded-lg"
                />

              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t border-gray-800 bg-[#111] space-x-4">
          <button
            onClick={onClose}
            className="text-white-400 hover:text-white transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold text-white transition 
              ${selectedBall ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-700 cursor-not-allowed"}`}
            disabled={!selectedBall}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRaceModal;







