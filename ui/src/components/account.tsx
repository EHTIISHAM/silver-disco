"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  Edit2,
  User,
  Flag,
  Clock,
  Award,
  Trophy,
  LogOut,
  Globe,
  Video,
  MessageSquare,
} from "lucide-react";

import EditProfileModal from "./EditProfileModal";
import NotificationSettings from "./NotificationSettings";
import SecuritySettings from "./SecuritySettings";
import axios from "axios";


interface Stat {
  icon: React.ElementType;
  value: number;
  label: string;
  color?: string;
}

interface ConnectedAccount {
  name: string;
  icon: React.ElementType;
  status: string;
  action: string;
  actionColor: string;
}

interface UserData {
  username?: string;
  email?: string;
  clientToken?: string;
  connectedAccounts?: {
    google: boolean;
    tiktok: boolean;
    twitch: boolean;
  };
}

interface StatsData {
  totalRaces: number;
  points: number;
  totalWins: number;
  streak?: number;
  finishRate?: number;
  weeklyPoints: { name: string; points: number }[];
}



const AccountScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
 
  const [loading, setLoading] = useState(true);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  const logout = async () => {
    try {
      await axios.post(`${serverUrl}/unrestricted/logout`, {}, { withCredentials: true });
      // Redirect to login page
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Fetch user data and stats
  useEffect(() => {
  const fetchUserAndStats = async () => {
    try {
      // Fetch user info
      const userRes = await fetch(`${serverUrl}/api/user/me`, {
        credentials: "include",
      });
      const userJson = await userRes.json();
      if (userJson.user) setUserData(userJson.user);

      // Fetch stats for logged-in usersendinf useremail
      const statsRes = await fetch(`${import.meta.env.VITE_PY_SERVER_URL}/api/user/stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userJson.user._id }),
      });
      const statsJson: StatsData = await statsRes.json();

      // Map stats to frontend Stat[]
      setStats([
        { icon: Flag, value: statsJson.totalRaces ?? 0, label: "Races" },
        { icon: Clock, value: statsJson.points ?? 0, label: "Points", color: "text-green-400" },
        { icon: Award, value: statsJson.streak ?? 0, label: "Streak" },
        { icon: Trophy, value: statsJson.totalWins ?? 0, label: "Wins" },
      ]);


      
    } catch (err) {
      console.error("Failed to fetch user or stats:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchUserAndStats();
}, []);


  // Handle connect/disconnect actions
  const handleAction = async (platform: string, action: string) => {
    if (action === "Connect") {
      switch (platform.toLowerCase()) {
        case "google":
          window.location.href = `${serverUrl}/auth/google`;
          break;
        case "tiktok":
          window.location.href = `${serverUrl}/authenticate_tiktok`;
          break;
        case "twitch":
          window.location.href = `${serverUrl}/unrestricted/twitch`;
          break;
      }
      return;
    }

    // Disconnect
    try {
      await fetch(`${serverUrl}/api/user/disconnect/${platform.toLowerCase()}`, {
        method: "POST",
        credentials: "include",
      });

      setUserData((prev) =>
        prev
          ? {
              ...prev,
              connectedAccounts: {
                google: platform === "Google" ? false : prev.connectedAccounts?.google ?? false,
                tiktok: platform === "TikTok" ? false : prev.connectedAccounts?.tiktok ?? false,
                twitch: platform === "Twitch" ? false : prev.connectedAccounts?.twitch ?? false,
              },
            }
          : prev
      );
    } catch (err) {
      console.error(`Failed to disconnect ${platform}:`, err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-400">Loading account...</div>;
  }

  if (!userData) {
    return <div className="flex justify-center items-center h-screen text-gray-400">No user data found.</div>;
  }

  const connectedAccounts: ConnectedAccount[] = [
    {
      name: "Google",
      icon: Globe,
      status: userData.connectedAccounts?.google ? "Connected" : "Not Connected",
      action: userData.connectedAccounts?.google ? "Disconnect" : "Connect",
      actionColor: userData.connectedAccounts?.google ? "bg-red-700 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-500",
    },
    {
      name: "TikTok",
      icon: Video,
      status: userData.connectedAccounts?.tiktok ? "Connected" : "Not Connected",
      action: userData.connectedAccounts?.tiktok ? "Disconnect" : "Connect",
      actionColor: userData.connectedAccounts?.tiktok ? "bg-red-700 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-500",
    },
    {
      name: "Twitch",
      icon: MessageSquare,
      status: userData.connectedAccounts?.twitch ? "Connected" : "Not Connected",
      action: userData.connectedAccounts?.twitch ? "Disconnect" : "Connect",
      actionColor: userData.connectedAccounts?.twitch ? "bg-red-700 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <ArrowLeft size={24} className="text-white cursor-pointer" />
          <h1 className="text-xl font-bold">Account</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Search size={20} className="text-white cursor-pointer" />
          <Bell size={20} className="text-white cursor-pointer" />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-[#1c1c22] rounded-xl p-1 mb-8 w-full max-w-sm">
        {["Profile", "Notifications", "Security"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-[#2b2b36]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <>
          {/* Profile Info */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Profile information</h2>
              <Edit2 size={18} className="text-purple-400 cursor-pointer hover:text-purple-300 transition" onClick={() => setShowModal(true)} />
            </div>

            <div className="bg-[#1c1c22] p-4 rounded-xl flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-4">
                <User size={24} />
              </div>
              <div>
                <p className="text-lg font-semibold">{userData.username}</p>
                <p className="text-sm text-gray-400">{userData.email}</p>
              </div>
              <p className="ml-auto text-sm text-gray-500 hidden sm:block">ID: {userData.clientToken}</p>
            </div>

            {/* Stats */}
            { (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Flag, value: stats[0]?.value ?? 0, label: "Races" },
                  { icon: Clock, value: stats[1]?.value ?? 0, label: "Points", color: "text-green-400" },
                  { icon: Award, value: stats[2]?.value ?? 0, label: "Streak" },
                  { icon: Trophy, value: stats[3]?.value ?? 0, label: "Wins" },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-[#1c1c22] p-4 rounded-xl flex items-center space-x-3">
                      <Icon size={20} className={stat.color || "text-purple-400"} />
                      <div>
                        <p className={`text-lg font-semibold ${stat.color || "text-white"}`}>{stat.value}</p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            )}
          </div>

          

          {/* Connected Accounts */}
          <div className="mb-10 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Connected accounts</h2>
            {connectedAccounts.map((account, index) => {
              const Icon = account.icon;
              return (
                <div key={index} className={`flex justify-between items-center py-3 ${index < connectedAccounts.length - 1 ? "border-b border-gray-800" : ""}`}>
                  <div className="flex items-center space-x-3">
                    <Icon size={20} className="text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{account.name}</p>
                      <p className="text-sm text-gray-400">{account.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(account.name, account.action)}
                    className={`text-white text-sm px-4 py-2 rounded-lg font-medium transition ${account.actionColor}`}
                  >
                    {account.action}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Logout */}
          <div className="flex justify-center mt-6">
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-red-500 font-semibold text-lg p-3 rounded-xl hover:bg-[#1c1c22] transition"
            >
              <LogOut size={20} />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}

      {/* Notifications */}
      {activeTab === "Notifications" && <NotificationSettings />}

      {/* Security */}
      {activeTab === "Security" && <SecuritySettings />}

      {/* Edit Profile Modal */}
      {showModal && <EditProfileModal onClose={() => setShowModal(false)} onUpdate={() => setShowModal(false)} />}
    </div>
  );
};

export default AccountScreen;
