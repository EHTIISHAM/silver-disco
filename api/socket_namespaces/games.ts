import { decode } from "jsonwebtoken";
import { Namespace, Socket } from "socket.io";
import User from "../models/User";
import Prize from "../models/Prize";
import verifyJwt from "../helpers/auth/verifyJwt";
import { Participant, Attempter, Winner } from "../ts/ModelInterfaces/Game";
import Game from "../models/Game";
import Race from "../models/Race";
import convertStringMinutesToMilliseconds from "../helpers/time/convertStringMinutesToMilliseconds";
import { cloneDeep, isEqual } from "lodash";
import PastWinners from "../models/PastWinner";
import { randomBytes } from "crypto";
import { createTransport } from "nodemailer";
import { readFileSync } from "fs";
import splitArrayByIndex from "../helpers/data/splitArrayByIndex";

function allSameValue(arr: any, valueToCheck: string) {
  // Check each element and subelement recursively
  function check(level: any, subArr: any) {
    for (const element of subArr) {
      if (Array.isArray(element)) {
        // It's a subarray, recurse deeper
        if (!check(level + 1, element)) {
          return false;
        }
      } else if (element !== valueToCheck) {
        return false;
      }
    }
    return true;
  }

  return check(1, arr); // Start checking from the second level
}

function hasStrings(arr: any[]): any {
  return arr.some((item) => {
    if (Array.isArray(item)) {
      return hasStrings(item);
    } else {
      return typeof item === "string";
    }
  });
}

function countOccurrences(arr: any, target: any) {
  let count = 0;
  arr.forEach((item: any) => {
    if (Array.isArray(item)) {
      count += countOccurrences(item, target);
    } else if (item === target) {
      count++;
    }
  });
  return count;
}

function getOccurrences(arr: any, target: any) {
  let targetCount = countOccurrences(arr, target);
  return targetCount;
}

function choose(n: number, k: number): number {
  if (k == 0) {
    return 1;
  }

  return (n * choose(n - 1, k - 1)) / k;
}

const updateAdmin = async (socket: any) => {
  const prizes = await Prize.find();
  const currentGame = await Game.findOne({ status: "Ongoing" });
  let currentGameRaces;
  const nextGame = await Game.findOne({ status: "Not Started" });
  const pastWinners = await PastWinners.find();
  let currentRace = 0;
  let timer = 0;

  if (currentGame) {
    const races = await Race.find({
      gameId: currentGame._id.toString(),
    })
      .sort({
        timer: "descending",
      })
      .exec();

    if (races.length > 0) {
      const timestamp = Date.now();

      races[0].timer >= timestamp
        ? (timer = Math.round((races[0].timer - timestamp) / 1000))
        : 0;
    }

    currentRace = races.length;
  }

  if (currentGame) {
    currentGameRaces = await Race.find({
      gameId: currentGame._id.toString(),
    });
  }

  const users = await User.find()
    .select("-password")
    .select("-password")
    .select("-email")
    .select("-csrfToken")
    .select("-clientToken")
    .select("-refreshToken")
    .select("-consented");

  socket.emit("adminData", {
    prizes: prizes,
    currentGame: currentGame,
    users: users,
    currentRace: currentRace,
    nextGame: nextGame,
    pastWinners: pastWinners,
    currentTimer: timer,
    currentGameRaces: currentGameRaces,
  });
};

const updatePlayer = async (socket: any) => {
  const prizes = await Prize.find();
  const currentGame = await Game.findOne({ status: "Ongoing" });
  let currentGameRaces;
  const nextGame = await Game.findOne({ status: "Not Started" });
  let currentRace = 1;

  const verified = await verifyJwt(socket.handshake.auth.token);

  if (verified) {
    const userIdObj: any = decode(socket.handshake.auth.token);
    const userId = userIdObj._id;

    if (currentGame) {
      const races = await Race.find({
        gameId: currentGame._id.toString(),
      })
        .sort({
          timer: "descending",
        })
        .exec();

      currentRace = races.length;
    }

    const users = await User.find()
      .select("-password")
      .select("-email")
      .select("-csrfToken")
      .select("-clientToken")
      .select("-refreshToken")
      .select("-consented")
      .sort({
        points: "descending",
      });

    let currentMaxPlayers;
    let nextGameMaxPlayers;

    if (currentGame) {
      if (
        currentGame.gameType === "Elimination" ||
        currentGame.gameType === "Regular"
      ) {
        currentMaxPlayers = 12;
      }
    }

    if (nextGame) {
      if (
        nextGame.gameType === "Elimination" ||
        nextGame.gameType === "Regular"
      ) {
        nextGameMaxPlayers = 12;
      }
    }

    const previousGames = await Game.find({
      status: "Finished",
    })
      .sort({
        endedAt: "descending",
      })
      .exec();

    let previousGame;
    let previousGameRaces;

    previousGames.length > 0 ? (previousGame = previousGames[0]) : null;

    if (previousGame) {
      previousGameRaces = await Race.find({
        gameId: previousGame._id.toString(),
      });
    }

    if (currentGame) {
      currentGameRaces = await Race.find({
        gameId: currentGame._id.toString(),
      });
    }

    let ball = "0";

    if (nextGame) {
      if (nextGame.participants.length > 0) {
        for (let i = 0; i < nextGame.participants.length; i++) {
          const participant = nextGame.participants[i];
          if (participant.participantId === userId) {
            ball = participant.ball;
          }
        }
      }
    }

    socket.emit("playerData", {
      prizes: prizes,
      currentGame: currentGame,
      users: users,
      currentRace: currentRace,
      nextGame: nextGame,
      currentMaxPlayers: currentMaxPlayers,
      nextGameMaxPlayers: nextGameMaxPlayers,
      previousGame: previousGame,
      previousGameRaces: previousGameRaces,
      currentGameRaces: currentGameRaces,
      ball: ball,
    });
  }
};

