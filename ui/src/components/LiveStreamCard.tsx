import React, { useEffect, useState } from "react";
import demo from "../assets/demo.mp4";

const LiveStreamCard: React.FC = () => {
  const [isLive, setIsLive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const serverUrl = import.meta.env.VITE_PY_SERVER_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${serverUrl}/is_live`);
        const data = await res.json();
        setIsLive(data.is_live);
      } catch (error) {
        console.error("Failed to fetch live status:", error);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  if (loading) return null;

  return (
    <>
      <div className="flex justify-center items-center w-full p-4">
        {/* Simple Square Box Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          
          {/* Top Left Status Indicator */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-sm border border-gray-700/50 shadow-lg">
            <span 
              className={`w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : "bg-gray-500"
              }`} 
            />
            <span className="text-white text-xs font-bold tracking-wider">
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Media Player */}
          {isLive ? (
            <iframe
              src="https://www.tiktok.com/embed/v2/live/@pinballrace?autoplay=1&muted=1"
              title="TikTok Live"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full object-cover"
              style={{ background: "black" }}
            />
          ) : (
            <video
              src={demo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Clickable overlay to send users to the actual TikTok app/site when live */}
          {isLive && (
            <a 
              href="https://www.tiktok.com/@pinballrace/live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 z-20 cursor-pointer"
              aria-label="Watch live on TikTok"
              title="Watch live on TikTok"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default LiveStreamCard;