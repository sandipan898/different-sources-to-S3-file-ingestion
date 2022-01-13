// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES =
  "https://mail.google.com/  https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/userinfo.email";

const REACT_APP_GOOGLE_API_KEY = "AIzaSyA77yFJnPX6chAX4AyY-G2cBJf6UjJLVd4";
const REACT_APP_GOOGLE_CLIENT_ID =
  "444300404169-l5mt3e448gnu0jh11bqqakk5e5acspv8.apps.googleusercontent.com";

export const loadGoogleScript = () => {
  // Loads the Google JavaScript Library
  (function () {
    const id = "google-js";
    const src = "https://apis.google.com/js/api.js"; // (Ref. 1)

    // We have at least one script (React)
    const firstScript = document.getElementsByTagName("script")[0]; // (Ref. 2)

    // Prevent script from loading twice
    if (document.getElementById(id)) {
      return;
    } // (Ref. 3)
    const gScript = document.createElement("script"); // (Ref. 4)
    gScript.id = id;
    gScript.src = src;
    gScript.onload = window.onGoogleScriptLoad; // (Ref. 5)
    firstScript.parentNode.insertBefore(gScript, firstScript);
  })();
};

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
const initClient = () => {
  window.gapi.client
    .init({
      apiKey: REACT_APP_GOOGLE_API_KEY,
      clientId: REACT_APP_GOOGLE_CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    })
    .then(
      () => {
        // Listen for sign-in state changes.
        //window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle the initial sign-in state.
        //updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        //authorizeButton.onclick = handleAuthClick;
        //signoutButton.onclick = handleSignoutClick;
      },
      (error) => {
        console.log(error);
      }
    );
};

//--------------------all function exports-------------------------*
/**
 *  On load, called to load the auth2 library and API client library.
 */
export const handleClientLoad = () => {
  window.gapi.load("client:auth2", initClient);
};

/**
 *  Get Auth status of google client
 * @returns gauth_Status:boolean
 */

export const getAuthStatus = () => {
  return window.gapi.auth2.getAuthInstance().isSignedIn.get();
};

/**
 * signIn or signOut user
 */
export const handleGAuth = (status) => {
  if (status) {
    window.gapi.auth2.getAuthInstance().signIn();
  } else {
    window.gapi.auth2.getAuthInstance().signOut();
  }
};

/**
 *  fetch upto 100 pdf attachments associated with signed in user
 */

export const fetchAttachments = () => {
  return new Promise(async (resolve, reject) => {
    //local variables
    let noFetchedEmails = 100;
    let emails = [];
    let pdfAttachments = [];
    try {
      ///list messages
      let messagesResp = await window.gapi.client.gmail.users.messages.list({
        userId: "me",
        q: ["in:inbox", "has:attachment", "filename:pdf"]
      });
      messagesResp = messagesResp.result.messages;
      noFetchedEmails = messagesResp.length;

      //get message
      console.log("Messages list", messagesResp);

      messagesResp.map(async (messageBody) => {
        let msgResp = await window.gapi.client.gmail.users.messages.get({
          id: messageBody.id,
          userId: "me"
        });
        // console.log("Message", msgResp.result)
        msgResp = msgResp.result;
        emails.push(msgResp);

        if (
          msgResp.payload &&
          msgResp.payload.parts &&
          msgResp.payload.parts.length > 0
        ) {
          let attachments = msgResp.payload.parts;
          attachments = attachments.filter(
            (attachment) => attachment.mimeType === "application/pdf"
          );
          if (attachments.length > 0) {
            attachments.forEach((attachment) => {
              pdfAttachments.push({
                ...attachment,
                date: new Date(Number(msgResp.internalDate)),
                messageId: messageBody.id
              });
            });
          }
        }
        // console.log("emails", emails);
        if (emails.length === noFetchedEmails) {
          console.log("Emails", emails);
          console.log("PDFAttachments", pdfAttachments);
          resolve(pdfAttachments);
        }
      });
    } catch (e) {
      console.log("Got an error while fetching attachments", e);
      reject(e);
    }
  });
};

/**
 * fetch attachment file in base64 format
 */

export const getAttachment = async (attachmentId, messageId) => {
  try {
    const attachResp = await window.gapi.client.gmail.users.messages.attachments.get(
      {
        userId: "me",
        messageId: messageId,
        id: attachmentId
      }
    );
    console.log("Attachment", attachResp.result);
    //Format base64 string
    let base64 = attachResp.result.data.replace(/_/g, "/");
    base64 = base64.replace(/-/g, "+");
    return base64;
  } catch (e) {
    console.log("Error fetching attachment body", e);
    return "Error";
  }
};
