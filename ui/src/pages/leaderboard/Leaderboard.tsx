// Just comment this whole and uncomment the code below for checking the authincation 
import { Outlet } from "react-router-dom";

const Leaderboard = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default Leaderboard;



// this needs to be bake backend so it checks for the auth and the next process



// import axios from "axios";
// import { useEffect } from "react";
// import { Outlet, useNavigate } from "react-router-dom";

// const Leaderboard = () => {
//   const serverUrl: string = import.meta.env.VITE_SERVER_URL;
//   const navigate = useNavigate();

//   useEffect(() => {
//   console.log("🔎 Leaderboard mounted, checking auth...");

//   axios({
//     withCredentials: true,
//     url: `${serverUrl}/leaderboard`,
//     method: "GET",
//   })
//     .then((res) => {
//       console.log("✅ Leaderboard auth success:", res);
//       // Note: we do NOT navigate here, so if you get redirected, it's not from here
//     })
//     .catch((err) => {
//     if (err.response) {
//       console.error("❌ Leaderboard auth failed:", {
//         status: err.response.status,
//         data: err.response.data,
//         headers: err.response.headers,
//       });
//     } else {
//       console.error("❌ Leaderboard network/auth error:", err.message);
//     }
//     navigate("/"); // keep redirect for now
//     });

//   }, [serverUrl, navigate]);


//   return (
//     <div>
//       <Outlet />
//     </div>
//   );
// };

// export default Leaderboard;













