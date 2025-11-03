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
  points: number;
  numberOfWins: number;
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
