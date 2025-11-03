import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Root() {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();

  useEffect(() => {
    axios({
      withCredentials: true,
      url: `${serverUrl}/home`,
      method: "GET",
    })
      .then(() => {
        navigate("/home");
      })
      .catch(() => {
        navigate("/");
        // navigate("/login"); chanegd by Artist
      });
  }, []);

  return <></>;
}
