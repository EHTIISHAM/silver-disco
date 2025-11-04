 import { useCallback } from "react";
 import Headers from "../../components/Headers";
 import axios from "axios";

 const Login = () => {
   const serverUrl: string = import.meta.env.VITE_SERVER_URL;

   const onSubmit = useCallback((e: any) => {
     e.preventDefault();

     const [username, password] = e.target as HTMLInputElement[];

     if (username.value != "" && password.value != "") {
       axios({
         withCredentials: true,
         url: `${serverUrl}/demo_login`,
         method: "POST",
         data: {
           username: username.value,
           password: password.value,
         },
       })
         .then((response) => {
           const data = response.data;
           if ("type" in data) {
             if (data.type === "User") {
               window.location.href = "/";
             } else {
               window.location.href = "/dashboard";
             }
           } else {
             window.location.href = "/";
           }
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
         <h1>Login</h1>
         <p>
           This is a login page for demo purposes only that makes use of a
           regular form to login instead of requiring us to go through all the
           TikTok authentication work. This allows for rapid user testing for
           demo and testing purposes. The production version of the product uses
           TikTok authentication anyways.
         </p>
         <br />
         <form onSubmit={onSubmit}>
           <label htmlFor="username">
             <b>Username:</b>
           </label>
           <input type="text" className="form-control alt" id="username" />
           <br />
           <br />
           <label htmlFor="password">
             <b>Password:</b>
           </label>
           <input type="password" className="form-control alt" id="password" />
           <br />
           <br />
           <button className="btn-primary">CONTINUE</button>
         </form>
         <br />
         <p>
           Don't have an account? <a href="/signUp">Sign Up</a>
         </p>
       </div>
     </>
   );
 };

 export default Login;







// import { useCallback } from "react";
// import Headers from "../../components/Headers";
// import axios from "axios";

// const Login = () => {
//   const serverUrl: string = import.meta.env.VITE_SERVER_URL;

//   const onSubmit = useCallback((e: any) => {
//     e.preventDefault();

//     const [username, password] = e.target as HTMLInputElement[];

//     if (username.value != "" && password.value != "") {
//       axios({
//         withCredentials: true,
//         url: `${serverUrl}/demo_login`,
//         method: "POST",
//         data: {
//           username: username.value,
//           password: password.value,
//         },
//       })
//         .then((response) => {
//           const data = response.data;
//           if ("type" in data) {
//             if (data.type === "User") {
//               window.location.href = "/";
//             } else {
//               window.location.href = "/dashboard";
//             }
//           } else {
//             window.location.href = "/";
//           }
//         })
//         .catch((e) => {
//           alert(e.response.data.error);
//         });
//     } else {
//       alert("Please fill out the username and password.");
//     }
//   }, []);

//   return (
//     <>
//       <Headers />
//       <div className="content-container">
//         <h1>Login</h1>
//         <p>
//           This is a login page for demo purposes only that makes use of a
//           regular form to login instead of requiring us to go through all the
//           TikTok authentication work. This allows for rapid user testing for
//           demo and testing purposes. The production version of the product uses
//           TikTok authentication anyways.
//         </p>
//         <br />
//         <form onSubmit={onSubmit}>
//           <label htmlFor="username">
//             <b>Username:</b>
//           </label>
//           <input type="text" className="form-control alt" id="username" />
//           <br />
//           <br />
//           <label htmlFor="password">
//             <b>Password:</b>
//           </label>
//           <input type="password" className="form-control alt" id="password" />
//           <br />
//           <br />
//           <button className="btn-primary">CONTINUE</button>
//         </form>
//         <br />
//         <p>
//           Don't have an account? <a href="/signUp">Sign Up</a>
//         </p>
//       </div>
//     </>
//   );
// };

// export default Login;
