import React from "react";
import { makeStyles } from "@mui/styles";

import {
  handleClientLoad,
  getAuthStatus,
  fetchAttachments,
  handleGAuth,
  loadGoogleScript
} from "./helper/GmailHelper";
// import { getErrorToaster } from '../../../../Reusable/getToaster';

const useStyles = makeStyles((theme) => ({
  addTemplateButton: {
    width: "200px",
    background: "#008ED5",
    borderRadius: "11px",
    opacity: "1",
    textAlign: "center",
    font: "normal normal bold 16px/20px Segoe UI",
    letterSpacing: "0px",
    color: "#FFFFFF",
    textTransform: "none",
    "&:hover": {
      background: "#FFFFFF",
      color: "#FFFFFF"
    }
  },
  textBelow: {
    textAlign: "center",
    font: " normal normal normal 18px/24px Segoe UI",
    letterSpacing: "0px",
    color: " #848484",
    opacity: " 1",
    fontSize: "14px"
  },
  attachmentsContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  googleBtn: {
    height: "45px",
    backgroundColor: "#4285f4",
    borderRadius: "2px",
    boxShadow: "0 3px 4px 0 rgba(0,0,0,.25)",
    display: "inline-flex",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 0 6px #4285f4"
    },
    "&:active": {
      background: "#1669F2"
    }
  },
  googleIconWrapper: {
    marginTop: "2px",
    marginLeft: "1px",
    width: "35px",
    height: "35px",
    display: "flex",
    borderRadius: "2px",
    padding: "0% 4% 3% 0",
    backgroundColor: "#fff"
  },
  googleIcon: {
    marginTop: "13px",
    marginLeft: "11px",
    width: "18px",
    height: "15px"
  },
  btnText: {
    margin: "auto",
    color: "#fff",
    fontSize: "13.5px",
    letterSpacing: "0.2px",
    fontFamily: "Segoe UI",
    fontWeight: "500",
    padding: "0 10px"
  }
}));

const GmailAttachments = (props) => {
  const classes = useStyles();
  const [authorized, setAuthorized] = React.useState(false);

  //initialising google client
  React.useEffect(() => {
    //call back function to execute after loading script
    window.onGoogleScriptLoad = () => {
      //load auth client library
      handleClientLoad();
    };
    //loads script
    loadGoogleScript();
  }, []);

  const handleAuthClick = (e) => {
    console.log("handleAuthClick");
    e.preventDefault();
    if (!getAuthStatus()) {
      handleGAuth(true);
      setAuthorized(true);
    } else {
      setAuthorized(getAuthStatus());
      fetchAttachments()
        .then((resData) => {
          console.log("fetchedAttachments", resData);
          props.setRowData(resData);
          props.setShowOptions(1);
        })
        .catch((e) => {
          console.log(e);
          alert(e.result, 5000);
        });
    }
  };

  return (
    <div
      style={{
        padding: "10px",
        display: "contents",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {authorized ? (
        <div className={classes.attachmentsContainer}>
          <div
            className={classes.googleBtn}
            onClick={(e) => {
              handleAuthClick(e);
            }}
          >
            <div className={classes.googleIconWrapper}>
              <img
                className={classes.googleIcon}
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                alt="google-signin-logo"
              />
            </div>
            <p className={classes.btnText}>Fetch Attachments</p>
          </div>
        </div>
      ) : (
        <div
          className={classes.googleBtn}
          onClick={(e) => {
            handleAuthClick(e);
          }}
        >
          <div className={classes.googleIconWrapper}>
            <img
              className={classes.googleIcon}
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="google-signin-logo"
            />
          </div>
          <p className={classes.btnText}>Authorize from Gmail</p>
        </div>
      )}
    </div>
  );
};
export default GmailAttachments;
