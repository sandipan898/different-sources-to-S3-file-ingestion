import { notify } from "react-notify-toast";

// function to show Success message
export function getSuccessToaster(message = "Success", timeOut = 3000) {
  notify.show(message, "custom", timeOut, {
    background: "#b0e0a8",
    text: "#721c24"
  });
}

// function to show Error message
export function getErrorToaster(
  message = "Some error Occured",
  timeOut = 3000
) {
  return notify.show(message, "custom", timeOut, {
    background: "#f8d7da",
    text: "#721c24"
  });
}

// function to show Warning message
export function getWarningToaster(
  warningMessage = "Warning Message!!",
  timeOut = 4000
) {
  notify.show(`${warningMessage}`, "custom", timeOut, {
    background: "#FEEFB3",
    text: "#9F6000"
  });
}

// function to show Info message
export function getInfoToaster(infoMessage = "Info Message!!", timeOut = 4000) {
  notify.show(`${infoMessage}`, "custom", timeOut, {
    background: "#BDE5F8",
    text: "#00529B"
  });
}
