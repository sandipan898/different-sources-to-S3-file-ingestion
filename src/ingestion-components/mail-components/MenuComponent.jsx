import React, { useEffect } from "react";
import GmailAttachments from "./GmailIngestion/GmailIAttachments";
import OutlookAttachments from "./OutlookIngestion/OutlookAttachments";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-fresh.css";
import "ag-grid-community";
import { makeStyles } from "@mui/styles";
import * as AWS from "aws-sdk";
import { Buffer } from "buffer";

import {
  getAuthStatus,
  getAttachment,
  handleGAuth
} from "./GmailIngestion/helper/GmailHelper";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TablePagination from "@mui/material/TablePagination";
import Checkbox from "@mui/material/Checkbox";
import { Button } from "@mui/core";

/**
 * props required:-
 * 1. showUploadModal:  a boolean variable used to control modal displayed
 * 2. onCloseUploadFileModal: a post-processing function to be run after uploading file and for closing the modal
 * 3. bucketName: s3 bucket name
 * 4. folderName: s3 folder name
 * 5. acceptSingle: allows only sigle file upload
 */

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
  }
}));

// const AWS_IDENTITY_POOL_ID = process.env.REACT_APP_AWS_IDENTITY_POOL_ID;
// const AWS_REGION = process.env.REACT_APP_AWS_REGION;
const GMAIL_INGESTION_BUCKET = "qdox-training-pipeline";
const BUCKET_INPUT_FOLDER = "demo_mailing_ingestion";
const AWS_IDENTITY_POOL_ID = "us-east-1:9b9e38cd-3ae5-4c5a-9636-d247dc100b7b";
const AWS_REGION = "us-east-1";

AWS.config.region = AWS_REGION; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: AWS_IDENTITY_POOL_ID
});