export default function (io: Namespace) {
  try {
    io.on("connection", async (socket) => {
      if (socket.handshake) {
        if ("token" in socket.handshake.auth) {
          const verified = await verifyJwt(socket.handshake.auth.token);

          if (verified) {
            const userId = decode(socket.handshake.auth.token);

            const user = await User.findOne({
              _id: userId,
              userType: "User",
            });

            if (user) {
              updatePlayer(socket);

              socket.on("joinGame", async (data) => {
                try {
                  const game = await Game.findOne({ _id: data.nextGameId });

                  if (game) {
                    if (
                      game.gameType === "Regular" ||
                      game.gameType === "Elimination"
                    ) {
                      if (
                        game.participants.length < 12 &&
                        game.kicked.includes(user._id.toString()) === false
                      ) {
                        let newParticipants = cloneDeep(game.participants);

                        newParticipants.push({
                          participantId: user._id.toString(),
                          participantName: user.username,
                          ball: `${newParticipants.length + 1}`,
                        });

                        socket.emit("playerJoined", {
                          participantId: user._id.toString(),
                          participantName: user.username,
                          ball: `${newParticipants.length}`,
                          gameNumber: game.gameNumber,
                        });

                        newParticipants = newParticipants.filter(
                          (value, index, self) =>
                            index ===
                            self.findIndex(
                              (t) => t.participantId === value.participantId
                            )
                        );

                        await Game.findOneAndUpdate(
                          {
                            _id: game._id,
                          },
                          {
                            participants: newParticipants,
                          }
                        );
                      } else {
                        const newKicked = cloneDeep(game.kicked);

                        socket.emit("playerNotJoined");

                        newKicked.push(user._id.toString());

                        await Game.findOneAndUpdate(
                          {
                            _id: game._id,
                          },
                          {
                            kicked: newKicked,
                          }
                        );
                      }
                    }

                    let attempters = cloneDeep(game.attempters);

                    attempters.push({
                      attempterId: user._id.toString(),
                      attempterName: user.username,
                      ball: `${attempters.length + 1}`,
                    });

                    attempters = attempters.filter(
                      (value, index, self) =>
                        index ===
                        self.findIndex(
                          (t) => t.attempterId === value.attempterId
                        )
                    );

                    await Game.findOneAndUpdate(
                      {
                        _id: game._id,
                      },
                      {
                        attempters: attempters,
                      }
                    );
                  }
                } catch (e) {
                  console.error(e);
                }
              });

              socket.on("joinLotteryGame", async (data) => {
                try {
                  const game = await Game.findOne({ _id: data.nextGameId });

                  if (game) {
                    let balls: string = data.balls.slice(0, -1);
                    let comboExists = false;

                    if (
                      game.participants.length > 0 &&
                      game.participants.length < choose(12, game.numberOfBalls)
                    ) {
                      for (let i = 0; i < game.participants.length; i++) {
                        const participant = game.participants[i];

                        const arrayBalls = balls
                          .split(",")
                          .map((number) => {
                            return parseInt(number);
                          })
                          .sort((a, b) => b - a);
                        const arrayParticipantBalls = participant.ball
                          .split(",")
                          .map((number) => {
                            return parseInt(number);
                          })
                          .sort((a, b) => b - a);

                        if (isEqual(arrayBalls, arrayParticipantBalls)) {
                          comboExists = true;
                        }
                      }

                      if (!comboExists) {
                        let participants = cloneDeep(game.participants);

                        participants.push({
                          ball: balls,
                          participantId: user._id.toString(),
                          participantName: user.username,
                        });

                        participants = participants.filter(
                          (value, index, self) =>
                            index ===
                            self.findIndex(
                              (t) => t.participantId === value.participantId
                            )
                        );

                        await Game.findOneAndUpdate(
                          {
                            _id: game._id,
                          },
                          {
                            participants: participants,
                          }
                        );

                        socket.emit("playerJoined", {
                          ball: balls,
                          participantId: user._id.toString(),
                          participantName: user.username,
                          gameNumber: game.gameNumber,
                        });

                        socket.emit("added");
                      } else {
                        socket.emit("comboExists");
                      }
                    } else {
                      const participants = cloneDeep(game.participants);

                      participants.push({
                        ball: balls,
                        participantId: user._id.toString(),
                        participantName: user.username,
                      });

                      await Game.findOneAndUpdate(
                        {
                          _id: game._id,
                        },
                        {
                          participants: participants,
                        }
                      );

                      socket.emit("playerJoined", {
                        ball: balls,
                        participantId: user._id.toString(),
                        participantName: user.username,
                        gameNumber: game.gameNumber,
                      });
                      socket.emit("added");
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              });
            }
          }
        } else if ("adminToken" in socket.handshake.auth) {
          const verified = await verifyJwt(socket.handshake.auth.adminToken);

          if (verified) {
            const userId = decode(socket.handshake.auth.adminToken);

            const user = await User.findOne({
              _id: userId,
              userType: "Admin",
            });

            if (user) {
              updateAdmin(socket);

              socket.on("newPrize", async (data) => {
                if ("title" in data && "description" in data) {
                  const prize = await Prize.create({
                    title: data.title,
                    description: data.description,
                    image: "nofile.png",
                  });

                  socket.emit("newPrizeId", prize._id.toString());
                }
              });

              socket.on("newGame", async (data) => {
                if ("type" in data && "timer" in data && "prize" in data) {
                  const preDefined: Participant[] = [];

                  if ("preDefined" in data) {
                    const preDefinedArray: string[] =
                      data.preDefined.split(",");

                    for (let i = 0; i < preDefinedArray.length; i++) {
                      const string = preDefinedArray[i];

                      const participantExists = await User.findOne({
                        username: string,
                      });

                      if (participantExists) {
                        preDefined.push({
                          ball: `${i + 1}`,
                          participantName: participantExists.username,
                          participantId: participantExists._id.toString(),
                        });
                      }
                    }
                  }

                  const existingGame = await Game.findOne().or([
                    { status: "Ongoing" },
                  ]);

                  if (preDefined.length > 0) {
                    if (data.type !== "Lottery") {
                      const games = await Game.find();
                      try {
                        await Game.create({
                          status: "Not Started",
                          gameType: data.type,
                          gameNumber: games.length + 1,
                          prizeId: data.prize,
                          participants: preDefined,
                          timerPerRace: data.timer,
                          timerTillNextGame: data.gameTimer,
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  } else {
                    if (data.type !== "Lottery") {
                      const games = await Game.find();
                      try {
                        await Game.create({
                          status: "Not Started",
                          gameType: data.type,
                          gameNumber: games.length + 1,
                          prizeId: data.prize,
                          timerPerRace: data.timer,
                          timerTillNextGame: data.gameTimer,
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    } else {
                      if ("numberOfBallsPerSelection" in data) {
                        let numberOfBalls = parseInt(
                          data.numberOfBallsPerSelection
                        );

                        if ("bonusBalls" in data) {
                          numberOfBalls =
                            parseInt(data.numberOfBallsPerSelection) +
                            parseInt(data.bonusBalls);
                        }

                        const games = await Game.find();
                        try {
                          await Game.create({
                            status: "Not Started",
                            gameType: data.type,
                            gameNumber: games.length + 1,
                            numberOfBalls: numberOfBalls,
                            regularBalls: parseInt(
                              data.numberOfBallsPerSelection
                            ),
                            bonusBalls: parseInt(data.bonusBalls),
                            prizeId: data.prize,
                            timerPerRace: data.timer,
                            timerTillNextGame: data.gameTimer,
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }
                  }
                }
              });

              socket.on("beginRaces", async () => {
                const ongoing = await Game.find({ status: "Ongoing" });

                if (ongoing.length === 0) {
                  await Game.findOneAndUpdate(
                    {
                      status: "Not Started",
                    },
                    {
                      status: "Ongoing",
                    }
                  );
                }
              });

              socket.on("updateGame", async (data) => {
                try {
                  if ("_id" in data) {
                    const game = await Game.findOne({
                      _id: data._id,
                      status: "Ongoing",
                    })
                      .lean()
                      .exec();

                    const updateObject: any = {};

                    if (game) {
                      if ("kickedParticipants" in data) {
                        if (data.kickedParticipants.length > 0) {
                          let updatedParticipants = structuredClone(
                            game.participants
                          );

                          const kickedParticipants: any[] =
                            data.kickedParticipants;

                          for (let i = 0; i < kickedParticipants.length; i++) {
                            let participant = kickedParticipants[i];

                            kickedParticipants[i] = participant.replace(
                              ",kick",
                              ""
                            );
                            updatedParticipants.map(
                              (loopedParticipant: any, j: number) => {
                                if (
                                  loopedParticipant.participantId ===
                                  kickedParticipants[i]
                                ) {
                                  updatedParticipants.splice(j, 1);
                                }
                              }
                            );
                          }

                          updatedParticipants = updatedParticipants.filter(
                            (value: any, index, self) =>
                              index ===
                              self.findIndex(
                                (t: any) =>
                                  t.participantId === value.participantId
                              )
                          );

                          updateObject.participants = updatedParticipants;

                          await Game.findOneAndUpdate(
                            {
                              _id: game._id,
                            },
                            {
                              ...updateObject,
                            }
                          );
                        }
                      }

                      if ("addedParticipants" in data) {
                        if (data.addedParticipants.length > 0) {
                          let updatedParticipants = structuredClone(
                            game.participants
                          );

                          const addedParticipants: any[] =
                            data.addedParticipants;

                          for (let i = 0; i < addedParticipants.length; i++) {
                            let participant = addedParticipants[i];

                            addedParticipants[i] = participant.replace(
                              ",add",
                              ""
                            );

                            const user = await User.findOne({
                              _id: addedParticipants[i],
                            });

                            if (user) {
                              const currentBalls = updatedParticipants
                                .map((participant) => {
                                  return parseInt(participant.ball);
                                })
                                .sort((a, b) => a - b);

                              if (currentBalls.length > 0) {
                                let maxBall = Math.max.apply(
                                  Math,
                                  currentBalls
                                );

                                updatedParticipants.push({
                                  ball: `${maxBall + 1}`,
                                  participantId: user._id.toString(),
                                  participantName: user.username,
                                });
                              } else {
                                updatedParticipants.push({
                                  ball: `${1}`,
                                  participantId: user._id.toString(),
                                  participantName: user.username,
                                });
                              }
                            }
                          }

                          updatedParticipants = updatedParticipants.filter(
                            (value: any, index, self) =>
                              index ===
                              self.findIndex(
                                (t: any) =>
                                  t.participantId === value.participantId
                              )
                          );

                          updateObject.participants = updatedParticipants;

                          await Game.findOneAndUpdate(
                            {
                              _id: game._id,
                            },
                            {
                              ...updateObject,
                            }
                          );
                        }
                      }

                      if ("raceWinningBalls" in data) {
                        try {
                          const raceWinningBalls: number[] =
                            data.raceWinningBalls
                              .split(",")
                              .map((ball: string) => parseInt(ball));

                          const participants = structuredClone(
                            game.participants
                          );

                          if (
                            game.gameType === "Regular" &&
                            raceWinningBalls.length > 0
                          ) {
                            const winners: Winner[] = [];

                            for (let i = 0; i < raceWinningBalls.length; i++) {
                              const winningBall = raceWinningBalls[i];

                              const participantBalls = participants.filter(
                                (participant) =>
                                  parseInt(participant.ball) == winningBall
                              );

                              if (participantBalls.length > 0) {
                                winners.push({
                                  winnerId: participantBalls[0].participantId,
                                  winnerName:
                                    participantBalls[0].participantName,
                                  position: `${i + 1}`,
                                  ball: `${winningBall}`,
                                });
                              }
                            }

                            const unfinishedRaces = await Race.find({
                              gameId: game._id.toString(),
                              status: "Unfinished",
                            });

                            if (unfinishedRaces.length > 0) {
                              await Race.findOneAndUpdate(
                                {
                                  _id: unfinishedRaces[0]._id,
                                },
                                {
                                  status: "Finished",
                                  typedBalls: data.raceWinningBalls,
                                  winners: winners,
                                  endedAt: Date.now(),
                                }
                              );

                              await Game.findOneAndUpdate(
                                {
                                  _id: game._id,
                                },
                                {
                                  status: "Finished",
                                  winners: winners,
                                  endedAt: Date.now(),
                                }
                              );

                              if (winners.length > 0) {
                                for (let i = 0; i < winners.length; i++) {
                                  const winner = winners[i];

                                  const user = await User.findOne({
                                    _id: winner.winnerId,
                                  });

                                  if (winner.position == "1") {
                                    if (user) {
                                      await User.findOneAndUpdate(
                                        {
                                          _id: winner.winnerId,
                                        },
                                        {
                                          points:
                                            user.points +
                                            12 -
                                            parseInt(winner.position) +
                                            1,
                                        }
                                      );

                                      const token =
                                        randomBytes(20).toString("hex");

                                      const prize = await Prize.findOne({
                                        _id: game.prizeId,
                                      });

                                      if (prize) {
                                        const pastWinner =
                                          await PastWinners.create({
                                            username: user.username,
                                            email: user.email,
                                            address: "",
                                            prize: prize.title,
                                            gameId: game._id,
                                            gameType: game.gameType,
                                            token: token,
                                          });

                                        if (pastWinner) {
                                          let transport;

                                          if (process.env.environment) {
                                            if (
                                              process.env.environment ===
                                              "Development"
                                            ) {
                                              transport = createTransport({
                                                service: "gmail",
                                                auth: {
                                                  user: process.env.EMAIL,
                                                  pass: process.env.PASSWORD,
                                                },
                                                tls: {
                                                  rejectUnauthorized: false,
                                                },
                                                secure: false,
                                              });
                                            } else if (
                                              process.env.environment ===
                                              "Production"
                                            ) {
                                              if (
                                                process.env.TLS &&
                                                process.env.TLS_KEY
                                              ) {
                                                transport = createTransport({
                                                  service: "gmail",
                                                  auth: {
                                                    user: process.env.EMAIL,
                                                    pass: process.env.PASSWORD,
                                                  },
                                                  tls: {
                                                    cert: readFileSync(
                                                      process.env.TLS
                                                    ).toString(),
                                                    key: readFileSync(
                                                      process.env.TLS_KEY
                                                    ).toString(),
                                                    rejectUnauthorized: false,
                                                  },
                                                  secure: true,
                                                });
                                              }
                                            }
                                          }

                                          const mailOptions = {
                                            from: process.env.EMAIL,
                                            to: user.email,
                                            subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                            text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                          };

                                          if (transport) {
                                            transport.sendMail(
                                              mailOptions,
                                              function (error: any, info: any) {
                                                if (error) {
                                                  console.error(error);
                                                }
                                              }
                                            );
                                          }
                                        }
                                      }
                                    }
                                  } else {
                                    if (user) {
                                      await User.findOneAndUpdate(
                                        {
                                          _id: winner.winnerId,
                                        },
                                        {
                                          points:
                                            user.points +
                                            12 -
                                            parseInt(winner.position) +
                                            1,
                                        }
                                      );
                                    }
                                  }
                                }
                              }
                            }
                          } else if (
                            game.gameType === "Elimination" &&
                            raceWinningBalls.length > 0
                          ) {
                            const unfinishedRaces = await Race.find({
                              gameId: game._id.toString(),
                              status: "Unfinished",
                            });

                            const totalRaces = await Race.find({
                              gameId: game._id.toString(),
                            });

                            if (unfinishedRaces.length > 0) {
                              const lastRace = unfinishedRaces[0];
                              let winners: Winner[] = [];

                              for (
                                let i = 0;
                                i < raceWinningBalls.length;
                                i++
                              ) {
                                const winningBall = raceWinningBalls[i];

                                const participantBalls = participants.filter(
                                  (participant) =>
                                    parseInt(participant.ball) == winningBall
                                );

                                if (
                                  participantBalls.length > 0 &&
                                  i !== raceWinningBalls.length - 1
                                ) {
                                  winners.push({
                                    winnerId: participantBalls[0].participantId,
                                    winnerName:
                                      participantBalls[0].participantName,
                                    position: `${i + 1}`,
                                    ball: `${winningBall}`,
                                  });
                                }
                              }

                              await Race.findOneAndUpdate(
                                {
                                  _id: lastRace._id,
                                },
                                {
                                  status: "Finished",
                                  typedBalls: data.raceWinningBalls,
                                  winners: winners,
                                  endedAt: Date.now(),
                                }
                              );

                              const firstRace = await Race.findOne({
                                gameId: game._id.toString(),
                              });

                              if (firstRace) {
                                if (
                                  totalRaces.length + 1 ===
                                  firstRace.winners.length + 1
                                ) {
                                  await Game.findOneAndUpdate(
                                    {
                                      _id: game._id,
                                    },
                                    {
                                      status: "Finished",
                                      winners: winners,
                                      endedAt: Date.now(),
                                    }
                                  );

                                  if (winners.length > 0) {
                                    for (let i = 0; i < winners.length; i++) {
                                      const winner = winners[i];

                                      const user = await User.findOne({
                                        _id: winner.winnerId,
                                      });

                                      if (winner.position == "1") {
                                        if (user) {
                                          const token =
                                            randomBytes(20).toString("hex");

                                          const prize = await Prize.findOne({
                                            _id: game.prizeId,
                                          });

                                          if (prize) {
                                            const pastWinner =
                                              await PastWinners.create({
                                                username: user.username,
                                                email: user.email,
                                                address: "",
                                                prize: prize.title,
                                                gameId: game._id,
                                                gameType: game.gameType,
                                                token: token,
                                              });

                                            if (pastWinner) {
                                              let transport;

                                              if (process.env.environment) {
                                                if (
                                                  process.env.environment ===
                                                  "Development"
                                                ) {
                                                  transport = createTransport({
                                                    service: "gmail",
                                                    auth: {
                                                      user: process.env.EMAIL,
                                                      pass: process.env
                                                        .PASSWORD,
                                                    },
                                                    tls: {
                                                      rejectUnauthorized: false,
                                                    },
                                                    secure: false,
                                                  });
                                                } else if (
                                                  process.env.environment ===
                                                  "Production"
                                                ) {
                                                  if (
                                                    process.env.TLS &&
                                                    process.env.TLS_KEY
                                                  ) {
                                                    transport = createTransport(
                                                      {
                                                        service: "gmail",
                                                        auth: {
                                                          user: process.env
                                                            .EMAIL,
                                                          pass: process.env
                                                            .PASSWORD,
                                                        },
                                                        tls: {
                                                          cert: readFileSync(
                                                            process.env.TLS
                                                          ).toString(),
                                                          key: readFileSync(
                                                            process.env.TLS_KEY
                                                          ).toString(),
                                                          rejectUnauthorized:
                                                            false,
                                                        },
                                                        secure: true,
                                                      }
                                                    );
                                                  }
                                                }
                                              }

                                              const mailOptions = {
                                                from: process.env.EMAIL,
                                                to: user.email,
                                                subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                                text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                              };

                                              if (transport) {
                                                transport.sendMail(
                                                  mailOptions,
                                                  function (
                                                    error: any,
                                                    info: any
                                                  ) {
                                                    if (error) {
                                                      console.error(error);
                                                    }
                                                  }
                                                );
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                } else if (
                                  totalRaces.length <
                                  firstRace.winners.length + 1
                                ) {
                                  if (game.participants.length > 0) {
                                    for (
                                      let i = 0;
                                      i < game.participants.length;
                                      i++
                                    ) {
                                      const participant = game.participants[i];
                                      const user = await User.findOne({
                                        _id: participant.participantId,
                                      });

                                      if (user) {
                                        await User.findOneAndUpdate(
                                          {
                                            _id: participant.participantId,
                                          },
                                          {
                                            points: user.points + (12 - i),
                                          }
                                        );
                                      }
                                    }
                                  }

                                  const newParticipants: Participant[] = [];

                                  for (let i = 0; i < winners.length; i++) {
                                    const winner = winners[i];

                                    newParticipants.push({
                                      ball: winner.ball,
                                      participantId: winner.winnerId,
                                      participantName: winner.winnerName,
                                    });
                                  }

                                  await Game.findOneAndUpdate(
                                    {
                                      _id: game._id,
                                    },
                                    {
                                      participants: newParticipants,
                                    }
                                  );

                                  const timer =
                                    Date.now() +
                                    convertStringMinutesToMilliseconds(
                                      game.timerPerRace
                                    );

                                  await Race.create({
                                    gameId: game._id.toString(),
                                    timer: timer,
                                  });
                                }
                              }
                            }
                          } else if (
                            game.gameType === "Lottery" &&
                            raceWinningBalls.length > 0
                          ) {
                            const unfinishedRaces = await Race.find({
                              gameId: game._id.toString(),
                              status: "Unfinished",
                            });

                            const totalRaces = await Race.find({
                              gameId: game._id.toString(),
                            });

                            if (unfinishedRaces.length > 0) {
                              const lastRace = unfinishedRaces[0];
                              let winners: Winner[] = [];

                              const winner = raceWinningBalls[0];

                              for (let i = 0; i < participants.length; i++) {
                                const participant = participants[i];

                                const participantBalls =
                                  participant.ball.split(",");

                                for (
                                  let x = 0;
                                  x < participantBalls.length;
                                  x++
                                ) {
                                  const ball = participantBalls[x];

                                  if (winner === parseInt(ball)) {
                                    winners.push({
                                      winnerId: participant.participantId,
                                      winnerName: participant.participantName,
                                      ball: participant.ball,
                                      position: `${1}`,
                                    });
                                    break;
                                  }
                                }
                              }

                              await Race.findOneAndUpdate(
                                {
                                  _id: lastRace._id,
                                },
                                {
                                  status: "Finished",
                                  typedBalls: data.raceWinningBalls,
                                  endedAt: Date.now(),
                                  winners: winners,
                                }
                              );

                              if (totalRaces.length === game.numberOfBalls) {
                                const winners: Winner[] = [];
                                const racesWinners: any[] = [];

                                const totalRaces = await Race.find({
                                  gameId: game._id.toString(),
                                });

                                const allRaces = await Race.find({
                                  gameId: game._id.toString(),
                                });

                                const regularRaces = [];
                                const bonusRaces = [];
                                const gameRegularBalls = game.regularBalls;
                                const gameBonusBalls = game.bonusBalls;

                                for (let i = 0; i < allRaces.length; i++) {
                                  const race = allRaces[i];

                                  const winners = [];

                                  for (
                                    let x = 0;
                                    x < race.winners.length;
                                    x++
                                  ) {
                                    const winner = race.winners[x];
                                    if (winner.position == "1") {
                                      winners.push(winner.winnerId);
                                    }
                                  }

                                  racesWinners.push(winners);
                                }

                                if (gameRegularBalls && gameBonusBalls) {
                                  const splitted = splitArrayByIndex(
                                    racesWinners,
                                    gameRegularBalls
                                  );

                                  let currentOccurrences = [];

                                  for (
                                    let i = 0;
                                    i < game.participants.length;
                                    i++
                                  ) {
                                    if (
                                      hasStrings(splitted) &&
                                      allSameValue(
                                        splitted,
                                        game.participants[i].participantId
                                      )
                                    ) {
                                      winners.push({
                                        winnerId:
                                          game.participants[i].participantId,
                                        winnerName:
                                          game.participants[i].participantName,
                                        position: "1",
                                        ball: game.participants[i].ball,
                                      });
                                    } else if (
                                      hasStrings(splitted) &&
                                      allSameValue(
                                        splitted,
                                        game.participants[i].participantId
                                      ) == false
                                    ) {
                                      const occurences = getOccurrences(
                                        splitted,
                                        game.participants[i].participantId
                                      );

                                      if (occurences > 0) {
                                        currentOccurrences.push({
                                          occurences: occurences,
                                          participant: {
                                            winnerId:
                                              game.participants[i]
                                                .participantId,
                                            winnerName:
                                              game.participants[i]
                                                .participantName,
                                            position: "1",
                                            ball: game.participants[i].ball,
                                          },
                                        });
                                      }
                                    }
                                  }

                                  currentOccurrences = currentOccurrences.sort(
                                    (a, b) => {
                                      return b.occurences - a.occurences;
                                    }
                                  );

                                  for (
                                    let i = 0;
                                    i < currentOccurrences.length;
                                    i++
                                  ) {
                                    const occurence = currentOccurrences[i];

                                    if (i === 0) {
                                      winners.push(occurence.participant);
                                    }
                                  }
                                }

                                await Game.findOneAndUpdate(
                                  {
                                    _id: game._id,
                                  },
                                  {
                                    status: "Finished",
                                    endedAt: Date.now(),
                                    winners: winners,
                                  }
                                );

                                if (winners.length > 0) {
                                  for (let i = 0; i < winners.length; i++) {
                                    const winner = winners[i];

                                    const user = await User.findOne({
                                      _id: winner.winnerId,
                                    });

                                    if (winner.position == "1") {
                                      const user = await User.findOne({
                                        _id: winner.winnerId,
                                      });

                                      if (user) {
                                        await User.findOneAndUpdate(
                                          {
                                            _id: winner.winnerId,
                                          },
                                          {
                                            points: user.points + 20,
                                          }
                                        );
                                      }

                                      if (user) {
                                        const token =
                                          randomBytes(20).toString("hex");

                                        const prize = await Prize.findOne({
                                          _id: game.prizeId,
                                        });

                                        if (prize) {
                                          const pastWinner =
                                            await PastWinners.create({
                                              username: user.username,
                                              email: user.email,
                                              address: "",
                                              prize: prize.title,
                                              gameId: game._id,
                                              gameType: game.gameType,
                                              token: token,
                                            });

                                          if (pastWinner) {
                                            let transport;

                                            if (process.env.environment) {
                                              if (
                                                process.env.environment ===
                                                "Development"
                                              ) {
                                                transport = createTransport({
                                                  service: "gmail",
                                                  auth: {
                                                    user: process.env.EMAIL,
                                                    pass: process.env.PASSWORD,
                                                  },
                                                  tls: {
                                                    rejectUnauthorized: false,
                                                  },
                                                  secure: false,
                                                });
                                              } else if (
                                                process.env.environment ===
                                                "Production"
                                              ) {
                                                if (
                                                  process.env.TLS &&
                                                  process.env.TLS_KEY
                                                ) {
                                                  transport = createTransport({
                                                    service: "gmail",
                                                    auth: {
                                                      user: process.env.EMAIL,
                                                      pass: process.env
                                                        .PASSWORD,
                                                    },
                                                    tls: {
                                                      cert: readFileSync(
                                                        process.env.TLS
                                                      ).toString(),
                                                      key: readFileSync(
                                                        process.env.TLS_KEY
                                                      ).toString(),
                                                      rejectUnauthorized: false,
                                                    },
                                                    secure: true,
                                                  });
                                                }
                                              }
                                            }

                                            const mailOptions = {
                                              from: process.env.EMAIL,
                                              to: user.email,
                                              subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                              text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                            };

                                            if (transport) {
                                              transport.sendMail(
                                                mailOptions,
                                                function (
                                                  error: any,
                                                  info: any
                                                ) {
                                                  if (error) {
                                                    console.error(error);
                                                  }
                                                }
                                              );
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }

                                  for (
                                    let i = 0;
                                    i < game.participants.length;
                                    i++
                                  ) {
                                    const participant = game.participants[i];
                                    const user = await User.findOne({
                                      _id: participant.participantId,
                                    });

                                    if (user) {
                                      if (
                                        user._id.toString() !=
                                        winners[0].winnerId
                                      ) {
                                        await User.findOneAndUpdate(
                                          {
                                            _id: participant.participantId,
                                          },
                                          {
                                            points: user.points + 2,
                                          }
                                        );
                                      }
                                    }
                                  }
                                }
                              }

                              if (totalRaces.length < game.numberOfBalls) {
                                const timer =
                                  Date.now() +
                                  convertStringMinutesToMilliseconds(
                                    game.timerPerRace
                                  );

                                await Race.create({
                                  gameId: game._id.toString(),
                                  timer: timer,
                                });
                              }
                            }
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }

                      if ("gameWinningBalls" in data) {
                        const winners: Winner[] = [];
                        const gameWinningBalls: string[] =
                          data.gameWinningBalls.split(",");

                        const participants = structuredClone(game.participants);

                        for (let i = 0; i < gameWinningBalls.length; i++) {
                          const ball = gameWinningBalls[i];

                          const participant: any = participants.filter(
                            (loopedParticipant, x) => {
                              if (ball == loopedParticipant.ball) {
                                return loopedParticipant;
                              }
                            }
                          );

                          if (participant.length > 0) {
                            if (participant[0]) {
                              winners.push({
                                ball: ball,
                                winnerId: participant[0].participantId,
                                winnerName: participant[0].participantName,
                                position: `${i + 1}`,
                              });
                            }
                          }
                        }

                        updateObject.winners = winners;

                        if (winners.length > 0) {
                          for (let i = 0; i < winners.length; i++) {
                            const winner = winners[i];

                            if (game.gameType === "Elimination") {
                              const user = await User.findOne({
                                _id: winner.winnerId,
                              });

                              if (winner.position == "1") {
                                if (user) {
                                  const token = randomBytes(20).toString("hex");

                                  const prize = await Prize.findOne({
                                    _id: game.prizeId,
                                  });

                                  if (prize) {
                                    const pastWinner = await PastWinners.create(
                                      {
                                        username: user.username,
                                        email: user.email,
                                        address: "",
                                        prize: prize.title,
                                        gameId: game._id,
                                        gameType: game.gameType,
                                        token: token,
                                      }
                                    );

                                    if (pastWinner) {
                                      let transport;

                                      if (process.env.environment) {
                                        if (
                                          process.env.environment ===
                                          "Development"
                                        ) {
                                          transport = createTransport({
                                            service: "gmail",
                                            auth: {
                                              user: process.env.EMAIL,
                                              pass: process.env.PASSWORD,
                                            },
                                            tls: {
                                              rejectUnauthorized: false,
                                            },
                                            secure: false,
                                          });
                                        } else if (
                                          process.env.environment ===
                                          "Production"
                                        ) {
                                          if (
                                            process.env.TLS &&
                                            process.env.TLS_KEY
                                          ) {
                                            transport = createTransport({
                                              service: "gmail",
                                              auth: {
                                                user: process.env.EMAIL,
                                                pass: process.env.PASSWORD,
                                              },
                                              tls: {
                                                cert: readFileSync(
                                                  process.env.TLS
                                                ).toString(),
                                                key: readFileSync(
                                                  process.env.TLS_KEY
                                                ).toString(),
                                                rejectUnauthorized: false,
                                              },
                                              secure: true,
                                            });
                                          }
                                        }
                                      }

                                      const mailOptions = {
                                        from: process.env.EMAIL,
                                        to: user.email,
                                        subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                        text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                      };

                                      if (transport) {
                                        transport.sendMail(
                                          mailOptions,
                                          function (error: any, info: any) {
                                            if (error) {
                                              console.error(error);
                                            }
                                          }
                                        );
                                      }
                                    }
                                  }
                                }
                              }
                            } else if (game.gameType === "Regular") {
                              const user = await User.findOne({
                                _id: winner.winnerId,
                              });

                              if (user) {
                                await User.findOneAndUpdate(
                                  {
                                    _id: winner.winnerId,
                                  },
                                  {
                                    points:
                                      user.points +
                                      12 -
                                      parseInt(winner.position) +
                                      1,
                                  }
                                );

                                const token = randomBytes(20).toString("hex");

                                const prize = await Prize.findOne({
                                  _id: game.prizeId,
                                });

                                if (prize) {
                                  const pastWinner = await PastWinners.create({
                                    username: user.username,
                                    email: user.email,
                                    address: "",
                                    prize: prize.title,
                                    gameId: game._id,
                                    gameType: game.gameType,
                                    token: token,
                                  });

                                  if (pastWinner) {
                                    let transport;

                                    if (process.env.environment) {
                                      if (
                                        process.env.environment ===
                                        "Development"
                                      ) {
                                        transport = createTransport({
                                          service: "gmail",
                                          auth: {
                                            user: process.env.EMAIL,
                                            pass: process.env.PASSWORD,
                                          },
                                          tls: {
                                            rejectUnauthorized: false,
                                          },
                                          secure: false,
                                        });
                                      } else if (
                                        process.env.environment === "Production"
                                      ) {
                                        if (
                                          process.env.TLS &&
                                          process.env.TLS_KEY
                                        ) {
                                          transport = createTransport({
                                            service: "gmail",
                                            auth: {
                                              user: process.env.EMAIL,
                                              pass: process.env.PASSWORD,
                                            },
                                            tls: {
                                              cert: readFileSync(
                                                process.env.TLS
                                              ).toString(),
                                              key: readFileSync(
                                                process.env.TLS_KEY
                                              ).toString(),
                                              rejectUnauthorized: false,
                                            },
                                            secure: true,
                                          });
                                        }
                                      }
                                    }

                                    const mailOptions = {
                                      from: process.env.EMAIL,
                                      to: user.email,
                                      subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                      text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                    };

                                    if (transport) {
                                      transport.sendMail(
                                        mailOptions,
                                        function (error: any, info: any) {
                                          if (error) {
                                            console.error(error);
                                          }
                                        }
                                      );
                                    }
                                  }
                                }
                              }
                            } else {
                              const user = await User.findOne({
                                _id: winner.winnerId,
                              });

                              if (user) {
                                await User.findOneAndUpdate(
                                  {
                                    _id: winner.winnerId,
                                  },
                                  {
                                    points:
                                      user.points +
                                      12 -
                                      parseInt(winner.position) +
                                      1,
                                  }
                                );

                                const token = randomBytes(20).toString("hex");

                                const prize = await Prize.findOne({
                                  _id: game.prizeId,
                                });

                                if (prize) {
                                  const pastWinner = await PastWinners.create({
                                    username: user.username,
                                    email: user.email,
                                    address: "",
                                    prize: prize.title,
                                    gameId: game._id,
                                    gameType: game.gameType,
                                    token: token,
                                  });

                                  if (pastWinner) {
                                    let transport;

                                    if (process.env.environment) {
                                      if (
                                        process.env.environment ===
                                        "Development"
                                      ) {
                                        transport = createTransport({
                                          service: "gmail",
                                          auth: {
                                            user: process.env.EMAIL,
                                            pass: process.env.PASSWORD,
                                          },
                                          tls: {
                                            rejectUnauthorized: false,
                                          },
                                          secure: false,
                                        });
                                      } else if (
                                        process.env.environment === "Production"
                                      ) {
                                        if (
                                          process.env.TLS &&
                                          process.env.TLS_KEY
                                        ) {
                                          transport = createTransport({
                                            service: "gmail",
                                            auth: {
                                              user: process.env.EMAIL,
                                              pass: process.env.PASSWORD,
                                            },
                                            tls: {
                                              cert: readFileSync(
                                                process.env.TLS
                                              ).toString(),
                                              key: readFileSync(
                                                process.env.TLS_KEY
                                              ).toString(),
                                              rejectUnauthorized: false,
                                            },
                                            secure: true,
                                          });
                                        }
                                      }
                                    }

                                    const mailOptions = {
                                      from: process.env.EMAIL,
                                      to: user.email,
                                      subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                      text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                    };

                                    if (transport) {
                                      transport.sendMail(
                                        mailOptions,
                                        function (error: any, info: any) {
                                          if (error) {
                                            console.error(error);
                                          }
                                        }
                                      );
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }

                        await Game.findOneAndUpdate(
                          {
                            _id: game._id,
                          },
                          {
                            ...updateObject,
                            status: "Finished",
                            endedAt: Date.now(),
                          }
                        );

                        if (winners.length > 0) {
                          const winner = winners[0];

                          const user = await User.findOne({
                            _id: winner.winnerId,
                          });

                          if (winner.position == "1") {
                            if (user) {
                              await User.findOneAndUpdate(
                                {
                                  _id: winner.winnerId,
                                },
                                {
                                  points:
                                    user.points +
                                    12 -
                                    parseInt(winner.position) +
                                    1,
                                }
                              );

                              const token = randomBytes(20).toString("hex");

                              const prize = await Prize.findOne({
                                _id: game.prizeId,
                              });

                              if (prize) {
                                const pastWinner = await PastWinners.create({
                                  username: user.username,
                                  email: user.email,
                                  address: "",
                                  prize: prize.title,
                                  gameId: game._id,
                                  gameType: game.gameType,
                                  token: token,
                                });

                                if (pastWinner) {
                                  let transport;

                                  if (process.env.environment) {
                                    if (
                                      process.env.environment === "Development"
                                    ) {
                                      transport = createTransport({
                                        service: "gmail",
                                        auth: {
                                          user: process.env.EMAIL,
                                          pass: process.env.PASSWORD,
                                        },
                                        tls: {
                                          rejectUnauthorized: false,
                                        },
                                        secure: false,
                                      });
                                    } else if (
                                      process.env.environment === "Production"
                                    ) {
                                      if (
                                        process.env.TLS &&
                                        process.env.TLS_KEY
                                      ) {
                                        transport = createTransport({
                                          service: "gmail",
                                          auth: {
                                            user: process.env.EMAIL,
                                            pass: process.env.PASSWORD,
                                          },
                                          tls: {
                                            cert: readFileSync(
                                              process.env.TLS
                                            ).toString(),
                                            key: readFileSync(
                                              process.env.TLS_KEY
                                            ).toString(),
                                            rejectUnauthorized: false,
                                          },
                                          secure: true,
                                        });
                                      }
                                    }
                                  }

                                  const mailOptions = {
                                    from: process.env.EMAIL,
                                    to: user.email,
                                    subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
                                    text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
                                  };

                                  if (transport) {
                                    transport.sendMail(
                                      mailOptions,
                                      function (error: any, info: any) {
                                        if (error) {
                                          console.error(error);
                                        }
                                      }
                                    );
                                  }
                                }
                              }
                            }
                          }
                        }
                      }

                      await Game.findOneAndUpdate(
                        {
                          _id: game._id,
                        },
                        {
                          ...updateObject,
                        }
                      );
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              });

              socket.on("deletePrize", async (data) => {
                if ("prizeId" in data) {
                  try {
                    await Prize.findOneAndDelete({
                      _id: data.prizeId,
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              });
            } else {
              socket.disconnect();
            }
          } else {
            socket.disconnect();
          }
        } else if ("dataAccessToken" in socket.handshake.auth) {
          const sockets = await io.fetchSockets();

          for (let i = 0; i < sockets.length; i++) {
            const loopedSocket = sockets[i];

            if ("token" in loopedSocket.handshake.auth) {
              const verified = await verifyJwt(
                loopedSocket.handshake.auth.token
              );

              if (verified) {
                const userId = decode(loopedSocket.handshake.auth.token);

                const user = await User.findOne({
                  _id: userId,
                  userType: "User",
                });

                if (user) {
                  updatePlayer(loopedSocket);
                }
              }
            } else if ("adminToken" in loopedSocket.handshake.auth) {
              const verified = await verifyJwt(
                loopedSocket.handshake.auth.adminToken
              );

              if (verified) {
                const userId = decode(loopedSocket.handshake.auth.adminToken);

                const user = await User.findOne({
                  _id: userId,
                  userType: "Admin",
                });

                if (user) {
                  updateAdmin(loopedSocket);
                }
              }
            }
          }
        } else {
          socket.disconnect();
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
}
