import axios from "axios";
import Headers from "../../components/Headers";
import { useCallback } from "react";

const SignUp = () => {
  const serverUrl: string = import.meta.env.VITE_SERVER_URL;

  const onSubmit = useCallback((e: any) => {
    e.preventDefault();

    const [username, email, password] = e.target as HTMLInputElement[];

    if (username.value != "" && email.value != "" && password.value != "") {
      axios({
        withCredentials: true,
        url: `${serverUrl}/demo_sign_up`,
        method: "POST",
        data: {
          username: username.value,
          email: email.value,
          password: password.value,
        },
      })
        .then(() => {
          window.location.href = "/";
        })
        .catch((e) => {
          alert(e.response.data.error);
        });
    } else {
      alert("Please fill out the username and password.");
    }
  }, []);

  return (
    <>
      <Headers />
      <div className="content-container">
        <h1>Sign Up</h1>
        <p>
          This is a sign up page for demo purposes only that makes use of a
          regular form to create a user instead of requiring us to go through
          all the TikTok authentication work. This allows for rapid user
          creation for demo and testing purposes. The production version of the
          product uses TikTok authentication anyways.
        </p>
        <br />
        <form onSubmit={onSubmit}>
          <label htmlFor="username">
            <b>Username:</b>
          </label>
          <input type="text" className="form-control" id="username" />
          <br />
          <br />
          <label htmlFor="email">
            <b>Email:</b>
          </label>
          <input type="email" className="form-control" id="email" />
          <br />
          <br />
          <label htmlFor="password">
            <b>Password:</b>
          </label>
          <input type="password" className="form-control" id="password" />
          <br />
          <br />
          <button className="btn-primary">CONTINUE</button>
        </form>
      </div>
    </>
  );
};

export default SignUp;
