let displayHide = "none";
let displayShow = "flex";
let dispalyButtonShow = "inline-block";

function formatDuration(startTimestamp, endTimestamp) {
  // Calculate the difference in milliseconds
  const durationMs = endTimestamp - startTimestamp;

  // Convert milliseconds to hours and minutes
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format the duration
  return `${hours} Hr ${minutes} Min`;
}

async function checkPassword(password) {
  const pass = password.toString().toLowerCase().trim();
  IsLoading(true);
  return new Promise((resolve, reject) => {
    fetch(CHECK_PASSWORD_API + encodeURIComponent(pass))
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok. Status: ${response.status} - ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        IsLoading(false);
        resolve(data); // Resolve the promise with the data
      })
      .catch((error) => {
        IsLoading(false);
        reject(error); // Reject the promise with the error
      });
  });
}

function convertDateToFormat(inputDate) {
  const date = new Date(inputDate);

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short", // Short month name (e.g., Jan, Feb)
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // 12-hour format with AM/PM
  };

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

function convertDate(dateString) {
  // Parse the input date string using moment.js
  const date = moment(dateString, "DD-MM-YYYY HH:mm:ss");

  // Get the formatted date and time
  const formattedDate = date.format("DD MMM YYYY HH:mm A");

  return formattedDate;
}

function convertStringDateToDateWithoutTime(dateString) {
  // Parse the input date string using moment.js
  const date = moment(dateString, "DD-MM-YYYY HH:mm:ss");

  // Get the formatted date and time
  const formattedDate = date.format("DD MMM YYYY");

  return formattedDate;
}

function convertStringDateToTime(dateString) {
  // Parse the input date string using moment.js
  const date = moment(dateString, "DD-MM-YYYY HH:mm:ss");

  // Get the formatted date and time
  const formattedDate = date.format("HH:mm A");

  return formattedDate;
}

function ShowPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function HidePopup(id) {
  document.getElementById(id).style.display = "none";
}

function ClearTextBoxValue(id) {
  document.getElementById(id).value = "";
}

function ClearDivValue(id) {
  document.getElementById(id).textContent = "";
}

function IsLoading(status) {
  if (status) {
    document.getElementById("loadingSpinner").style.display = "flex";
  } else {
    document.getElementById("loadingSpinner").style.display = "none";
  }
}

function adjustTextAreaRows(textarea) {
  // Set the number of rows based on the scroll height to accommodate the text
  textarea.rows = 1; // Reset to 1 row to shrink when necessary
  const lineBreaks = (textarea.value.match(/\n/g) || []).length;
  const minRows = 1;
  textarea.rows = Math.max(minRows, lineBreaks + 1);
}

function disabledButtonState(containerId, buttonId) {
  const container = document.getElementById(containerId);
  const btnControl = container ? container.querySelector(`#${buttonId}`) : null;

  if (container && btnControl) {
    const contentEditableDiv = container.querySelector(
      '[contenteditable="true"]'
    );

    const requiredFields = container.querySelectorAll(
      "input[required], textarea[required], select[required]"
    );
    let allFilled = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        allFilled = false;
      }
      // Special validation for the mobile number field
      if (field.id === "mobileTxtBox") {
        const mobileRegex = /^\d{10}$/; // Using \d for digits
        const mobileIsValid = mobileRegex.test(field.value);
        if (!mobileIsValid) {
          allFilled = false; // Invalid mobile number
        }
      }
    });

    // Check contenteditable div
    if (contentEditableDiv && !contentEditableDiv.textContent.trim()) {
      allFilled = false;
    }
    btnControl.disabled = !allFilled;
  }
}

function resetFormByFormId(formId) {
  // Select the form element by its ID
  const form = document.getElementById(formId);

  // If the form exists, proceed to clear its elements
  if (form) {
    // Select all input, textarea, and select elements within the form
    const elements = form.querySelectorAll(
      "input, textarea, select, [contenteditable='true']"
    );

    // Loop through each element and clear its value
    elements.forEach((element) => {
      if (element.type === "checkbox" || element.type === "radio") {
        // For checkboxes and radio buttons, uncheck them
        element.checked = false;
      } else if (element.hasAttribute("contenteditable")) {
        // Clear the content of contenteditable div
        element.innerHTML = "";
      } else {
        // For other inputs and textareas, clear their values
        element.value = "";
      }
    });
  }
}

