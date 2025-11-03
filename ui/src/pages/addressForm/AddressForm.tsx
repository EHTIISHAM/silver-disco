import styles from "./AddressForm.module.css";
import logo from "../../assets/logo.png";
import axios from "axios";
import { useCallback } from "react";

const serverUrl: string = import.meta.env.VITE_SERVER_URL;

const AddressForm = () => {
  const submitForm = useCallback((e: any) => {
    e.preventDefault();

    const address = e.target[0].value;

    if (address != "") {
      const urlString = window.location.href;
      const url = new URL(urlString);
      const secret = url.searchParams.get("secret");

      if (secret) {
        axios({
          url: `${serverUrl}/enter_address`,
          method: "POST",
          data: {
            secret,
            address,
          },
        })
          .then(() => {
            alert(
              "Your address has been received by us. Please wait while we send over your prize to you."
            );
          })
          .catch((e) => {
            alert(e.response.data.error);
          });
      }
    } else {
      alert("Please fill out the address.");
    }
  }, []);

  return (
    <form className={styles.form} onSubmit={submitForm}>
      <img src={logo} alt="Logo" />
      <br />
      <br />
      <br />
      <h1>Address Form</h1>
      <p>
        We would like you to enter your address in the form below so that we can
        ship your prize over to you.
      </p>
      <br />
      <input type="text" className="form-control alt" />
      <br />
      <br />
      <br />
      <button className="btn-primary">CONFIRM</button>
    </form>
  );
};

export default AddressForm;
