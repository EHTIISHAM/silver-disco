// import { useState, useEffect, useRef } from "react";
// import { Socket} from "socket.io-client";
// import { useLocation, useParams } from "react-router-dom";

// // function getCookie(name: string) {
// //   const value = `; ${document.cookie}`;
// //   const parts: any = value.split(`; ${name}=`);
// //   if (parts.length === 2) return parts.pop().split(";").shift();
// // }

// const Viewleaderboard = () => {
//   const socketRef = useRef<Socket>();
//   const [users, setUsers] = useState<any[]>([]);
//   const [timeFilter, setTimeFilter] = useState<string>("week"); // default weekly
//   const [compT, setCompT] = useState<string>("simple"); // competition type
//   const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
//     start: "",
//     end: "",
//   });

//   const location = useLocation();
//   const { raceId } = useParams();
//   const tempMode = new URLSearchParams(location.search).get("temp") === "true";

// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const params = new URLSearchParams({
//         time: timeFilter,
//         compT,
//         temp: tempMode ? "true" : "false",
//       });

//       if (raceId) params.append("raceId", raceId);
//       if (timeFilter === "custom" && customRange.start && customRange.end) {
//         params.append("from", customRange.start);
//         params.append("to", customRange.end);
//       }

//       const res = await fetch(`${import.meta.env.VITE_API_URL}/leaderboard?${params.toString()}`);
//       const data = await res.json();
//       setUsers(data.users || []);
//     } catch (err) {
//       console.error("❌ Error fetching leaderboard:", err);
//     }
//   };

//   fetchData();
// }, [timeFilter, compT, tempMode, raceId, customRange]);


//   // re-fetch when filters change
//   // useEffect(() => {
//   //   if (socketRef.current) {
//   //     socketRef.current.emit("getLeaderboard", {
//   //       time: timeFilter,
//   //       compT,
//   //       temp: tempMode,
//   //       raceId: raceId || null,
//   //       customRange,
//   //     });
//   //   }
//   // }, [timeFilter, compT, tempMode, raceId, customRange]);
//   useEffect(() => {
//   if (socketRef.current) {
//     const payload: any = {
//       time: timeFilter,
//       compT,
//       temp: tempMode,
//       raceId: raceId || null,
//     };

//     if (timeFilter === "custom" && customRange.start && customRange.end) {
//       payload.from = customRange.start;
//       payload.to = customRange.end;
//     }

//     socketRef.current.emit("getLeaderboard", payload);
//   }
//   }, [timeFilter, compT, tempMode, raceId, customRange]);


//   const getRank = (index: number) => {
//     const rank = index + 1;
//     if (rank % 10 === 1 && rank !== 11) return `${rank}st`;
//     if (rank % 10 === 2 && rank !== 12) return `${rank}nd`;
//     if (rank % 10 === 3 && rank !== 13) return `${rank}rd`;
//     return `${rank}th`;
//   };

//   return (
//     <div className="leaderboard-container" style={{ padding: "20px" }}>
//       <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
//         {raceId ? `Race ${raceId} Leaderboard` : "Global Leaderboard"}
//       </h2>

//       {/* Filters */}
//       <div
//         style={{
//           display: "flex",
//           gap: "20px",
//           marginBottom: "20px",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         {/* Time Filter */}
//         <div>
//           <span style={{ marginRight: "10px", fontWeight: "bold" }}>Time:</span>
//           <select
//             value={timeFilter}
//             onChange={(e) => setTimeFilter(e.target.value)}
//             style={{ padding: "6px", borderRadius: "6px" }}
//           >
//             <option value="today">Today</option>
//             <option value="yesterday">Yesterday</option>
//             <option value="week">Last 7 Days</option>
//             <option value="month">Last 30 Days</option>
//             <option value="quarter">Last 90 Days</option>
//             <option value="year">Last 12 Months</option>
//             <option value="all">All Time</option>
//             <option value="custom">Custom</option>
//           </select>
//         </div>

//         {/* Custom Range Picker (only if custom selected) */}
//         {timeFilter === "custom" && (
//           <div style={{ display: "flex", gap: "10px" }}>
//             <input
//               type="date"
//               value={customRange.start}
//               onChange={(e) =>
//                 setCustomRange((prev) => ({ ...prev, start: e.target.value }))
//               }
//             />
//             <input
//               type="date"
//               value={customRange.end}
//               onChange={(e) =>
//                 setCustomRange((prev) => ({ ...prev, end: e.target.value }))
//               }
//             />
//           </div>
//         )}

//         {/* CompT Dropdown */}
//         <div>
//           <span style={{ marginRight: "10px", fontWeight: "bold" }}>
//             Race:
//           </span>
//           <select
//             value={compT}
//             onChange={(e) => setCompT(e.target.value)}
//             style={{ padding: "6px", borderRadius: "6px" }}
//           >
//             <option value="simple">All Races</option>
//             <option value="comps">Comps</option>
//           </select>
//         </div>
//       </div>

