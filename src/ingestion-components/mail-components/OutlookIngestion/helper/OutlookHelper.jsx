import * as Msal from "msal";
var graph = require("@microsoft/microsoft-graph-client");

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    redirectUri: process.env.REACT_APP_MICROSOFT_REDIRECT_URI
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true
  }
};

const scopes = ["User.Read", "Mail.ReadWrite", "mailboxsettings.read"];

class OutlookHelper {
  constructor(locationPath) {
    this.userAgentApplication = new Msal.UserAgentApplication(msalConfig);
    this.userAgentApplication.handleRedirectCallback((error, response) => {
      console.log("Got error from msal >>>", error);
      console.log("Got response from msal >>>", response);
    });
  }

  async login() {
    try {
      let loginRequest = {
        scopes: scopes // optional Array<string>
        //prompt: "select_account"
      };
      let response = await this.userAgentApplication.loginPopup(loginRequest);
      console.log("Got Microsoft login response", response);
    } catch (err) {
      console.log("Got Microsoft error response", err);
    }
  }

  logout() {
    this.userAgentApplication.logout();
  }

  checkAuth() {
    let authUser = this.userAgentApplication.getAccount();
    const authState = authUser === null ? false : true;
    console.log("MSAgent auth user >>", authUser);
    return authState;
  }

  async getAuthenticatedGraphClient(accessToken) {
    const client = await graph.Client.init({
      authProvider: (done) => {
        done(null, accessToken.accessToken);
      }
    });

    return client;
  }

  getAttachments() {
    return new Promise(async (resolve, reject) => {
      let accessToken = await this.userAgentApplication.acquireTokenSilent({
        scopes: scopes
      });

      console.log("access token", accessToken);
      const client = await this.getAuthenticatedGraphClient(accessToken);
      console.log("client >>", client);
      try {
        const emails = await client
          .api("/me/messages")
          .filter("hasAttachments eq true")
          .top(100)
          .get(); //.select('id').get()
        console.log("Got emails >>", emails);
        let attachments = [];
        emails.value.map(async (email, index) => {
          let emailId = email.id;
          let attachmentsForEmail = await client
            .api("/me/messages/" + emailId + "/attachments")
            .get();
          attachmentsForEmail.value.map(async (attachment) => {
            if (attachment.contentType === "application/pdf") {
              //let contentData = await client.api(`/me/messages/${emailId}/attachments/${attachment.id}/$value`).get();
              //console.log(contentData)
              attachments.push(attachment);
            }
          });
          if (index === emails.value.length - 1) {
            console.log("Got attachments >>", attachments);
            let modifiedAttachments = attachments.map((attachmentObj) => {
              return {
                ...attachmentObj,
                filename: attachmentObj.name,
                date: new Date(attachmentObj.lastModifiedDateTime)
              };
            });
            resolve(modifiedAttachments);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default OutlookHelper;
