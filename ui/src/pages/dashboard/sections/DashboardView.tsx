import { Fragment, useEffect, useRef, useState } from "react";
import Headers from "../../../components/Headers";
import axios from "axios";
import { Socket, io } from "socket.io-client";
import { MdDelete } from "react-icons/md";
import { cloneDeep, isEqual } from "lodash-es";
import { nanoid } from "nanoid";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts: any = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function choose(n: number, k: number): number {
  if (k == 0) {
    return 1;
  }

  return (n * choose(n - 1, k - 1)) / k;
}

const DashboardView = () => {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const [username, setUsername] = useState<string | undefined>();
  const [pfp, setPfp] = useState<string | undefined>();
  const [gameType, setGameType] = useState("Regular");
  const [prizes, setPrizes] = useState([]);
  const currentImageRef = useRef<any>();
  const socketRef = useRef<Socket>();
  const [currentGame, setCurrentGame] = useState<any>();
  const [nextGame, setNextGame] = useState<any>();
  const [numberOfBalls, setNumberOfBalls] = useState<number>(1);
  const [numberOfBonusBalls, setNumberOfBonusBalls] = useState<number>(0);
  const [numberOfMaxPlayers, setNumberOfMaxPlayers] = useState<number>();
  const [_users, setUsers] = useState([]);
  const [pastWinners, setPastWinners] = useState([]);
  const [kickedParticipants, setKickedParticipants] = useState<any[]>([]);
  const kickedParticipantsRef = useRef(kickedParticipants);
  const [addedParticipants, setAddedParticipants] = useState<any[]>([]);
  const addedParticipantsRef = useRef(addedParticipants);
  const currentGameIdRef = useRef();
  const [currentRace, setCurrentRace] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(0);
  const [currentGameRaces, setCurrentGameRaces] = useState<any>();
  const [viewRaceResults, setViewRaceResults] = useState(false);

  useEffect(() => {
    setNumberOfMaxPlayers(choose(12, numberOfBalls + numberOfBonusBalls));
  }, [numberOfBalls]);

  useEffect(() => {
    setNumberOfMaxPlayers(choose(12, numberOfBalls + numberOfBonusBalls));
  }, [numberOfBonusBalls]);

  useEffect(() => {
    kickedParticipantsRef.current = kickedParticipants;
  }, [kickedParticipants]);

  useEffect(() => {
    addedParticipantsRef.current = addedParticipants;
  }, [addedParticipants]);

  useEffect(() => {
    if (currentGame) currentGameIdRef.current = currentGame._id;
  }, [currentGame]);

  useEffect(() => {
    axios({
      withCredentials: true,
      url: `${serverUrl}/get_admin_profile`,
      method: "GET",
    })
      .then((response) => {
        setUsername(response.data.username);
        setPfp(response.data.pfp);
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  useEffect(() => {
    if (socketRef.current == null) {
      socketRef.current = io(`${import.meta.env.VITE_WS_URL}/games`, {
        auth: {
          adminToken: getCookie("adminToken"),
        },
        forceNew: true,
      });
    }

    const { current: socket } = socketRef;

    try {
      if (socket) {
        socket.on("newPrizeId", async (data) => {
          if (currentImageRef.current) {
            const formData = new FormData();

            formData.append("prizeId", data);
            formData.append("image", currentImageRef.current);

            await axios.post(`${serverUrl}/upload_prize_image`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            });
          }
        });

        socket.on("adminData", async (data) => {
          if (currentGame) {
            if (
              !isEqual(data.currentGame.participants, currentGame.participants)
            ) {
              setKickedParticipants([]);
              setAddedParticipants([]);
            }
          }

          setPrizes(data.prizes);
          setCurrentGame(data.currentGame);
          setPastWinners(data.pastWinners);
          setNextGame(data.nextGame);
          setCurrentRace(data.currentRace);
          setCurrentGameRaces(data.currentGameRaces);
          setCurrentTimer(data.currentTimer);
          setCurrentGameRaces(data.currentGameRaces);
          setUsers(data.users);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const newRace = (e: any) => {
    e.preventDefault();

    if (
      e.target[2].value === "Regular" ||
      e.target[2].value === "Elimination"
    ) {
      const [_button1, _button2, type, preDefined, timer, gameTimer, prize] =
        e.target as HTMLInputElement[];

      if (timer.value != "" && prize.value != "" && socketRef.current) {
        preDefined.value == ""
          ? socketRef.current.emit("newGame", {
              type: type.value,
              timer: timer.value,
              gameTimer: gameTimer.value,
              prize: prize.value,
            })
          : socketRef.current.emit("newGame", {
              type: type.value,
              preDefined: preDefined.value,
              timer: timer.value,
              gameTimer: gameTimer.value,
              prize: prize.value,
            });
      } else {
        alert("Please fill it out completely.");
      }
    } else {
      const [
        _button1,
        _button2,
        type,
        numberOfBallsPerSelection,
        bonusBalls,
        timer,
        gameTimer,
        prize,
      ] = e.target as HTMLInputElement[];

      if (
        timer.value != "" &&
        gameTimer.value != "" &&
        prize.value != "" &&
        numberOfBallsPerSelection.value != "" &&
        socketRef.current
      ) {
        const additionalParams: any = {};

        if (bonusBalls.value != "") {
          additionalParams.bonusBalls = bonusBalls.value;
        }

        socketRef.current.emit("newGame", {
          type: type.value,
          timer: timer.value,
          gameTimer: gameTimer.value,
          prize: prize.value,
          numberOfBallsPerSelection: numberOfBallsPerSelection.value,
          ...additionalParams,
        });
      } else {
        alert("Please fill it out completely.");
      }
    }
  };

  const updateCurrentGame = (e: any) => {
    e.preventDefault();

    const [_fieldset, _button, gameWinningBalls, raceWinningBalls] =
      e.target as HTMLInputElement[];

    if (socketRef.current) {
      let object: any = {};

      if (kickedParticipantsRef.current.length > 0) {
        object.kickedParticipants = kickedParticipantsRef.current;
      }

      if (addedParticipantsRef.current.length > 0) {
        object.addedParticipants = addedParticipantsRef.current;
      }

      if (gameWinningBalls.value != "") {
        object.gameWinningBalls = gameWinningBalls.value;
      }

      if (raceWinningBalls.value != "") {
        object.raceWinningBalls = raceWinningBalls.value;
      }

      if (Object.keys(object).length > 0) {
        socketRef.current.emit("updateGame", {
          _id: currentGameIdRef.current,
          ...object,
        });

        e.target.reset();
      }
    }
  };

  const newPrize = (e: any) => {
    e.preventDefault();

    if (socketRef.current) {
      const [_button, title, description, image] =
        e.target as HTMLInputElement[];

      if (title.value != "" && description.value != "") {
        const imageFiles = image.files;

        if (imageFiles) {
          if (imageFiles.length > 0) {
            const file = imageFiles[0];
            const fileName = file.name;
            const re = /(\.png|\.jpeg|\.jpg|\.webp|\.pdf|\.mp4|\.mp3)$/i;

            if (!re.exec(fileName)) {
              alert("File extension not supported!");
              return false;
            }

            socketRef.current.emit("newPrize", {
              title: title.value,
              description: description.value,
            });

            currentImageRef.current = file;
          } else {
            socketRef.current.emit("newPrize", {
              title: title.value,
              description: description.value,
            });
          }
        } else {
          socketRef.current.emit("newPrize", {
            title: title.value,
            description: description.value,
          });
        }

        e.target.reset();
      } else {
        alert("Please provide a title and a description.");
      }
    }
  };

  const deletePrize = (prizeId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("deletePrize", {
        prizeId: prizeId,
      });
    }
  };

  const kickedParticipant = (e: any) => {
    let currentKickedParticipants = cloneDeep(kickedParticipantsRef.current);

    if (e.target.checked) {
      currentKickedParticipants.push(e.target.id);

      const id = e.target.id.replace(",kick", "");

      const currentAddRefs = cloneDeep(addedParticipantsRef.current);

      currentAddRefs.map((participant, i: number) => {
        const loopedId = participant.replace(",add", "");
        if (loopedId === id) {
          currentAddRefs.splice(i, 1);
        }
      });

      setAddedParticipants(currentAddRefs);
      setKickedParticipants(currentKickedParticipants);
    } else {
      for (let i = 0; i < currentKickedParticipants.length; i++) {
        const participant = currentKickedParticipants[i];

        if (participant === e.target.id) {
          currentKickedParticipants.splice(i, 1);
        }
      }

      setKickedParticipants(currentKickedParticipants);
    }
  };

  const addParticipant = (e: any) => {
    let currentAddedParticipants = cloneDeep(addedParticipantsRef.current);

    if (e.target.checked) {
      currentAddedParticipants.push(e.target.id);

      const id = e.target.id.replace(",add", "");

      const currentKickRefs = cloneDeep(kickedParticipantsRef.current);

      currentKickRefs.map((participant, i: number) => {
        const loopedId = participant.replace(",kick", "");
        if (loopedId === id) {
          currentKickRefs.splice(i, 1);
        }
      });

      setAddedParticipants(currentKickRefs);
      setAddedParticipants(currentAddedParticipants);
    } else {
      for (let i = 0; i < currentAddedParticipants.length; i++) {
        const participant = currentAddedParticipants[i];

        if (participant === e.target.id) {
          currentAddedParticipants.splice(i, 1);
        }
      }

      setAddedParticipants(currentAddedParticipants);
    }
  };

  const beginRaces = () => {
    if (socketRef.current) {
      socketRef.current.emit("beginRaces");
    }
  };

  return (
    <>
      <Headers pfp={pfp} username={username} />
      
      <div className="content-container">
        <h1>Welcome, {username}.</h1>
        
        <br />
        <br />
        <div className="content-rows">
          <fieldset
            style={{
              border: "none",
            }}
          >
            <form onSubmit={newRace} className="content-column">
              <div className="flex-heading">
                <h3>Next Game</h3>
                <span>#{nextGame ? nextGame.gameNumber : null}</span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={beginRaces}
                >
                  BEGIN RACES
                </button>
                <button
                  className="btn-primary"
                  disabled={(() => {
                    if (nextGame != null && nextGame != undefined) {
                      return true;
                    }

                    if (currentGame != null && currentGame != undefined) {
                      if (currentGame.status != "Finished") {
                        return true;
                      }
                    }

                    return false;
                  })()}
                >
                  CREATE GAME
                </button>
              </div>
              <br />
              <div className="cards-row">
                <div className="card admin-card">
                  <label htmlFor="type">
                    <b>Type:</b>
                  </label>
                  <select
                    className="form-control"
                    id="type"
                    onChange={(e) => setGameType(e.target.value)}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Lottery">Lottery</option>
                    <option value="Elimination">Elimination</option>
                  </select>
                  {gameType === "Lottery" ? (
                    <>
                      <br />
                      <br />
                      <label htmlFor="numberOfBalls">
                        <b>
                          Number Of Balls Per Selection ({numberOfMaxPlayers}{" "}
                          Max Players):
                        </b>
                      </label>
                      <select
                        className="form-control"
                        id="numberOfBalls"
                        onChange={(e) =>
                          setNumberOfBalls(parseInt(e.target.value))
                        }
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                      <br />
                      <br />
                      <label htmlFor="bonusBalls">
                        <b>Bonus Balls:</b>
                      </label>
                      <select
                        id="bonusBalls"
                        className="form-control"
                        onChange={(e) =>
                          setNumberOfBonusBalls(parseInt(e.target.value))
                        }
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </>
                  ) : null}
                  <br />
                  <br />
                  {gameType !== "Lottery" ? (
                    <>
                      <label htmlFor="players">
                        <b>Pre-Defined Players (Separated by comma ","):</b>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="E.g. John Doe,Jane Doe"
                        id="players"
                      />
                      <br />
                      <br />
                    </>
                  ) : null}
                  <label htmlFor="duration">
                    <b>Timer per Race:</b>
                  </label>
                  <select className="form-control" id="duration">
                    <option value="1 minutes">1 minute</option>
                    <option value="2 minutes">2 minutes</option>
                    <option value="3 minutes">3 minutes</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="10 minutes">10 minutes</option>
                  </select>
                  <br />
                  <br />
                  <label htmlFor="timerTillNextRace">
                    <b>Timer Till Next Game:</b>
                  </label>
                  <select className="form-control" id="timerTillNextRace">
                    <option value="1 minutes">1 minute</option>
                    <option value="2 minutes">2 minutes</option>
                    <option value="3 minutes">3 minutes</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="10 minutes">10 minutes</option>
                  </select>
                  <br />
                  <br />
                  <label htmlFor="prize">
                    <b>Prize:</b>
                  </label>
                  <select className="form-control" id="prize">
                    <option value="Select">Select</option>
                    {prizes.map((prize: any) => {
                      return (
                        <option
                          key={prize._id + "gameprizeselection"}
                          value={prize._id}
                        >
                          {prize.title}
                        </option>
                      );
                    })}
                  </select>
                  <br />
                  <br />
                  <label>
                    <b>
                      Players Joining (
                      {nextGame ? nextGame.attempters.length : 0}):
                    </b>
                  </label>
                  <br />
                  {nextGame
                    ? nextGame.attempters.map((attempter: any) => {
                        return (
                          <p
                            key={attempter.participantId + "nextattempterslist"}
                          >
                            {attempter.attempterName} ({attempter.ball})
                          </p>
                        );
                      })
                    : null}
                  <br />
                  <br />
                  <label>
                    <b>
                      Players Qualified (
                      {nextGame ? nextGame.participants.length : 0}):
                    </b>
                  </label>
                  <br />
                  {nextGame
                    ? nextGame.participants.map((participant: any) => {
                        return (
                          <p
                            key={
                              participant.participantId + "nextparticipantslist"
                            }
                          >
                            {participant.participantName} ({participant.ball})
                          </p>
                        );
                      })
                    : null}
                </div>
              </div>
            </form>
          </fieldset>
          <form onSubmit={updateCurrentGame} className="content-column">
            <fieldset
              style={{
                border: "none",
              }}
              disabled={
                currentGame
                  ? currentGame.status === "Ongoing"
                    ? false
                    : true
                  : true
              }
            >
              <div className="flex-heading">
                <h3>
                  Current Game (Game:{" "}
                  {currentGame ? currentGame.gameNumber : "Not Started"}, Race:{" "}
                  {currentRace ? currentRace : <>Not Started</>}. {currentTimer}{" "}
                  seconds till next race can be commenced.)
                </h3>
                <button className="btn-primary">CONFIRM</button>
              </div>
              <br />
              <div className="cards-row">
                <div className="card admin-card">
                  <label htmlFor="winners">
                    <b>
                      Game Winning Balls: (List in order, leave empty if the
                      game hasn't ended yet)
                    </b>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. 1, 2, 3, 12"
                    id="winners"
                  />
                  <br />
                  <br />
                  <label htmlFor="raceWinners">
                    <b>
                      Race Winning Balls: (List in order, leave empty if the
                      race hasn't ended yet)
                    </b>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. 1, 2, 3, 12"
                    id="raceWinners"
                  />
                  <br />
                  <br />
                  <label>
                    <b>Kick Players:</b>
                  </label>
                  <br />
                  {currentGame
                    ? currentGame.participants.length > 0
                      ? currentGame.participants.map((user: any) => {
                          return (
                            <Fragment key={user.participantId + "kick"}>
                              <input
                                type="checkbox"
                                id={user.participantId + ",kick"}
                                onChange={(e) => kickedParticipant(e)}
                              />{" "}
                              <label htmlFor={user.participantId + ",kick"}>
                                {user.participantName} ({user.ball})
                              </label>
                              <br />
                            </Fragment>
                          );
                        })
                      : null
                    : null}
                  <br />
                  <br />
                  <label>
                    <b>Add Players:</b>
                  </label>
                  <br />
                  {currentGame
                    ? currentGame.attempters.map((attempter: any) => {
                        if (currentGame) {
                          const existsAlready = currentGame.participants.filter(
                            (participant: any) => {
                              if (
                                participant.participantId ===
                                attempter.attempterId
                              )
                                return participant;
                            }
                          );

                          if (existsAlready.length === 0) {
                            return (
                              <Fragment key={attempter.attempterId + "add"}>
                                <input
                                  type="checkbox"
                                  id={attempter.attempterId + ",add"}
                                  onChange={(e) => addParticipant(e)}
                                />{" "}
                                <label htmlFor={attempter.attempterId + ",add"}>
                                  {attempter.attempterName}
                                </label>
                                <br />
                              </Fragment>
                            );
                          }
                        }
                      })
                    : null}
                </div>
              </div>
              <div className="cards-row">
                <div className="card admin-card">
                  <label>
                    <b>
                      Players Joining (
                      {currentGame ? currentGame.attempters.length : 0}):
                    </b>
                  </label>
                  <br />
                  {currentGame
                    ? currentGame.attempters.map((attempter: any) => {
                        return (
                          <p key={attempter.attempterId + "attempters"}>
                            {attempter.attempterName} ({attempter.ball})
                          </p>
                        );
                      })
                    : null}
                  <br />
                  <br />
                  <label>
                    <b>
                      Players Qualified (
                      {currentGame ? currentGame.participants.length : 0}):
                    </b>
                  </label>
                  <br />
                  {currentGame
                    ? currentGame.participants.map((participant: any) => {
                        return (
                          <p
                            key={participant.participantId + "participantslist"}
                          >
                            {participant.participantName} ({participant.ball})
                          </p>
                        );
                      })
                    : null}
                </div>
              </div>
              {!viewRaceResults && currentGame ? (
                currentGame.gameType != "Lottery" ? (
                  <div
                    style={{
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <a
                      onClick={() => setViewRaceResults(true)}
                      style={{ cursor: "pointer" }}
                    >
                      See current game's results
                    </a>
                    <br />
                    <br />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <a
                      onClick={() => setViewRaceResults(true)}
                      style={{ cursor: "pointer" }}
                    >
                      See current game's results
                    </a>
                    <br />
                    <br />
                  </div>
                )
              ) : (
                <>
                  {currentGame && currentGameRaces
                    ? currentGameRaces.length > 0 &&
                      currentGame.gameType != "Lottery"
                      ? currentGameRaces.map((race: any, i: number) => {
                          return (
                            <div
                              className="cards-row"
                              key={race._id + "prievousgamedropdown"}
                            >
                              <div className="card">
                                <div>
                                  <h3>Race {i + 1}</h3>
                                  <b>Finishing Places:</b>
                                  <br />
                                  <div
                                    className="winning-balls"
                                  >
                                    {race.winners.map((winner: any, i: any) => {
                                      return (
                                        <img
                                          src={`ball${winner.ball}.png`}
                                          className={`ball-images ${
                                            i == 0 ? "first" : ""
                                          }`}
                                          key={nanoid(10)}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      : currentGameRaces.map((race: any, i: number) => {
                          return (
                            <div
                              className="cards-row"
                              key={race._id + "prievousgamedropdown"}
                            >
                              <div className="card">
                                <div>
                                  <h3>Race {i + 1}</h3>
                                  <b>Winners:</b>
                                  <br />
                                  <div className="winning-balls">
                                    {race.winners.map(
                                      (_winner: any, i: number) => {
                                        let ballToArray =
                                          race.typedBalls.split(",");

                                        if (ballToArray.length > 0 && i === 0) {
                                          return ballToArray.map(
                                            (ball: any) => {
                                              return (
                                                <img
                                                  src={`ball${ball}.png`}
                                                  className={`ball-images`}
                                                  key={nanoid(10)}
                                                />
                                              );
                                            }
                                          );
                                        }
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    : null}
                </>
              )}
            </fieldset>
          </form>
        </div>
        <br />
        <div className="content-row">
          <div className="content-column">
            <div className="flex-heading">
              <h3>Prizes</h3>
            </div>
            <br />
            <div className="cards-row">
              <div className="card admin-card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Picture</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map((prize: any, i) => {
                      return (
                        <tr key={prize._id}>
                          <td>{i + 1}</td>
                          <td>{prize.title}</td>
                          <td>{prize.description}</td>
                          <td>{prize.image}</td>
                          <td>
                            <button
                              className="btn-secondary"
                              onClick={() => deletePrize(prize._id)}
                            >
                              <MdDelete />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="card admin-card">
                <form onSubmit={newPrize}>
                  <div className="flex-heading">
                    <h4>New Prize</h4>
                    <button className="btn-primary">ADD</button>
                  </div>
                  <br />
                  <label htmlFor="title">
                    <b>Title:</b>
                  </label>
                  <input
                    id="title"
                    className="form-control"
                    placeholder="Type..."
                    type="text"
                  />
                  <br />
                  <br />
                  <label htmlFor="description">
                    <b>Description:</b>
                  </label>
                  <input
                    id="description"
                    className="form-control"
                    placeholder="Type..."
                    type="text"
                  />
                  <br />
                  <br />
                  <label htmlFor="image">
                    <b>Image:</b>
                  </label>
                  <input
                    id="image"
                    className="form-control"
                    placeholder="Type..."
                    type="file"
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className="content-row">
          <div className="content-column">
            <div className="flex-heading">
              <h3>Past Winners</h3>
            </div>
            <br />
            <div className="cards-row">
              <div className="card admin-card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Prize</th>
                      <th>Game (ID)</th>
                      <th>Game Type</th>
                      <th>Happened At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastWinners
                      ? pastWinners
                          .sort(
                            (a: any, b: any) =>
                              parseInt(b.createdAt) - parseInt(a.createdAt)
                          )
                          .map((winner: any, i: number) => {
                            return (
                              <tr key={nanoid(10)}>
                                <td>{i + 1}</td>
                                <td>{winner.username}</td>
                                <td>{winner.email}</td>
                                <td>{winner.address}</td>
                                <td>{winner.prize}</td>
                                <td>{winner.gameId}</td>
                                <td>{winner.gameType}</td>
                                <td>
                                  {new Date(winner.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                      : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardView;
