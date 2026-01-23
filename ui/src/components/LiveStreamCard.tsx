import React, { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import tiktokConfig from "../../../api/config/tiktok.json";
import pgicon from "../assets/pinballraceIcon.png";
import JoinRaceModal from "../components/JoinRaceModaloffline";

const LiveStreamCard: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isRaceModalOpen, setIsRaceModalOpen] = useState(false);
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/tiktok-status?username=${tiktokConfig.username}`);
        const data = await res.json();

        if (data.isLive) {
          setVideoUrl(data.liveUrl);
          setIsLive(true);
        } else {
          setVideoUrl(tiktokConfig.fallbackVideoUrl);
          setIsLive(false);
        }
      } catch (error) {
        console.error("Failed to fetch TikTok live status:", error);
        setVideoUrl(tiktokConfig.fallbackVideoUrl);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFollow = () => {
    window.open(`https://www.tiktok.com/@${tiktokConfig.username}`, "_blank");
  };


  if (loading)
    return <div className="text-gray-400 text-center py-6">Checking TikTok live status...</div>;

  return (
    <div className="w-full flex justify-center px-3 sm:px-6">
      <div className="w-full max-w-6xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
        {/* 🟥 Header bar with status + viewers */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#141414] border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <span
              className={`${
                isLive ? "bg-red-600" : "bg-gray-600"
              } text-[11px] sm:text-sm font-bold px-2 py-1 rounded-full`}
            >
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-full text-gray-300 text-xs sm:text-sm">
            <FaUser size={12} />
            <span>{isLive ? "Live Now" : "Offline"}</span>
          </div>
        </div>

        {/* 🌗 Main layout */}
        <div className="flex flex-col md:flex-row">
          {/* LEFT: video section */}
          <div className="md:w-2/3 lg:w-3/5 bg-black flex justify-center items-start p-4">
            <div className="w-full max-w-[720px] bg-black rounded-lg relative">
            <div
            className="hidden md:block w-full h-[640px] overflow-hidden rounded-md border border-gray-800"
            style={{
                background: "#000",
            }}
            >
            <div className="flex justify-center items-center h-full">
                <iframe
                src={videoUrl ?? ""}
                title="TikTok Live or Fallback Video"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="w-[360px] h-[640px] rounded-md border-0"
                style={{
                    background: "black",
                    display: "block",
                }}
                />
            </div>
            </div>
              {/* Mobile vertical video */}
              <div className="block md:hidden w-full">
                <div className="w-full flex justify-center py-3 px-2">
                  <iframe
                    src={videoUrl ?? ""}
                    title="TikTok Live or Fallback Video"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full max-w-[420px] aspect-[9/16] rounded-md border border-gray-800"
                    style={{ background: "black" }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Info section */}
          <div className="md:w-1/3 lg:w-2/5 p-4 sm:p-6 bg-gradient-to-tr from-black via-[#080808] to-[#0b0711]">
            <div className="text-white">
              <h3 className="text-lg sm:text-xl font-extrabold mb-2">
                Pinball Race — Live Stream
              </h3>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={pgicon}
                    alt="Pinball Race Icon"
                    className="w-8 h-8 rounded-full bg-white p-1 object-contain"
                    style={{
                        transform: "translateY(1px) translateX(2px)", // fine-tune vertical alignment
                    }}
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">@{tiktokConfig.username}</div>
                    <div className="text-xs text-gray-400">Pinball Race</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                {isLive
                  ? "Join the Pinball Race live now — chat, compete, and enjoy the action!"
                  : "Currently offline. Watch the featured TikTok clip or check back when we go live."}
              </p>

<div className="flex justify-center mb-4 w-full">
                {isLive ? (
                  <button
                    onClick={handleFollow}
                    className="bg-indigo-600 hover:bg-indigo-700 transition text-white py-2 px-6 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20"
                  >
                    Follow on TikTok
                  </button>
                ) : (
                  <>
                    <button
                      className="w-full bg-[#121212] text-white font-semibold py-2 rounded-3xl border border-[#522cab] hover:border-blue-600 hover:bg-[#0a0a0a] transition shadow-[0_0_15px_rgba(82,44,171,0.3)]"
                      onClick={() => setIsRaceModalOpen(true)}
                    >
                      Join Non Live Games
                    </button>
                    
                    {isRaceModalOpen && (
                      <JoinRaceModal 
                        onClose={() => setIsRaceModalOpen(false)}
                      />
                    )}
                  </>
                )}
              </div>

               <div className="mt-6 text-xs text-gray-600">© {new Date().getFullYear()} Pinball Race</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamCard;


