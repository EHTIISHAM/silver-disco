import { IncomingMessage, Server, ServerResponse } from "http";
import { Server as socketioServer } from "socket.io";
import games from "./socket_namespaces/games";
import leaderboardNamespace from "./socket_namespaces/leaderboard";

export default function (
  server: Server<typeof IncomingMessage, typeof ServerResponse>
) {
  const io = new socketioServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // ✅ Games namespace
  const gamesNsp = io.of("/games");
  games(gamesNsp);

  // ✅ Leaderboard namespace
  const leaderboardNsp = io.of("/leaderboard");
  leaderboardNamespace(leaderboardNsp);
}










// import { IncomingMessage, Server, ServerResponse } from "http";
// import { Server as socketioServer } from "socket.io";
// import games from "./socket_namespaces/games";

// export default function (
//   server: Server<typeof IncomingMessage, typeof ServerResponse>
// ) {
//   const io = new socketioServer(server, {
//     cors: {
//       origin: process.env.CLIENT_URL,
//       credentials: true,
//     },
//   });

//   const raceConnections = io.of("/games");
//   games(raceConnections);
// }


