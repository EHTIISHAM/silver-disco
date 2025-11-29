"use client";
import { useState, useEffect } from "react";
import { X, User } from "lucide-react";

interface UserData {
  _id: string;
  username?: string;
  email?: string;
  clientToken?: string;
  connectedAccounts?: {
    google: boolean;
    tiktok: boolean;
    twitch: boolean;
  };
}

const EditProfileModal = ({ onClose = () => {}, onUpdate = () => {}, userData }: { onClose?: () => void; onUpdate?: () => void; userData: UserData }) => {
  const [userName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {

    setDisplayName(userData.username ?? "");
    setEmail(userData.email ?? "");
  }, [userData]);

  const handleUpdate = () => {
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c22] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Edit profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </header>

        {/* Body */}
        <div className="p-4 space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <button className="bg-[#2b2b36] text-gray-300 text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#3b3b46] transition">
              Change profile
            </button>
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1">
              User name
            </label>
            <div className="relative">
              <input
                type="text"
                value={userName}
                readOnly
                className="w-full bg-[#2b2b36] text-white p-3 rounded-xl border border-gray-700 focus:outline-none pr-28"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 text-sm font-medium px-2 py-1 hover:text-purple-300">
                Request edit
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#2b2b36] text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-400 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2b2b36] text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-end p-4 space-x-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="text-gray-400 font-semibold px-4 py-2 rounded-lg hover:bg-[#2b2b36] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Update
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditProfileModal;
