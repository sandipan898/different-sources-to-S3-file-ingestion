import React, { useState } from "react";
import "./styles.css";
import axios from "axios";
import DropboxChooser from "react-dropbox-chooser";
import * as AWS from "aws-sdk";
import Loader from "../../reusables/loader/loader";
import {
  getInfoToaster,
  getSuccessToaster,
  getErrorToaster
} from "../../reusables/toaster/getToaster";

const APP_KEY = "bts7afijj62krvv";

export default function DropboxFileIngestion() {
  const [allLinks, setAllLinks] = useState([]);
  const [loader, setLoader] = useState(false);

  AWS.config.region = "us-east-1"; // Region
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:9b9e38cd-3ae5-4c5a-9636-d247dc100b7b"
  });

  const uploadFileToS3 = (file, url, bucket, key) => {
    return fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {},
      referrer: "no-referrer"
    })
      .then((x) => x.blob())
      .then((response) => {
        console.log("response >> ", response);
        const params = {
          ContentType: response.type,
          ContentLength: response.size.toString(), // or response.header["content-length"] if available for the type of file downloaded
          Bucket: bucket,
          Body: response,
          Key: key
        };
        const s3 = new AWS.S3();
        return s3.putObject(params).promise();
      })
      .catch((err) => {
        console.log("error fetching file from url ", err);
      });
  };

  function handleSuccess(files) {
    console.log("files >> ", files);
    let promiseArray = [];
    let allLinks = [];
    setLoader(true);
    getInfoToaster("Migrating files to aws s3. Please wait...", 3000);
    files.forEach((file) => {
      allLinks.push(file);
      promiseArray.push(
        uploadFileToS3(
          file,
          file.link,
          "qdox-training-pipeline",
          "dropbox-test/" + file.name
        )
      );
    });
    setAllLinks(allLinks);
    Promise.all(promiseArray)
      .then((res) => {
        setLoader(false);
        getSuccessToaster("All Files migrated successfully!", 3000);
        console.log("all the files uploaded successfully !!");
      })
      .catch((err) => {
        setLoader(false);
        getErrorToaster("Some error while migration!", 3000);
        console.log("some error in uploading files");
      });
  }

  return (
    <div className="App">
      {loader ? <Loader /> : null}
      <h3>Dropbox Picker</h3>
      <table id="chooser-demo-tbl">
        <tbody>
          <tr>
            {/* <td>Chooser button: </td> */}
            <td
              id="chooser-demo"
              style={{ border: "3px dotted black", cursor: "pointer" }}
            >
              <DropboxChooser
                appKey={APP_KEY}
                success={handleSuccess}
                // extensions={[".pdf", ".doc", ".docx"]}
                linkType="direct"
                cancel={() => console.log("closed")}
                folderselect={true}
                multiselect={true}
              >
                Choose files
                {/* <button class="dropbox-dropin-btn dropbox-dropin-success">
                  <span class="dropin-btn-status"></span>Choose Files
                </button> */}
              </DropboxChooser>
            </td>
          </tr>
          {allLinks && allLinks.length ? (
            <tr>
              {/* <td>Returns: </td> */}
              <td>
                <div id="demo-urls">
                  {allLinks && allLinks.length
                    ? allLinks.map((file, index) => {
                        return (
                          <>
                            <a href={file.link} target="blank_">
                              {file.name}
                            </a>
                            <br />
                          </>
                        );
                      })
                    : null}
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
