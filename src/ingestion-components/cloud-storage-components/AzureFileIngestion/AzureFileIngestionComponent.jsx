import React from "react";
import _ from "lodash";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import { Formik, Field, Form } from "formik";

import * as AWS from "aws-sdk";

// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableHead from '@mui/material/TableHead';
// import TableRow from '@mui/material/TableRow';
// import Paper from '@mui/material/Paper';

// import '../config';

//Import Azure storage blob SDK modules

import {
  Aborter,
  ServiceURL,
  ContainerURL,
  StorageURL,
  AnonymousCredential
} from "@azure/storage-blob";
// const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

//Azure account name and container to read blobs from

const ACCOUNT = process.env.REACT_APP_ACCOUNT;
const CONTAINER = process.env.REACT_APP_CONTAINER;
const ACCOUNT_SAS = process.env.REACT_APP_ACCOUNT_SAS;
const AWS_IDENTITY_POOL_ID = "us-east-1";
const AWS_REGION = "us-east-1:9b9e38cd-3ae5-4c5a-9636-d247dc100b7b";

AWS.config.region = AWS_REGION; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: AWS_IDENTITY_POOL_ID
});

export default class AzureFileIngestion extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
      pages: 2,
      markers: [],
      loading: true,
      prefix: "",
      accountName: "",
      containerName: "",
      containerType: "",
      accountSAS: "",
      isInputDone: false
    };
    this.fetchData = this.listBlobs.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleMigrateToS3 = this.handleMigrateToS3.bind(this);
  }

  handleUserInput(inputs) {
    console.log(inputs);
    this.setState({
      accountName: inputs.accountName,
      containerName: inputs.containerName,
      containerType: inputs.containerType,
      accountSAS: inputs.accountSAS,
      isInputDone: true
    });
  }

  handleMigrateToS3(event) {
    console.log("handleSuccess files >> ", this.state.data);
    let promiseArray = [];
    let allLinks = [];
    this.state.data.forEach((file) => {
      let fileURL = this.renderLink(file.name, false);
      allLinks.push(fileURL);
      promiseArray.push(
        this.uploadFileToS3(
          file,
          fileURL,
          "qdox-training-pipeline",
          "azure_ingestion_test/" + file.name
        )
      );
    });

    // setAllLinks(allLinks);
    Promise.all(promiseArray)
      .then((res) => {
        // setLoader(false);
        console.log("all the files uploaded successfully !!");
      })
      .catch((err) => {
        // setLoader(false);
        console.log("some error in uploading files");
      });
  }

  uploadFileToS3(file, url, bucket, key) {
    console.log("uploadFileToS3 >> ", url);
    const corsWhitelist = [
      "https://6g1u8.csb.app/",
      "http://localhost:3000/",
      "*"
    ];
    // return fetch(url.substring(0, url.indexOf("/view")), {
    return fetch(url, {
      method: "GET",
      mode: "cors", // no-cors, *cors, same-origin
      headers: {
        "Access-Control-Allow-Origin": corsWhitelist,
        "Access-Control-Allow-Credentials": true
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
  }

  listBlobs(state, instance) {
    //This lists blobs in pages defined in state.pagesize
    this.setState({ loading: true });

    //Use AnonymousCredential since container is made a 'public container' and does not require authorization
    const anonymousCredential = new AnonymousCredential();
    const pipeline = StorageURL.newPipeline(anonymousCredential);

    const serviceURL = new ServiceURL(
      `https://${this.state.accountName}.blob.core.windows.net/${this.state.accountSAS}`,
      pipeline
    );

    //If you are using a SAS token, append to container below
    //We are using anonymous access here at the moment. See above.

    // const containerName = container + accountSAS
    const containerName = this.state.containerName;
    const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

    //Fetch the prefix in the query params to browse into folders

    const urlParams = new URLSearchParams(window.location.search);
    const prefix = urlParams.get("prefix");

    //List objects from blog storage including folders including metadata. Delimiter for virtual directors(folders) is a forward slash.

    containerURL
      .listBlobHierarchySegment(Aborter.none, "/", state.markers[state.page], {
        include: ["metadata"],
        maxresults: state.pagesize,
        prefix: prefix
      })
      .then((res) => {
        //Store the nextMarker in an arra for prev/next buttons only if there are more blobs to show

        const markers = state.markers.slice();
        var totalPages = state.page + 1;
        if (res.nextMarker) {
          markers[state.page + 1] = res.nextMarker;
          totalPages++;
        }

        //Combine the found virtual directories and files

        Array.prototype.push.apply(
          res.segment.blobItems,
          res.segment.blobPrefixes
        );

        //This is to sort rows and handles blobName, contentLength and lastModified

        const sortedData = _.orderBy(
          res.segment.blobItems,
          state.sorted.map((sort) => {
            return (row) => {
              if (row[sort.id] === null) {
                return -Infinity;
              }
              //Following is a workaround to special case contentLength and lastModified
              else if (row[sort.id] === undefined) {
                if (row.properties === undefined) {
                  return -Infinity;
                } else {
                  return row.properties[sort.id];
                }
              }
              return typeof row[sort.id] === "string"
                ? row[sort.id].toLowerCase()
                : row[sort.id];
            };
          }),
          state.sorted.map((d) => (d.desc ? "desc" : "asc"))
        );

        //Store the state

        this.setState({
          data: sortedData,
          pages: totalPages,
          markers: markers,
          loading: false,
          prefix: prefix
        });
      });
  }

  //Custom links for various scenarios (handles blobs, directories and go back link)

  renderLink(blobName, shouldRender = true) {
    console.log("renderLink", blobName);
    var link;
    if (blobName === "../") {
      link = "=";
    } else if (blobName.slice(-1) === "/") {
      link = "?prefix" + blobName;
      blobName = (
        <span>
          <i className="fas fa-folder">&nbsp;</i>
          {blobName}
        </span>
      );
    } else {
      link = `https://${this.state.accountName}.blob.core.windows.net/${this.state.containerName}/${blobName}${this.state.accountSAS}`;
    }

    return shouldRender ? (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={link}
        className="blob-link"
      >
        {blobName}
      </a>
    ) : (
      link
    );
  }

  render() {
    const { data, pages, markers, loading, prefix } = this.state;

    //If this is a directory/folder view, add a go back link for the root

    var dataset = data;
    if (prefix != null) {
      dataset = [{ name: "../" }].concat(dataset);
    }

    const tableHeader = [
      "Blob name",
      "Publisher",
      "Category",
      "License",
      "Content size",
      "Content Type",
      "Last Modified",
      "Download"
    ];

    //Here we return the react-table with the blob data mapped to it

    return (
      <div>
        <div>
          <Formik
            initialValues={{
              accountName: "",
              containerName: "",
              accountSAS: ""
            }}
            onSubmit={async (values) => {
              this.handleUserInput(values);
            }}
          >
            {({ values }) => (
              <Form>
                <label htmlFor="accountName">Account Name</label>
                <Field id="accountName" name="accountName" /> <br /> <br />
                <label htmlFor="containerName">Container Name</label>
                <Field id="containerName" name="containerName" /> <br /> <br />
                Container Type
                <label>
                  <Field type="radio" name="containerType" value="private" />
                  private
                </label>
                <label>
                  <Field type="radio" name="containerType" value="public" />
                  public
                </label>{" "}
                <br /> <br />
                {values.containerType === "private" ? (
                  <>
                    <label htmlFor="accountSAS">Container SAS Token</label>
                    <Field
                      id="accountSAS"
                      name="accountSAS"
                      // placeholder="jane@acme.com"
                      type="accountSAS"
                    />{" "}
                    <br /> <br />
                  </>
                ) : (
                  <></>
                )}
                <button type="submit">Submit</button>
              </Form>
            )}
          </Formik>
        </div>
        <br />
        {this.state.isInputDone &&
        this.state.accountName &&
        this.state.containerName ? (
          <div>
            <ReactTable
              columns={[
                {
                  Header: "Blob name",
                  id: "name",
                  accessor: "name",
                  maxWidth: "35%",
                  Cell: (row) => this.renderLink(row.value)
                },
                {
                  Header: "Publisher",
                  id: "publisher",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return d.metadata.Publisher;
                    }
                  },
                  maxWidth: "35%"
                },

                {
                  Header: "Category",
                  id: "category",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return d.metadata.Category;
                    }
                  },
                  maxWidth: "35%"
                },

                {
                  Header: "License",
                  id: "license",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return d.metadata.License;
                    }
                  },
                  maxWidth: "35%"
                },
                {
                  Header: "Content size",
                  id: "contentLength",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return (
                        Math.floor(d.properties.contentLength / 1000) + "KB"
                      );
                    }
                  },
                  maxWidth: "10%"
                },
                {
                  Header: "Content Type",
                  id: "contentType",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return d.properties.contentType;
                    }
                  },
                  maxWidth: "10%"
                },
                {
                  Header: "Last Modified",
                  id: "lastModified",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return d.properties.lastModified.toISOString();
                    }
                  },
                  maxWidth: "10%"
                },
                {
                  Header: "Download",
                  id: "download",
                  accessor: (d) => {
                    if (typeof d.properties !== "undefined") {
                      return (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={
                            `https://${this.state.accountName}.blob.core.windows.net/` +
                            this.state.containerName +
                            "/" +
                            d.name +
                            this.state.accountSAS
                          }
                        >
                          <i className="fas fa-cloud-download-alt blob-download-icon"></i>
                        </a>
                      );
                    }
                  },
                  maxWidth: "10%"
                }
              ]}
              manual // Instruction to react-table to not paginate as we can only list objects in pages from blob storage
              data={dataset}
              pages={pages}
              markers={markers}
              loading={loading}
              onFetchData={this.fetchData}
              defaultPageSize={10}
              className="-highlight"
            />

            {/* <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        {
                                            tableHeader.map(header => (
                                                <TableCell>{header}</TableCell>
                                            ))
                                        }
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dataset.map((row) => (
                                        <TableRow
                                            key={row.name}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="right">{row.calories}</TableCell>
                                            <TableCell align="right">{row.fat}</TableCell>
                                            <TableCell align="right">{row.carbs}</TableCell>
                                            <TableCell align="right">{row.protein}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer> */}
          </div>
        ) : (
          <div></div>
        )}
        <button
          onClick={this.handleMigrateToS3()}
          style={{ backgroundColor: "blue", color: "#fff" }}
        >
          Migrate to S3
        </button>
      </div>
    );
  }
}
