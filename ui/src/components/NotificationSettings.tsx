"use client";

import { useState } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
      checked ? "bg-[#8b5cf6]" : "bg-gray-700"
    }`}
    role="switch"
    aria-checked={checked}
    style={{ transition: "background-color 0.2s, transform 0.2s" }}
  >
    <span className="sr-only">Toggle notification</span>
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
      style={{
        transition: "transform 0.2s ease-in-out",
        marginTop: "1px",
      }}
    />
  </button>
);

const NotificationSettings: React.FC = () => {
  const [raceReminders, setRaceReminders] = useState(true);
  const [raceResults, setRaceResults] = useState(true);
  const [competitionUpdates, setCompetitionUpdates] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  const notificationOptions = [
    {
      title: "Race Reminders",
      description: "Get notified a few minutes before the race starts.",
      state: raceReminders,
      setter: setRaceReminders,
    },
    {
      title: "Race Results",
      description: "Instant updates when new race results are available.",
      state: raceResults,
      setter: setRaceResults,
    },
    {
      title: "Competition Updates",
      description: "Stay informed about new challenges and event winners.",
      state: competitionUpdates,
      setter: setCompetitionUpdates,
    },
    {
      title: "Weekly Summary",
      description: "Receive a short summary of your weekly race performance.",
      state: weeklySummary,
      setter: setWeeklySummary,
    },
  ];

  return (
    <div className="w-full max-w-md bg-[#1c1c21] rounded-2xl shadow-xl p-4 sm:p-6">
      <h2 className="text-lg font-bold text-white mb-5 pl-2">
        Notifications & alerts
      </h2>

      <div className="space-y-3">
        {notificationOptions.map((option, index) => (
          <div
            key={index}
            className="bg-[#2a2a2e] p-4 rounded-xl flex items-center justify-between min-h-[65px]"
          >
            <div className="flex-1 pr-3">
              <p className="text-sm font-semibold text-white mb-0.5">
                {option.title}
              </p>
              <p className="text-[13px] text-gray-400 leading-snug line-clamp-2 max-w-[90%]">
                {option.description}
              </p>
            </div>

            <div className="flex-shrink-0 ml-2">
              <ToggleSwitch
                checked={option.state}
                onChange={() => option.setter(!option.state)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