function generatePassword(name) {
  const specialChars = "@#$%";

  const firstTwoLetters = name.substring(0, 2).toLowerCase(); // 2 letters
  const special = specialChars.charAt(
    Math.floor(Math.random() * specialChars.length)
  ); // 1 special char
  const timePart = Date.now().toString().slice(-4); // Last 4 digits for high uniqueness

  // Total: 2 (letters) + 1 (symbol) + 4 (timestamp) = 7 characters
  const password = `${firstTwoLetters}${special}${timePart}`;

  return password;
}

function UpdateButtonLabel(id, label) {
  document.getElementById(id).textContent = label;
}

function formatDurationByDurationTime(durationMs) {
  try {
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hr ${minutes} min`;
  } catch (ex) {
    return "0 min";
  }
}

function convertTimeStampToDate(timestamp) {
  let savedDate = null;
  try {
    savedDate = new Date(Number(timestamp));
  } catch (ex) {
    console.log("Error - convertTimeStampToDate - ", ex);
  }

  return savedDate;
}

function GetControlValue(id, type = "input") {
  if (type.toString().toLowerCase() == "checkbox") {
    return document.getElementById(id)?.checked ?? "false";
  }
  return document.getElementById(id)?.value ?? "";
}

//#region Common Method
function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 1000;
  let ms = Math.floor(diffInMs);

  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(3, "0").substring(0, 2); // Showing only 2 digits for milliseconds

  return `${formattedHH}:${formattedMM}:${formattedSS}.${formattedMS}`;
}

function timeToStringWithouMilliSecond(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");

  return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

function formatTimeToDate(timestamp) {
  if (!timestamp) return "";

  const date = new Date(Number(timestamp)); // Convert timestamp to Date object

  // Extract date components
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Months are 0-based, so add 1
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Convert each component to a string
  const dayStr = day < 10 ? "0" + day : day;
  const monthStr = month < 10 ? "0" + month : month;
  const yearStr = year; // No change needed for year
  const hoursStr = hours < 10 ? "0" + hours : hours;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  const secondsStr = seconds < 10 ? "0" + seconds : seconds;

  // Format the date and time in "dd-mm-yyyy hh:mm:ss"
  return `${dayStr}-${monthStr}-${yearStr} ${hoursStr}:${minutesStr}:${secondsStr}`;
}

function formatTimeToAMPM(timestamp) {
  if (!timestamp) return "";

  const date = new Date(Number(timestamp)); // Convert timestamp to Date object

  // Formatting options for 12-hour clock with AM/PM in IST
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour clock format
    timeZone: "Asia/Kolkata", // Set the time zone to IST
  };

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}
//#endregion common method

// Helper function to convert duration string to total minutes
function convertDurationToMinutes(duration) {
  const matches = duration.match(/(\d+)\s*hr\s*(\d+)\s*min/);
  if (!matches) return 0; // Return 0 if the duration format is incorrect
  const hours = parseInt(matches[1], 10);
  const minutes = parseInt(matches[2], 10);
  return hours * 60 + minutes;
}

// Helper function to format total minutes back to "X hr Y min"
function formatMinutesToDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hr ${minutes} min`;
}

function generateTableRowsGeneric(data, tableHeaderId, tableBodyId) {
  const tableBody = document.getElementById(tableBodyId);
  const tableHead = document.getElementById(tableHeaderId);
  // Clear any existing content
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  // Check if data is not empty
  if (data.length === 0) return;

  // Generate the table header
  const headerRow = document.createElement("tr");
  // Use the keys from the first object as headers
  const headers = Object.keys(data[0]);
  headers.forEach((headerCell) => {
    const th = document.createElement("th");
    th.textContent = headerCell;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Generate the table rows
  data.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((headerCell) => {
      const td = document.createElement("td");
      td.textContent = row[headerCell];
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

function SHOW_SUCCESS_POPUP(message) {
  document.getElementById("successMessage").innerHTML = message;
  document.getElementById("successPopup").style.display = "flex";
}

// Function to show the error popup
function SHOW_ERROR_POPUP(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorPopup").style.display = "flex";
}

function CLOSE_INFO_POPUP(popupId) {
  console.log("inside close popup hare krishna");
  document.getElementById(popupId).style.display = "none";
}

function SHOW_SPECIFIC_DIV(divId) {
  // Select all divs with class 'popup'
  const allPopups = document.querySelectorAll(".popup");

  // Hide all popups by setting display to 'none'
  allPopups.forEach((popup) => {
    popup.style.display = "none";

    const textboxes = popup.querySelectorAll('input[type="text"]');
    textboxes.forEach((textbox) => {
      textbox.value = ""; // Clear the value of the textbox
    });
  });

  // Show the specific div with the provided divId
  const targetDiv = document.getElementById(divId);
  if (targetDiv) {
    targetDiv.style.display = "flex"; // Adjust display style as per need
  } else {
    console.error(`Div with id '${divId}' not found.`);
  }
}

function SHOW_CONFIRMATION_POPUP(message, yesCallback, noCallback) {
  const popup = document.getElementById("confirmationPopup");
  const popupMessage = document.getElementById("confirmationMessage");
  const yesButton = document.getElementById("confirmationYesButton");
  const noButton = document.getElementById("confirmationNoButton");

  // Set the message dynamically
  popupMessage.textContent = message;

  // Assign event handlers dynamically
  yesButton.onclick = () => {
    if (typeof yesCallback === "function") {
      yesCallback();
    }
    CLOSE_CONFIRMATION_POPUP();
  };

  noButton.onclick = () => {
    if (typeof noCallback === "function") {
      noCallback();
    }
    CLOSE_CONFIRMATION_POPUP();
  };

  // Show the popup
  popup.style.display = "flex";
}

function CLOSE_CONFIRMATION_POPUP() {
  document.getElementById("confirmationPopup").style.display = "none";
}

function GetCurrentTimeIn24HrFormat() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime24 = `${hours}:${minutes}`;
  return currentTime24;
}

function getTodayDateTimeIST() {
  return moment().utcOffset(330).format("DD MMM YYYY HH:mm:ss"); // IST is UTC+5:30
}

function setupKeyPressHandler(
  containerId,
  buttonId,
  validKeys,
  modifiers = {}
) {
  document.addEventListener("keydown", function (event) {
    const key = event.key === " " ? "Space" : event.key;

    // Check if the container is visible
    const container = document.getElementById(containerId);
    if (container && container.style.display !== "none") {
      // Check if the pressed key is in the list of valid keys
      if (validKeys.includes(key)) {
        // Check for modifier keys (Ctrl, Shift, Alt)
        const isCtrlPressed = event.ctrlKey;
        const isShiftPressed = event.shiftKey;
        const isAltPressed = event.altKey;

        // If modifiers are required, ensure they are pressed
        const ctrlRequired = modifiers.ctrl === true;
        const shiftRequired = modifiers.shift === true;
        const altRequired = modifiers.alt === true;

        // Check if the modifiers are correctly pressed
        const isModifierValid =
          (ctrlRequired === false || isCtrlPressed) &&
          (shiftRequired === false || isShiftPressed) &&
          (altRequired === false || isAltPressed);

        // Trigger action only if modifiers match
        if (isModifierValid) {
          event.preventDefault(); // Prevent default behavior for the key
          const button = document.getElementById(buttonId);
          if (button && button.style.display !== "none") {
            button.click(); // Trigger the button click
          }
        }
      }
    }
  });
}

function SHOW_CONFIRMATION_GRID_POPUP(
  gridData,
  columnNames, // Array of objects containing both display name and actual name [ { displayName: "Item", actualName: "Item" },]
  yesCallback,
  yesLabel = "Yes",
  noLabel = "No",
  statusText = "",
  noCallback = CLOSE_CONFIRMATION_GRID_POPUP
) {
  const popup = document.getElementById("confirmationGridPopup");
  const gridContainer = document.getElementById("confirmationGridContainer");
  const yesButton = document.getElementById("confirmationGridYesButton");
  const noButton = document.getElementById("confirmationGridNoButton");
  const statusTextElement = document.getElementById(
    "confirmationGridStatusText"
  );

  // Set custom button labels
  yesButton.textContent = yesLabel;
  noButton.textContent = noLabel;

  // Clear any existing content in the grid container
  gridContainer.innerHTML = "";
  statusTextElement.textContent = statusText;

  // Create the table element and headers dynamically
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  thead.id = "confirmationGridTHead";
  const headerRow = document.createElement("tr");

  // Add table headers dynamically from columnNames array
  columnNames.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.displayName; // Use displayName for the header
    th.style.border = "1px solid #ddd";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.id = "confirmationGridTBody";

  // Populate table rows dynamically from gridData
  gridData.forEach((item) => {
    const row = document.createElement("tr");

    // Add each data field into a new table cell (td)
    columnNames.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = item[column.actualName] ? item[column.actualName] : ""; // Use actualName to access the data
      td.style.border = "1px solid #ddd";
      td.style.padding = "8px";
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Append the table to the grid container
  gridContainer.appendChild(table);

  // Assign event handlers dynamically
  yesButton.onclick = () => {
    yesCallback();
    CLOSE_CONFIRMATION_GRID_POPUP();
  };
  noButton.onclick = () => {
    noCallback();
  };

  // Show the popup
  popup.style.display = "flex";
}

function CLOSE_CONFIRMATION_GRID_POPUP() {
  document.getElementById("confirmationGridPopup").style.display = "none";
}

async function API_HANDLER_AXIOS(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
    IsLoading(true); // Start loading
    const jsonReq = JSON.stringify(request);
    const response = await axios.post(url, jsonReq);
    const data = response?.data;
    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITHOUT_LOADING_AXIOS(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";

    const jsonReq = JSON.stringify(request);
    const response = await axios.post(url, jsonReq);
    const data = response?.data;

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  }
}

async function API_HANDLER(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
    IsLoading(true); // Start loading

    const fetchOptions = {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
      redirect: "follow",
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITH_APPLICATION_JSON_TYPE(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
    IsLoading(true); // Start loading

    const fetchOptions = {
      redirect: "follow",
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITHOUT_LOADING(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyBpHFrjpU0Hx7RVDIIkMrQS9IIZDkebAqiw_-DxlHKNJYlQl6SalLLwg5VfVGcCt-p/exec";

    const fetchOptions = {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
      redirect: "follow",
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  }
}

async function API_HANDLER_GET(request) {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbyLOEEFs1J-GepV5Ma4N64mku6BWw1wa5ROebVDzYB5oF40BNkmawBnE9KQoGLgsL8W/exec";
    IsLoading(true); // Start loading

    const queryString = new URLSearchParams(request).toString();
    const fullUrl = `${url}?${queryString}`;
    const response = await fetch(fullUrl);
    const data = await response.json();
    IsLoading(false);

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants."
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function IS_ONLINE() {
  try {
    IsLoading(true); // Start loading indicator

    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
      cache: "no-store",
    });

    IsLoading(false); // Stop loading indicator
    return response.ok;
  } catch (error) {
    IsLoading(false);
    SHOW_ERROR_POPUP(
      "Please check your internet connection, it is not working."
    );
    return false;
  }
}

function CREATE_ACCORDIAN_ITEM(accordionContainer, item) {
  const accordionItem = document.createElement("div");
  accordionItem.classList.add("accordion-item");

  const header = document.createElement("button");
  header.classList.add("accordion-header");
  header.innerHTML = `${item.title} <span class="icon">▼</span>`;

  const content = document.createElement("div");
  content.classList.add("accordion-content");

  if (item.links) {
    item.links.forEach((linkData) => {
      const link = document.createElement("a");
      link.href = linkData.href;
      link.textContent = linkData.title; // Set the title for the link
      content.appendChild(link);
    });
  } else if (item.content) {
    content.innerHTML = `<p>${item.content}</p>`;
  }

  header.addEventListener("click", function () {
    const isOpen = content.style.display === "block";
    document.querySelectorAll(".accordion-content").forEach((item) => {
      item.style.display = "none";
    });
    document.querySelectorAll(".accordion-header").forEach((item) => {
      item.classList.remove("active");
    });

    if (!isOpen) {
      content.style.display = "block";
      header.classList.add("active");
    }
  });

  accordionItem.appendChild(header);
  accordionItem.appendChild(content);
  accordionContainer.appendChild(accordionItem);
}

function ADD_OPTION_IN_YEAR_MONTH_DROPDOWN(monthSelectId, yearSelectId) {
  const monthSelect = document.getElementById(monthSelectId);
  const yearSelect = document.getElementById(yearSelectId);

  function populateDropdown(
    selectElement,
    optionsArray,
    defaultText,
    selectedValue
  ) {
    // Clear previous options
    selectElement.innerHTML = "";

    // Add default option
    const defaultOption = new Option(defaultText, "", true, false);
    defaultOption.disabled = true;
    selectElement.appendChild(defaultOption);

    // Add new options dynamically
    optionsArray.forEach((optionValue) => {
      let option = new Option(optionValue, optionValue);

      // Set the default selected value (should be current year)
      if (optionValue === selectedValue) {
        option.selected = true;
      }

      selectElement.appendChild(option);
    });
  }

  // Months Array
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()]; // Get current month name
  const currentYear = currentDate.getFullYear(); // Get current year

  // Years Array (Previous Year to 6 Years Ahead)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 1 + i);

  // Populate Dropdowns with default selected values
  populateDropdown(monthSelect, months, "Month", currentMonth);
  populateDropdown(yearSelect, years, "Year", currentYear); // Selected value is currentYear
}

async function CALL_API(apiType, data) {
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    const request = {
      apiType: apiType,
      inputData: data,
    };
    try {
      const response = await API_HANDLER_AXIOS(request);
      if (response) {
        return response;
        //
      } else {
        SHOW_ERROR_POPUP("Something Went Wrong");
      }
    } catch (ex) {
      SHOW_ERROR_POPUP("Error :- " + ex);
    }
  }
}

async function CALL_API_WITHOUT_LOADING(apiType, data) {
  const request = {
    apiType: apiType,
    inputData: data,
  };
  try {
    const response = await API_HANDLER_WITHOUT_LOADING_AXIOS(request);
    if (response) {
      return response;
      //
    } else {
      SHOW_ERROR_POPUP("Something Went Wrong");
    }
  } catch (ex) {
    SHOW_ERROR_POPUP("Error :- " + ex);
  }
}

function MAP_HEADERS_TO_VALUES_BY_KEYED_GROUP(dataByGroup, ignoreKeys = []) {
  const result = {};

  for (const groupKey in dataByGroup) {
    const { header, data } = dataByGroup[groupKey];

    const mapped = {};

    header.forEach((key, index) => {
      const value = data[index];

      if (value && !ignoreKeys.includes(key)) {
        mapped[key] = value;
      }
    });

    if (Object.keys(mapped).length > 0) {
      result[groupKey] = mapped;
    }
  }

  return result;

  /*
      const dataByGroup = {
      "Group A": {
        header: ["Name", "Age", "City"],
        data: ["Alice", "25", "New York"]
      },
      "Group B": {
        header: ["Name", "Age", "City"],
        data: ["Bob", "", "Los Angeles"]
      }
    };

    OUTPUT:- 
    {
      "Group A": {
        Name: "Alice",
        Age: "25",
        City: "New York"
      },
      "Group B": {
        Name: "Bob",
        City: "Los Angeles"
      }
    }
      */
}

function callFilterLiveSearchList(
  inputCtrlId,
  clearBtnCtrlId,
  ulListId,
  callback
) {
  const inputCtrl = document.getElementById(inputCtrlId);
  const ulList = document.getElementById(ulListId);
  const clearBtn = document.getElementById(clearBtnCtrlId);
  const input = inputCtrl.value.toLowerCase();
  const items = ulList.getElementsByTagName("li");
  let hasVisibleItems = false;

  for (const item of items) {
    const liveSearchValue = item.textContent.toLowerCase();
    if (liveSearchValue.includes(input)) {
      item.style.display = ""; // Show the item
      hasVisibleItems = true;
      item.onclick = function () {
        if (clearBtn) clearBtn.style.display = "block";
        callSetupLiveSearchClearableInput(inputCtrlId, clearBtnCtrlId);
        inputCtrl.value = item.textContent; // Set input value to selected item
        ulList.style.display = "none"; // Hide list after selection
        hasVisibleItems = false;
        if (callback) callback(item.textContent); // Call the callback with the selected text
      };
    } else {
      item.style.display = "none"; // Hide the item
    }
  }

  ulList.style.display = hasVisibleItems ? "block" : "none"; // Show/hide the list based on visible items
  if (clearBtn) clearBtn.style.display = input ? "block" : "none";
  callSetupLiveSearchClearableInput(inputCtrlId, clearBtnCtrlId);
}

function callHideLiveSearchOnClick(inputCtrlId, clearBtnCtrlId, ulListId) {
  document.addEventListener("click", function (event) {
    const ulList = document.getElementById(ulListId);
    const inputCtrl = document.getElementById(inputCtrlId);

    // Check if the click is outside the input and list
    if (event.target !== inputCtrl && !ulList.contains(event.target)) {
      ulList.style.display = "none"; // Hide the list
    }
  });
}

function callSetupLiveSearchClearableInput(
  liveSearchinputId,
  liveSearchClearBtnId
) {
  const input = document.getElementById(liveSearchinputId);
  const clearBtn = document.getElementById(liveSearchClearBtnId);

  if (!input || !clearBtn) {
    console.error("Invalid input or clear button ID");
    return;
  }

  input.addEventListener("input", function () {
    clearBtn.style.display = this.value ? "block" : "none";
  });

  clearBtn.addEventListener("click", function () {
    input.value = "";
    clearBtn.style.display = "none";
    input.focus(); // Keep the textbox active
  });
}

function setupLiveSearch(inputCtrlId, clearBtnCtrlId, ulListId, callback) {
  const inputCtrl = document.getElementById(inputCtrlId);

  inputCtrl.addEventListener("keyup", function () {
    callFilterLiveSearchList(
      inputCtrlId,
      clearBtnCtrlId,
      ulListId,
      function (selectedText) {
        // Call the callback to handle the selected text based on input type
        if (callback) callback(selectedText);
      }
    );
  });

  // Click event to toggle the dropdown list
  inputCtrl.addEventListener("click", function () {
    callFilterLiveSearchList(
      inputCtrlId,
      clearBtnCtrlId,
      ulListId,
      function (selectedText) {
        // Call the callback to handle the selected text based on input type
        if (callback) callback(selectedText);
      }
    );
  });

  // Call the generic function to handle hiding the dropdown
  callHideLiveSearchOnClick(inputCtrlId, clearBtnCtrlId, ulListId);
}

function initializedLiveSearchControl(
  inputCtrlId,
  clearBtnCtrlId,
  ulListId,
  responseArray
) {
  const inputCtrl = document.getElementById(inputCtrlId);
  const ulList = document.getElementById(ulListId);

  ulList.innerHTML = "";
  responseArray?.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.onclick = () => {
      inputCtrl.value = item;
      ulList.style.display = "none";
      callSetupLiveSearchClearableInput(inputCtrlId, clearBtnCtrlId);
    };
    ulList.appendChild(li);
  });
}
