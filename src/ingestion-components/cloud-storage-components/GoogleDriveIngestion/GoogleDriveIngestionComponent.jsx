import React, { useState, useEffect } from "react";

import useDrivePicker from "react-google-drive-picker";
import { gapi } from "gapi-script";

import * as AWS from "aws-sdk";

// // Client ID and API key from the Developer Console
// const CLIENT_ID = process.env.CLIENT_ID;
// const API_KEY = process.env.API_KEY;
// const appId = process.env.APP_ID;

const CLIENT_ID =
  "546959051313-8l13pmvrkm4tfv8fcqdghs2uj6a354t5.apps.googleusercontent.com";
const API_KEY = "AIzaSyD7ySMiIUkaq7MakjjDcbeEVQTF9WEIsbg";
// // Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];

// // Authorization scopes required by the API; multiple scopes can be
// // included, separated by spaces.
const SCOPES2 = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.photos.readonly",
  "https://www.googleapis.com/auth/drive.metadata"
];
// const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const SCOPES =
  "https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata";

function GoogleDriveIngestion() {
  const [openPicker, data, authResponse] = useDrivePicker();
  const [documents, setDocuments] = useState([]);
  const [signedInUser, setSignedInUser] = useState({});
  const [childFiles, setChildFiles] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [loader, setLoader] = useState(false);

  AWS.config.region = "us-east-1"; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:9b9e38cd-3ae5-4c5a-9636-d247dc100b7b"
  });

  // const customViewsArray = [new google.picker.DocsView()]; // custom view
  const handleOpenPicker = () => {
    openPicker({
      clientId: CLIENT_ID,
      developerKey: API_KEY,
      viewId: "FOLDERS",
      // token: token, // pass oauth token in case you already have one
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: true,
      setSelectFolderEnabled: true,
      customScopes: SCOPES2
      // customViews: customViewsArray, // custom view
    });
  };

  useEffect(() => {
    // do anything with the selected/uploaded files
    console.log("authResponse", authResponse);
    if (data) {
      console.log(data);
      handleClientLoad(data); // needs to complete first / asynchronous

      // data.docs.forEach(folder => {
      //   console.log(folder);
      //   fetchFiles(folder.id) // needs to complete / asynchronous
      // })
      // handleSuccess()
      console.log("handleSuccess", childFiles);
    }
  }, [data]);

  const handleClientLoad = (data) => {
    // handleOpenPicker()
    gapi.load("client:auth2", initClient);
    // gapi.load('picker', onPickerApiLoad);
  };

  const initClient = () => {
    // setIsLoadingGoogleDriveApi(true);
    gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
        // redirect_uri: ''
      })
      .then(
        function () {
          console.log("Fetching documents", gapi, data);
          // Listen for sign-in state changes.
          gapi.auth.setToken(authResponse.access_token);
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

          data.docs.forEach((folder) => {
            console.log(folder);
            fetchFiles(folder.id); // needs to complete / asynchronous
          });
        },
        function (error) {
          console.log("error", error);
        }
      )
      .catch((err) => {
        console.log("err", err);
      });
  };

  const updateSigninStatus = (isSignedIn) => {
    if (isSignedIn) {
      // setOauthToken(gapi.auth.getToken().access_token)
      setSignedInUser(gapi.auth2.getAuthInstance().currentUser.le.wt);
      // listFiles();
    } else {
      // prompt user to sign in
      handleAuthClick();
    }
  };

  const handleAuthClick = (event) => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const fetchFiles = (folderId) => {
    // for API v3
    // fetch(`https://www.googleapis.com/drive/v3/files`, {
    //   q: `'${folderId}' in parents`,
    //   key: API_KEY
    // })
    // fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${API_KEY}`,{})

    // for API v2
    fetch(
      `https://www.googleapis.com/drive/v2/files/${folderId}/children?key=${API_KEY}`,
      {
        method: "GET",
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          Authorization: "Bearer " + authResponse.access_token,
          Accept: "application/json"
        }
      }
    )
      .then((res) => res.json())
      .then((data) => {
        let fileArr = [];
        data.items.forEach((files) => {
          // getFile(files)
          console.log("files >> ", files);
          fileArr.push(getFileInfo(files.id));
        });
        Promise.all(fileArr).then((res) => {
          console.log("res", res);
          setChildFiles(res);
          handleSuccess(res);
        });
      })
      .catch((err) => console.log(err));
    console.log("handleSuccess", childFiles);
  };

  const getFileInfo = async (fileId) => {
    // console.log("getFileInfo")
    // const response = await gapi.client.drive.files.get({
    //   // alt: 'media',
    //   fileId: fileId,
    //   fields:
    //     "id, name, mimeType, modifiedTime, webViewLink, webContentLink, fullFileExtension, fileExtension"
    // });
    // const resp = JSON.parse(response.body);
    // console.log(resp);

    const response = await fetch(
      `https://www.googleapis.com/drive/v2/files/${fileId}`,
      {
        method: "GET",
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          Authorization: "Bearer " + authResponse.access_token,
          Accept: "application/json"
        }
      }
    );
    const resp = response.json();
    return resp;
  };

  function handleSuccess(files) {
    console.log("handleSuccess files >> ", files);
    let promiseArray = [];
    let allLinks = [];
    setLoader(true);
    files.forEach((file) => {
      allLinks.push(file);
      promiseArray.push(
        uploadFileToS3(
          file,
          file.downloadUrl ? file.downloadUrl : file.alternateLink,
          // file.webContentLink ? file.webContentLink : file.webViewLink,
          file.fullFileExtension,
          file.mimeType,
          "qdox-training-pipeline",
          "google-drive-test/" + file.title
        )
      );
    });

    setAllLinks(allLinks);
    Promise.all(promiseArray)
      .then((res) => {
        setLoader(false);
        console.log("all the files uploaded successfully !!");
      })
      .catch((err) => {
        setLoader(false);
        console.log("some error in uploading files");
      });
  }

  const uploadFileToS3 = (file, url, fileExtension, mimeType, bucket, key) => {
    console.log("authResponse.access_token >> ", url);
    const corsWhitelist = ["https://6g1u8.csb.app/", "http://localhost:3000/"];
    // return fetch(url.substring(0, url.indexOf("/view")), {
    return fetch(url, {
      method: "GET",
      mode: "cors", // no-cors, *cors, same-origin
      // credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Access-Control-Allow-Origin": corsWhitelist,
        "Access-Control-Allow-Credentials": true,
        // "Access-Control-Request-Header":
        //   "Origin, X-Requested-With, Content-Type, Accept",
        Authorization: "Bearer " + authResponse.access_token
        // "Content-Type": "application/json",
        // Accept: "application/json"
      }
    })
      .then((x) => {
        console.log(x);
        return x.blob();
      })
      .then((response) => {
        console.log("response >> ", response, typeof response);
        const params = {
          ContentType: response.type,
          // ContentType: mimeType,
          ContentLength: response.size.toString(), // or response.header["content-length"] if available for the type of file downloaded
          Bucket: bucket,
          Body: response,
          Key: key
        };
        console.log("params >> ", params);
        const s3 = new AWS.S3();
        return s3.putObject(params).promise();
      })
      .catch((err) => {
        console.log("error fetching file from url ", err);
      });
  };

  return (
    <div>
      <button onClick={() => handleOpenPicker()}>Select Folders</button>
      <div>
        {childFiles.forEach((file) => (
          <li>
            <span>{file.name}</span>
          </li>
        ))}
      </div>
    </div>
  );
}

export default GoogleDriveIngestion;
