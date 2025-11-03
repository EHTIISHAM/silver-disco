import axios from "axios";
import Headers from "../../components/Headers";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../../components/Footer";

const SignUp = () => {
  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts: any = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  const serverUrl: string = import.meta.env.VITE_SERVER_URL;
  const [user, setUser] = useState<any>();
  const [currentPage, setCurrentPage] = useState(1);
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (getCookie("userId")) {
      setCurrentPage(2);
      setUser({ _id: getCookie("userId") });
    }
  }, []);

  const loginBtnClick = (e: any) => {
    e.preventDefault();

    window.location.href = serverUrl + "/authenticate_tiktok";
  };

  const submitEmailForm = (e: any) => {
    e.preventDefault();

    const email = e.target[0].value;

    if (email !== "" && user) {
      if (user) {
        axios({
          withCredentials: true,
          url: `${serverUrl}/sign_up`,
          method: "POST",
          data: {
            email,
            user,
          },
        })
          .then(() => {
            window.location.href = "/";
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
  };

  return (
    <>
      <Headers />
      {currentPage === 1 ? (
        <div className="content-container">
          <div className="sign-up-progress-bar">
            <div className="sign-up-progress-bar-points">
              <div className="point active">
                <div>1</div>
              </div>
              <div className="point">
                <div>2</div>
              </div>
            </div>
            <div className="progress-bar-text">
              <div className="point-text active">Authenticate with TikTok</div>
              <div className="point-text">Email Address</div>
            </div>
          </div>
          <br />
          <h1>Authenticate with TikTok</h1>
          <br />
          <p>
            Create your account by logging in with TikTok. You would need to
            grant pinballrace.com certain permissions as mentioned in the{" "}
            <a href="/terms_of_service.pdf" target="_blank">
              Terms of Service.
            </a>
          </p>
          <br />
          <button className="tiktok-button" onClick={loginBtnClick}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M16.6 5.82C15.9164 5.03962 15.5397 4.03743 15.54 3H12.45V15.4C12.4261 16.071 12.1428 16.7066 11.6597 17.1729C11.1766 17.6393 10.5314 17.8999 9.85997 17.9C8.43997 17.9 7.25997 16.74 7.25997 15.3C7.25997 13.58 8.91997 12.29 10.63 12.82V9.66C7.17997 9.2 4.15997 11.88 4.15997 15.3C4.15997 18.63 6.91997 21 9.84997 21C12.99 21 15.54 18.45 15.54 15.3V9.01C16.793 9.90985 18.2973 10.3926 19.84 10.39V7.3C19.84 7.3 17.96 7.39 16.6 5.82Z"
                fill="white"
              />
            </svg>
            Login with TikTok
          </button>
          <br />
          <br />
          <p>
            By authenticating, you agree with our{" "}
            <a href="/terms_of_service.pdf" target="_blank">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy_policy.pdf" target="_blank">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="content-container">
          <div className="sign-up-progress-bar">
            <div className="sign-up-progress-bar-points">
              <div className="point active">
                <div>1</div>
              </div>
              <div className="point active">
                <div>2</div>
              </div>
            </div>
            <div className="progress-bar-text">
              <div className="point-text active">Authenticate with TikTok</div>
              <div className="point-text active">Email Address</div>
            </div>
          </div>
          <br />
          <h1>Email Address</h1>
          <br />
          <p>
            We need your email address to be able to send you the winning
            prizes.
          </p>
          <br />
          <form onSubmit={submitEmailForm}>
            <input
              type="text"
              placeholder="Email..."
              className="form-control alt"
            />
            <br />
            <br />
            <button className="btn-primary">CONTINUE</button>
          </form>
          <br />
          <br />
          <p>
            Please acknowledge that we will be sending you promotional content
            to via the email address as mentioned in the{" "}
            <a href="/terms_of_service.pdf" target="_blank">
              Terms of Service
            </a>
            . By proceeding, you consent and agree to that as well.
          </p>
        </div>
      )}
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default SignUp;
