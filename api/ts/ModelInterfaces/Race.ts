import { Winner } from "./Game";

export interface Race {
  status: "Unfinished" | "Finished";
  gameId: string;
  winners: Winner[];
  timer: number;
  typedBalls?: string;
  startedAt: number;
  endedAt: number;
}