const UploadMenu = (props) => {
  const [showOptions, setShowOptions] = React.useState(0);
  // const frameworkComponents = { CheckboxRenderer: CheckboxRenderer };
  const [selectedAttachments, setSelectedAttachments] = React.useState([]);
  const [rowData, setRowData] = React.useState([]);
  const [filterNameParam, setFilterNameParam] = React.useState([]);
  const [isFilterApplied, setIsFilterApplied] = React.useState(false);
  const [filteredData, setFilteredData] = React.useState([]);
  const [loader, setLoader] = React.useState(false);
  const defaultColDef = { resizable: true, filter: true };
  const acceptSingle = props.acceptSingle || false;
  // const AwsService = new UploadMenuHelperAwsService();

  // const bucketName = process.env.REACT_APP_GMAIL_INGESTION_BUCKET || "";
  // const folderName = process.env.REACT_APP_BUCKET_INPUT_FOLDER || "";

  const bucketName = GMAIL_INGESTION_BUCKET || "";
  const folderName = BUCKET_INPUT_FOLDER || "";
  const classes = useStyles();

  const onDrop = React.useCallback((acceptedFiles) => {
    // console.log("acceptedFiles >> ",acceptedFiles);
    setFiles(acceptedFiles);
  }, []);
  // const { getRootProps, isDragActive } = useDropzone({
  //     onDrop,
  //     //   accept: 'application/pdf'
  // });
  const [files, setFiles] = React.useState([]);
  const [droppedFile, setDroppedFile] = React.useState([]);

  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const columnDefs = [
    {
      headerName: "Selection",
      width: 100,
      filter: false,
      field: "selection",
      cellRenderer: "CheckboxRenderer"
    },
    {
      headerName: "Attachment",
      field: "filename",
      cellStyle: { display: "flex", justifyContent: "flex-start" },
      filter: true,
      sortable: true,
      resizable: true,
      editable: false,
      width: 200
    },
    {
      headerName: "Date",
      field: "date",
      cellStyle: { display: "flex", justifyContent: "flex-start" },
      cellRendererFramework: (params) => {
        return (
          <div>{`${params.data.date.getFullYear()}/${
            params.data.date.getMonth() + 1
          }/${params.data.date.getDate()}`}</div>
        );
      },
      filter: true,
      sortable: true,
      resizable: true,
      editable: false,
      width: 200
    },
    {
      headerName: "View",
      field: "",
      width: 100,
      cellRendererFramework: (params) => {
        // console.log("params >> ", params);

        return (
          <i
            onClick={(e) => {
              openAttachment(params.data);
            }}
            className="fas fa-flag fa-stack-1x fa-eye fa-inverse"
            style={{ color: "#0075af", cursor: "pointer" }}
          ></i>
        );
        // return <p onClick={() => goToAnalysisFiles(params)}>{params.data[params.colDef.field]}</p>
        // <span><i className="fas fa-edit highlightIconStyle" onClick={() => goToAnalysisFiles(params)}></i></span>
      }
    }
  ];

  React.useEffect(() => {
    //sign-out gmail user on closing of modal
    return () => {
      if (getAuthStatus()) handleGAuth(false);
    };
  }, []);

  const cellClick = (e) => {
    console.log(e.data);
    if (e.colDef.field === "selection") {
      const booleanValue = e.data[e.colDef.field];
      let selectedRows = JSON.parse(JSON.stringify(selectedAttachments));
      // console.log("event other delete column >> ",e, selectedRows);
      if (!booleanValue) {
        selectedRows = selectedRows.filter((row) => {
          return row.rowIndex !== e.rowIndex;
        });
      } else {
        if (
          selectedRows.length &&
          selectedRows.some((row) => row.rowIndex === e.rowIndex)
        ) {
          selectedRows = selectedRows.map((row) => {
            if (row.rowIndex === e.rowIndex) {
              return { ...row, [e.colDef.field]: true };
            }
            return { ...row };
          });
        } else {
          selectedRows.push({ ...e.data, rowIndex: e.rowIndex });
          // console.log("deleteRows >> ",{...e.data, rowIndex : e.rowIndex },deleteRows,booleanValue);
        }
      }
      //console.log("deleteRowsData >> ",deleteRows);
      console.log("selected rows >>>", selectedRows);
      setSelectedAttachments(selectedRows);
    }
  };

  const processName = (filename) => {
    let nameParts = filename.split(" ");
    let processedName = nameParts.join("_");
    return processedName;
  };

  const handleUploadFile = async () => {
    console.log(
      "uploadFile selectedAttachments>> ",
      selectedAttachments,
      selected
    );
    setLoader(true);
    let promiseArray = [];
    selected.forEach(async (file) => {
      let name = file.filename.substring(0, file.filename.lastIndexOf("."));
      let processedFilename = processName(name);

      let base64FileAttachment = "",
        fileType = "";
      //for gmail attachments
      if (showOptions === 1) {
        base64FileAttachment = await getAttachment(
          file.body.attachmentId,
          file.messageId
        );
        fileType = file.mimeType.split("/")[1];
      }
      //for outlook attachments
      else if (showOptions === 2) {
        base64FileAttachment = file.contentBytes;
        fileType = file.contentType.split("/")[1];
      }
      promiseArray.push(
        uploadFileToS3(
          file,
          fileType,
          base64FileAttachment,
          bucketName,
          `${folderName}/` + processedFilename
        )
      );
    });

    Promise.all(promiseArray)
      .then((res) => {
        setLoader(false);
        console.log("all the files uploaded successfully !!");
      })
      .catch((err) => {
        setLoader(false);
        console.log("some error in uploading files");
      });
  };

  const b64toBlob = (b64Data, contentType = "", sliceSize = 512, dataURI) => {
    const byteCharacters = atob(b64Data);
    // var byteString = atob(dataURI.split(',')[1]);
    // separate out the mime component
    // var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteCharacters.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteCharacters.length; i++) {
      ia[i] = byteCharacters.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], { type: contentType });
    return blob;
  };

  const uploadFileToS3 = (file, fileType, base64FileString, bucket, key) => {
    try {
      let buf = Buffer.from(base64FileString, "base64");
      // let url = `data:${fileType};base64,${base64FileString}`
      // let blob = b64toBlob(base64FileString, fileType, url)
      console.log("uploadFileToS3", buf, base64FileString);
      return new Promise((resolve, reject) => {
        if (AWS) {
          const s3 = new AWS.S3();
          // method 1
          s3.upload(
            {
              Key: key + "." + fileType,
              Bucket: bucket,
              Body: buf,
              ACL: "private",
              ContentType: `application/${fileType}`,
              ContentEncoding: "base64"
              // Metadata: {
              //   username: window.localStorage.getItem("loggedInUser")
              // }
            },
            (err, data) => {
              console.log("data after upload", data);
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
          // method 2
          // const params = {
          //     ContentType: blob.type.toString().contains('application') ? blob.type : `application/${blob.type}`,
          //     ContentLength: blob.size.toString(),
          //     ContentEncoding: 'base64',
          //     Bucket: bucket,
          //     Body: blob,
          //     Key: key + "." + fileType
          // };
          // console.log("params >> ", params);
          // return s3.putObject(params).promise();
        } else {
          reject("Missing AWS Client");
        }
      });
      // method 3
      // return fetch(url, {
      //     method: "GET",
      //     mode: "cors", // no-cors, *cors, same-origin
      //     headers: {
      //       "Access-Control-Allow-Origin": '*',
      //       "Access-Control-Allow-Credentials": true,
      //     }
      //   })
      //     .then((x) => {
      //       console.log("x", x);
      //       return x.blob();
      //     })
      //     .then((response) => {
      //       console.log("response >> ", response);
      //       const params = {
      //         ContentType: fileType,
      //         // ContentType: mimeType,
      //         ContentLength: response.size.toString(), // or response.header["content-length"] if available for the type of file downloaded
      //         Bucket: bucket,
      //         Body: response,
      //         Key: key + "." + fileType
      //       };
      //       console.log("params >> ", params);
      //       const s3 = new AWS.S3();
      //       return s3.putObject(params).promise();
      //     })
      //     .catch((err) => {
      //       console.log("error fetching file from url ", err);
      //     });
    } catch (error) {
      setLoader(false);
      console.log("some error occured while file upload >> ", error);
      alert(`Some error for Document - ${file.filename}`, 2500);
    }
  };

  const openAttachment = async (attachment) => {
    let pdfString = "";
    if (showOptions === 1) {
      pdfString = await getAttachment(
        attachment.body.attachmentId,
        attachment.messageId
      );
      if (pdfString === "Error") {
        alert(`Couldn't fetch attachment!`, 3000);
        return;
      } else {
        let pdfWindow = window.open("");
        setTimeout(() => {
          pdfWindow.document.write(
            "<iframe width='100%' height='100%' src='data:" +
              attachment.mimeType +
              ";base64," +
              pdfString +
              "'></iframe>"
          );
          // window.open("data:" + attachment.mimeType + ";base64," + pdfString)
        }, 100);
      }
    } else if (showOptions === 2) {
      pdfString = attachment.contentBytes;
      let pdfWindow = window.open("");
      setTimeout(() => {
        pdfWindow.document.write(
          "<iframe width='100%' height='100%' src='data:" +
            attachment.contentType +
            ";base64," +
            pdfString +
            "'></iframe>"
        );
      }, 100);
    }
    console.log("pdfstring>>", pdfString);
  };

  const changeHandler = (e) => {
    //console.log(e.target.value);
    let nameParam = e.target.value;
    setFilterNameParam(nameParam);
    if (nameParam.length === 0) {
      setIsFilterApplied(false);
    } else {
      const dataFiltered = rowData.filter((data) =>
        data.filename.toLowerCase().includes(nameParam.toLowerCase())
      );
      setFilteredData(dataFiltered);
      setIsFilterApplied(true);
    }
  };

  const callUpload = (event) => {
    const files = event.target.files;
    setFiles(files);
    document.getElementById("getFile").click();
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rowData.map((n) => n);
      setSelected(newSelecteds);
      console.log("handleSelectAllClick", newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowData.length) : 0;

  const data = isFilterApplied ? filteredData : rowData;

  return (
    <div>
      {
        // showOptions !== 0 ?
        //     <div className="row" style={{ justifyContent: "space-between", width: "85%", margin: "0 auto" }}>
        //         {/* <div className="col-md-4"></div> */}
        //         <div className="col-md-3 mb-2" style={{ marginTop: "30px", alignItems: "center", paddingLeft: "0", paddingRight: "0" }}>
        //             <Button className="btn button-style btn-sm"
        //                 style={{
        //                     height: "33px",
        //                     cursor: "pointer",
        //                     display: "flex",
        //                     margin: "10px 10px 10px 0",
        //                     border: "1px solid #229FFF",
        //                     backgroundColor: "#FFFFFF",
        //                     color: "#000000",
        //                     width: "fit-content"
        //                 }}
        //                 onClick={(e) => { setShowOptions(0) }}>
        //                 <i className="fas fa-arrow-circle-left" style={{ margin: "auto", paddingRight: "5px" }}></i> Back
        //             </Button>
        //         </div>
        //         <div className="col-md-6 input-group mb-2" style={{ marginTop: "30px", alignItems: "center", paddingLeft: "0", paddingRight: "0" }}>
        //             <input type="text" className="form-control" placeholder="Search Attachments" onChange={changeHandler}
        //                 value={filterNameParam} />
        //             <div className="input-group-append">
        //                 <button className="btn hi" type="button" style={{ backgroundColor: "#008ED5", opacity: "1", }}>
        //                     <i className="fa fa-search" style={{ color: "white" }}></i>
        //                 </button>
        //             </div>
        //         </div>
        //     </div> : null
      }

      {showOptions === 0 ? (
        <div className="row">
          <div className="col-md-12" style={{ textAlign: "center" }}>
            <GmailAttachments
              setShowOptions={setShowOptions}
              setRowData={setRowData}
            />
            <b style={{ margin: "10px" }}>(or)</b>
            <OutlookAttachments
              setShowOptions={setShowOptions}
              setRowData={setRowData}
            />
          </div>
        </div>
      ) : null}

      {showOptions !== 0 ? (
        <div id="adminPage--CollapeTable-Grid" className="ag-theme-material">
          {rowData.length > 0 ? (
            <>
              {/* <React.Fragment>
                                    <AgGridReact
                                        columnDefs={columnDefs}
                                        defaultColDef={defaultColDef}
                                        debug={true}
                                        rowSelection='multiple'
                                        paginationPageSize={8}
                                        onCellClicked={cellClick}
                                        pagination={true}
                                        rowData={isFilterApplied ? filteredData : rowData}
                                        frameworkComponents={frameworkComponents}
                                    />
                                </React.Fragment> */}
            </>
          ) : null}
          <Paper>
            <TableContainer component={Paper}>
              <Table
                sx={{ minWidth: 650 }}
                aria-label="simple table"
                checkboxSelection
              >
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        // indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={
                          rowData.length > 0 &&
                          selected.length === rowData.length
                        }
                        onChange={handleSelectAllClick}
                        inputProps={{
                          "aria-label": "select all desserts"
                        }}
                      />
                    </TableCell>
                    <TableCell>Attachment Name</TableCell>
                    <TableCell align="right">Date</TableCell>
                    <TableCell align="right">File Type</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => {
                    const isItemSelected = isSelected(row);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    return (
                      <TableRow
                        key={
                          row.body && row.body.attachmentId
                            ? row.body.attachmentId
                            : row.id
                        }
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 }
                        }}
                        hover
                        onClick={(event) => handleClick(event, row)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        selected={isItemSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{
                              "aria-labelledby": labelId
                            }}
                          />
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.filename}
                        </TableCell>
                        <TableCell align="right">
                          {row.date.getFullYear()}/{row.date.getMonth() + 1}/
                          {row.date.getDate()}
                        </TableCell>
                        <TableCell align="right">{row.mimeType}</TableCell>
                        <TableCell align="right">
                          <button onClick={() => openAttachment(row)}>
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={data.length}
              rowsPerPage={5}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </div>
      ) : null}

      {data && data.length ? (
        <Button
          style={{ padding: "10px", margin: "10px" }}
          onClick={handleUploadFile}
        >
          Migrate to S3
        </Button>
      ) : null}
    </div>
  );
};

export default UploadMenu;
