import React from "react";
import { makeStyles } from "@mui/styles";
import OutlookHelper from "./helper/OutlookHelper";

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
  microsoftBtn: {
    height: "45px",
    backgroundColor: "#cfe5f6",
    borderRadius: "2px",
    boxShadow: "0 3px 4px 0 rgba(0,0,0,.25)",
    display: "inline-flex",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 0 6px #4285f4"
    }
  },
  microsoftIconrapper: {
    marginTop: "2px",
    marginLeft: "1px",
    width: "35px",
    height: "35px",
    display: "flex",
    borderRadius: "2px",
    padding: "0% 4% 3% 0",
    backgroundColor: "#fff"
  },
  btnText: {
    margin: "auto",
    // color: "#fff",
    fontSize: "13.5px",
    letterSpacing: "0.2px",
    fontFamily: "Segoe UI",
    fontWeight: "500",
    padding: "0 10px"
  },
  microsoftIcon: {
    fontSize: "1.5rem",
    // margin: "0.3rem 0.45rem 0.3rem 0.55rem"
    marginTop: "9px",
    marginLeft: "10px",
    width: "18px",
    height: "15px"
  }
}));

const OutlookAttachments = (props) => {
  const classes = useStyles();
  const msClient = new OutlookHelper();
  const [authorized, setAuthorized] = React.useState(false);

  //initialising google client
  React.useEffect(() => {
    //sign-out microsoft user on closing of modal
    return () => {
      //msClient.logout();
    };
  }, []);

  const handleAuthClick = (e) => {
    e.preventDefault();
    if (!authorized) {
      msClient.login();
      setAuthorized(true);
    } else {
      setAuthorized(msClient.checkAuth());
      msClient
        .getAttachments()
        .then((attachments) => {
          props.setShowOptions(2);
          props.setRowData(attachments);
        })
        .catch((error) => {
          console.log("Got error while getting Attachments >>", error);
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
            className={classes.microsoftBtn}
            onClick={(e) => {
              handleAuthClick(e);
            }}
          >
            <div className={classes.microsoftIconrapper}>
              <i
                className={"fab fa-microsoft " + classes.microsoftIcon}
                alt="microsoft-signin-logo"
              />
            </div>
            <p className={classes.btnText}>Fetch Attachments</p>
          </div>
        </div>
      ) : (
        <div
          className={classes.microsoftBtn}
          onClick={(e) => {
            handleAuthClick(e);
          }}
        >
          <div className={classes.microsoftIconrapper}>
            <i
              className={"fab fa-microsoft " + classes.microsoftIcon}
              alt="microsoft-signin-logo"
            />
          </div>
          <p className={classes.btnText}>Authorize from Outlook</p>
        </div>
      )}
    </div>
  );
};
export default OutlookAttachments;
