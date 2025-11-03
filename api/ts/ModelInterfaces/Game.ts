export interface Winner {
  winnerId: string;
  winnerName: string;
  ball: string;
  position: string; // 1st, 2nd, 3rd, etc.
  pointsEarned?: number | undefined;
}

export interface Participant {
  participantId: string;
  participantName: string;
  ball: string;
}

export interface Attempter {
  attempterId: string;
  attempterName: string;
  ball: string;
}

export interface Game {
  status: "Not Started" | "Ongoing" | "Finished";
  gameType: "Regular" | "Lottery" | "Elimination";
  gameNumber: number;
  numberOfBalls: number;
  regularBalls: number | undefined;
  bonusBalls: number | undefined;
  prizeId: string;
  timerPerRace: string;
  timerTillNextGame: string;
  participants: Participant[];
  kicked: string[];
  attempters: Attempter[];
  winners: Winner[];
  createdAt: number;
  endedAt: number;
}
