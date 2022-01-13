import React, { useState, useEffect } from "react";

import { styled, alpha } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import Divider from "@mui/material/Divider";
import ArchiveIcon from "@mui/icons-material/Archive";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import DropboxFileIngestion from "./cloud-storage-components/DropboxIngestion/DropboxIngestionComponent";
import GoogleDriveIngestion from "./cloud-storage-components/GoogleDriveIngestion/GoogleDriveIngestionComponent";
import AzureFileIngestion from "./cloud-storage-components/AzureFileIngestion/AzureFileIngestionComponent";
import UploadMenu from "./mail-components/MenuComponent";
import Paper from "@mui/material/Paper";

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right"
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right"
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === "light"
        ? "rgb(55, 65, 81)"
        : theme.palette.grey[300],
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0"
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5)
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        )
      }
    }
  }
}));

export default function IngestionHome() {
  const [selected, setSelected] = useState(null);

  const [anchorElCloud, setAnchorElCloud] = React.useState(null);
  const [anchorElMail, setAnchorElMail] = React.useState(null);
  const openCloud = Boolean(anchorElCloud);
  const openMail = Boolean(anchorElMail);

  const handleClickCloud = (event) => {
    setAnchorElCloud(event.currentTarget);
  };
  const handleCloseCloud = () => {
    setAnchorElCloud(null);
  };
  const handleClickMail = (event) => {
    setAnchorElMail(event.currentTarget);
  };
  const handleCloseMail = () => {
    setAnchorElMail(null);
  };

  return (
    <div>
      <Paper>
        <Button
          id="demo-customized-button"
          aria-controls={openCloud ? "demo-customized-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={openCloud ? "true" : undefined}
          variant="contained"
          disableElevation
          onClick={handleClickCloud}
          endIcon={<KeyboardArrowDownIcon />}
        >
          Cloud Storages
        </Button>
        <StyledMenu
          id="demo-customized-menu"
          MenuListProps={{
            "aria-labelledby": "demo-customized-button"
          }}
          anchorEl={anchorElCloud}
          open={openCloud}
          onClose={handleCloseCloud}
        >
          <MenuItem onClick={() => setSelected("azure")} disableRipple>
            <EditIcon />
            Azure BLOB Storage
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => setSelected("dropbox")} disableRipple>
            <FileCopyIcon />
            Dropbox Storage
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => setSelected("google-drive")} disableRipple>
            <ArchiveIcon />
            Google Drive
          </MenuItem>
        </StyledMenu>

        <Button
          id="demo-customized-button"
          aria-controls={openMail ? "demo-customized-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={openMail ? "true" : undefined}
          variant="contained"
          disableElevation
          onClick={handleClickMail}
          endIcon={<KeyboardArrowDownIcon />}
        >
          Mail Ingestions
        </Button>
        <StyledMenu
          id="demo-customized-menu"
          MenuListProps={{
            "aria-labelledby": "demo-customized-button"
          }}
          anchorEl={anchorElMail}
          open={openMail}
          onClose={handleCloseMail}
        >
          <MenuItem onClick={() => setSelected("gmail")} disableRipple>
            <EditIcon />
            Gmail
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => setSelected("outlook")} disableRipple>
            <FileCopyIcon />
            Outlook
          </MenuItem>
        </StyledMenu>
      </Paper>

      <Paper>
        {selected && selected === "azure" ? (
          <AzureFileIngestion />
        ) : selected === "dropbox" ? (
          <DropboxFileIngestion />
        ) : selected === "google-drive" ? (
          <GoogleDriveIngestion />
        ) : selected === "gmail" ? (
          <UploadMenu />
        ) : selected === "outlook" ? (
          <UploadMenu />
        ) : null}
      </Paper>
    </div>
  );

  // return (
  //   <div className="App">
  //     {/* <DropboxFileIngestion /> */}
  //     {/* <GoogleDriveIngestion /> */}
  //     {/* <AzureFileIngestion /> */}
  //     <UploadMenu />

  //   </div>
  // );
}
