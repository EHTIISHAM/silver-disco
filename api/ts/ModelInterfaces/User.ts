export interface PointsEntry {
  points: number;
  timestamp: number;
}

export interface WinsEntry {
  wins: number;
  timestamp: number;
}

export interface User {
  userType: "User" | "Admin";
  email: string;
  username: string;
  password: string;
  pfp: string;
  csrfToken: string;
  clientToken: string;
  refreshToken: string;
  consented: boolean;
  points: PointsEntry[]; 
  numberOfWins: WinsEntry[];
  googleId?: string;
  tiktokId?: string;
  twitchId?: string;
  createdAt: number;
  connectedAccounts: {
    google: boolean;
    tiktok: boolean;
    twitch: boolean;
  };
}
