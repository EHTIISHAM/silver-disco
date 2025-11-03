// import { Outlet } from "react-router-dom";

// const Dashboard = () => {
//   return (
//     <div>
//       <Outlet />
//     </div>
//   );
// };

// export default Dashboard;









import axios from "axios";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();

  useEffect(() => {
    axios({
      withCredentials: true,
      url: `${serverUrl}/dashboard`,
      method: "GET",
    })
      .then(() => {
        navigate("/dashboard");
      })
      .catch(() => {
        navigate("/");
      });
  }, []);

  return (
    <div>
      <Outlet />
    </div>
  );
};

export default Dashboard;