//       {/* Leaderboard Table */}
//       <div className="cards-row">
//         <table
//           className="table"
//           style={{
//             width: "100%",
//             borderCollapse: "collapse",
//             textAlign: "center",
//           }}
//         >
//           <thead>
//             <tr style={{ background: "#f4f4f4" }}>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>Rank</th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>
//                 Player
//               </th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>
//                 Races
//               </th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>Wins</th>
//               <th style={{ padding: "10px", border: "1px solid #ddd" }}>
//                 Points
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.length > 0 ? (
//               users.map((user, i) => (
//                 <tr key={user._id + "leaderboard"}>
//                   <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                     {getRank(i)}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px",
//                       border: "1px solid #ddd",
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "10px",
//                       justifyContent: "center",
//                     }}
//                   >
//                     {user.pfp ? (
//                       <img
//                         src={user.pfp}
//                         alt="pfp"
//                         style={{ width: "30px", borderRadius: "50%" }}
//                       />
//                     ) : null}
//                     {user.username}
//                   </td>
//                   <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                     {user.races ?? 0}
//                   </td>
//                   <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                     {user.wins ?? 0}
//                   </td>
//                   <td style={{ padding: "10px", border: "1px solid #ddd" }}>
//                     {user.points ?? 0}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={5}
//                   style={{ textAlign: "center", padding: "20px" }}
//                 >
//                   No data found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Viewleaderboard;



















import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { useLocation, useParams } from "react-router-dom";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts: any = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const Viewleaderboard = () => {
  const socketRef = useRef<Socket>();
  const [users, setUsers] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>("week"); // default weekly
  const [compT, setCompT] = useState<string>("alltime"); // competition type

  const location = useLocation();
  const { raceId } = useParams(); // 👈 catch dynamic :raceId
  const tempMode = new URLSearchParams(location.search).get("temp") === "true";

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_WS_URL}/leaderboard`, {
        auth: { token: getCookie("token") },
        forceNew: true,
        query: {
          temp: tempMode ? "true" : "false",
          raceId: raceId || "",
        },
      });
    }

    const socket = socketRef.current;

    if (socket) {
      socket.on("leaderboardData", (data) => {
        setUsers(data.users || []);
      });

      // initial fetch
      socket.emit("getLeaderboard", {
        time: timeFilter,
        compT,
        temp: tempMode,
        raceId: raceId || null,
      });
    }

    return () => {
      if (socket) socket.disconnect();
      socketRef.current = undefined;
    };
  }, [raceId]);

  // re-fetch when filters change
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit("getLeaderboard", {
        time: timeFilter,
        compT,
        temp: tempMode,
        raceId: raceId || null,
      });
    }
  }, [timeFilter, compT, tempMode, raceId]);

  // helper to add suffix to rank
  const getRank = (index: number) => {
    const rank = index + 1;
    if (rank % 10 === 1 && rank !== 11) return `${rank}st`;
    if (rank % 10 === 2 && rank !== 12) return `${rank}nd`;
    if (rank % 10 === 3 && rank !== 13) return `${rank}rd`;
    return `${rank}th`;
  };

  return (
    <div className="leaderboard-container" style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        {raceId ? `Race ${raceId} Leaderboard` : "Global Leaderboard"}
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Time Filter Dropdown */}
        <div>
          <span style={{ marginRight: "10px", fontWeight: "bold" }}>Time:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ padding: "6px", borderRadius: "6px" }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last 12 Months</option>
            <option value="all">All Time</option>
            <option value="custom">Custom</option>

          </select>
        </div>

        {/* CompT Dropdown */}
        <div>
          <span style={{ marginRight: "10px", fontWeight: "bold" }}>
            Race:
          </span>
          <select
            value={compT}
            onChange={(e) => setCompT(e.target.value)}
            style={{ padding: "6px", borderRadius: "6px" }}
          >
            <option value="simple">All Races</option>
            <option value="comps">Comps</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="cards-row">
        <table
          className="table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center", // 👈 center align all text
          }}
        >
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Rank</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                Player
              </th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                Races
              </th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Wins</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, i) => (
                <tr key={user._id + "leaderboard"}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {getRank(i)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      justifyContent: "center", // 👈 center align avatar + name
                    }}
                  >
                    {user.pfp ? (
                      <img
                        src={user.pfp}
                        alt="pfp"
                        style={{ width: "30px", borderRadius: "50%" }}
                      />
                    ) : null}
                    {user.username}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {user.races ?? 0}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {user.wins ?? 0}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {user.points ?? 0}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Viewleaderboard;



