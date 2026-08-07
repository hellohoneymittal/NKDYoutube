//api constant
const SAVE_JAPA_DATA =
  "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
const SAVE_HEARING_DATA =
  "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
const SAVE_READING_DATA =
  "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
const CHECK_PASSWORD_API =
  "https://script.google.com/macros/s/AKfycbw6xp8f4KopdloxGYNGQYWWEU6E_eM_-Zd6CrILLjBdUjPRF0o3LQow624rtsBOEhK9-w/exec?password=";
const NEW_REGISTRATION_API =
  "https://script.google.com/macros/s/AKfycbwMaDkwCi4zy8PpL7lOB31vf0MvSVQxHgOYl-gI4srhU4UCpsDCDdNY2I-NR2NxjkOJ/exec";
const GET_REPORT_DATA_API =
  "https://script.google.com/macros/s/AKfycbyVYnlqM80Or-jMlhQLEWc8nLT-SG_ffUx0JUAknkP8odfC_MVvRPYKChQxxD3ryueJ/exec?password=";
const GET_READING_REPORT_DATA_API =
  "https://script.google.com/macros/s/AKfycbyVYnlqM80Or-jMlhQLEWc8nLT-SG_ffUx0JUAknkP8odfC_MVvRPYKChQxxD3ryueJ/exec";
const GET_HEARING_REPORT_DATA_API =
  "https://script.google.com/macros/s/AKfycbyVYnlqM80Or-jMlhQLEWc8nLT-SG_ffUx0JUAknkP8odfC_MVvRPYKChQxxD3ryueJ/exec";
const GET_SADHNA_REPORT_DATA_API =
  "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";
const GET_JAPA_MONTHLY_AVG =
  "https://script.google.com/macros/s/AKfycbyZizkyxYkhw4Jx0gC6ZpMugtO8jEZWs4neIbn7EdSUV2VqXeXBimdPPdmjW24-eFq9/exec";

//others
const DATE_FORMAT_CONSTANT = {
  grid: "DD-MMM-YY",
  database: "yyyy-MM-dd",
  gridWithDate: "DD-MMM-YY hh:mm A",
};

const API_CONSTANT = {
  POPULATE_REPORT_DATA_JRHM: "POPULATE_REPORT_DATA_JRHM",
  GET_ALL_SMALL_BOOK_MCQ: "GET_ALL_SMALL_BOOK_MCQ",
  GET_ALL_SMALL_BOOK_MCQ_RESULT: "GET_ALL_SMALL_BOOK_MCQ_RESULT",
  GET_ALL_BG_MCQ: "GET_ALL_BG_MCQ",
  GET_ALL_BHAGAVATAM_MCQ: "GET_ALL_BHAGAVATAM_MCQ",
  GET_ALL_OTHER_LECTURES_MCQ: "GET_ALL_OTHER_LECTURES_MCQ",

  GET_YOUTUBE_PLAYLIST_DATA: "GET_YOUTUBE_PLAYLIST_DATA",
  GET_ALL_CHAITANYA_BHAGAVATA_MCQ: "GET_ALL_CHAITANYA_BHAGAVATA_MCQ",
  GET_BG_LECTURE_MCQ_RESULT: "GET_BG_LECTURE_MCQ_RESULT",
  GET_SB_LECTURE_MCQ_RESULT: "GET_SB_LECTURE_MCQ_RESULT",
  GET_CB_LECTURE_MCQ_RESULT: "GET_CB_LECTURE_MCQ_RESULT",
  GET_OTHER_LECTURES_MCQ_RESULT: "GET_OTHER_LECTURES_MCQ_RESULT",

  GET_ALL_DEVOTEES_LIST: "GET_ALL_DEVOTEES_LIST",
  SAVE_SMALL_DONATION_CASH: "SAVE_SMALL_DONATION_CASH",
  SAVE_BOOK_ISSUED: "SAVE_BOOK_ISSUED",

  GET_JAPA_MONTHLY_AVG: "GET_JAPA_MONTHLY_AVG",
};

const PASSWORD_ERROR_STR = "Please enter a correct password";
const DATE_UTC = new Date().toISOString();

const RESUME_LBL = "Resume";
const START_LBL = "Start";
const START_TIME_LBL = "Start Time";
const PAUSE_LBL = "Pause";

const MESSAGE_CONSTANT = {
  emptyPassword: "Please enter password",
  correctPassword: "Please enter a correct password",
  notesError: "Please enter Notes",
  lectureByError: "Please enter Lecture By",
  topicError: "Please enter Topic",
  bookNameError: "Please enter Book Name",
  hearingNotSavedError: "Hearing not saved ,Please try again",
  noJapaChantedError: "No Japa Recorded , Please chant some round first",
};

const CONTROL_TYPE_CONSTAINT = {
  input: "input",
  button: "button",
  checkbox: "checkbox",
};

const COLOR_CONSTANT = {
  green: " #4caf50",
  red: "#f44336",
};

const GRAPH_COLOR_CONSTANT = {
  red: "rgba(255, 0, 0, 1)", // 0 - Bright Red
  red2: "#f44336",
  darkRed: "rgba(139, 0, 0, 1)",
  green: "rgba(0, 128, 0, 1)", // 16+ - Dark Green
  blue: "rgba(0, 122, 255, 1)", // 6-10 - Striking Blue
  yellow: "rgba(255, 215, 0, 1)", // 11-15 - Shiny Gold
  purple: "rgba(128, 0, 255, 1)", // 1-5 - Vibrant Purple
  pink: "rgba(255, 99, 132, 1)",
  darkGreenSolid: "rgba(0, 100, 0, 1)",
  forestGreenSolid: "rgba(34, 139, 34, 1)",
  limeGreenSolid: "rgba(50, 205, 50, 1)",
  mediumSeaGreenSolid: "rgba(60, 179, 113, 1)",
  seaGreenSolid: "rgba(46, 139, 87, 1)",
  springGreenSolid: "rgba(0, 255, 127, 1)",
  paleGreenSolid: "rgba(152, 251, 152, 1)",
  yellowGreenSolid: "rgba(154, 205, 50, 1)",
  oliveDrabSolid: "rgba(107, 142, 35, 1)",
  darkOliveGreenSolid: "rgba(85, 107, 47, 1)",
  darkRedSolid: "rgba(139, 0, 0, 1)", // 1 - Dark Red
  firebrickSolid: "rgba(178, 34, 34, 1)", // 2 - Firebrick
  crimsonSolid: "rgba(220, 20, 60, 1)", // 3 - Crimson
  tomatoSolid: "rgba(255, 99, 71, 1)", // 4 - Tomato
  indianRedSolid: "rgba(205, 92, 92, 1)", // 5 - Indian Red
  lightCoralSolid: "rgba(240, 128, 128, 1)", // 6 - Light Coral
  salmonSolid: "rgba(250, 128, 114, 1)", // 7 - Salmon
  darkSalmonSolid: "rgba(233, 150, 122, 1)", // 8 - Dark Salmon
  lightSalmonSolid: "rgba(255, 160, 122, 1)", // 9 - Light Salmon
  rosyBrownSolid: "rgba(188, 143, 143, 1)", // 10 - Rosy Brown
};

const GRAPH_BORDER_COLOR_CONSTANT = {
  lightRed: "rgba(255, 0, 0, 0.5)", // Light Red
  lightRed2: "#f44330", // Light Red
  lightDarkRed: "rgba(139, 0, 0, 0.5)",
  lightGreen: "rgba(0, 128, 0, 0.5)", // Light Green
  lightBlue: "rgba(0, 122, 255, 0.5)", // Light Blue
  lightYellow: "rgba(255, 215, 0, 0.5)", // Light Gold
  lightPurple: "rgba(128, 0, 255, 0.5)", // Light Purple
  lightPink: "rgba(255, 99, 132, 0.5)", // Light Red"
  darkGreenLight: "rgba(0, 100, 0, 0.5)",
  forestGreenLight: "rgba(34, 139, 34, 0.5)",
  limeGreenLight: "rgba(50, 205, 50, 0.5)",
  mediumSeaGreenLight: "rgba(60, 179, 113, 0.5)",
  seaGreenLight: "rgba(46, 139, 87, 0.5)",
  springGreenLight: "rgba(0, 255, 127, 0.5)",
  paleGreenLight: "rgba(152, 251, 152, 0.5)",
  yellowGreenLight: "rgba(154, 205, 50, 0.5)",
  oliveDrabLight: "rgba(107, 142, 35, 0.5)",
  darkOliveGreenLight: "rgba(85, 107, 47, 0.5)",
  darkRedLight: "rgba(139, 0, 0, 0.5)", // Light Dark Red
  firebrickLight: "rgba(178, 34, 34, 0.5)", // Light Firebrick
  crimsonLight: "rgba(220, 20, 60, 0.5)", // Light Crimson
  tomatoLight: "rgba(255, 99, 71, 0.5)", // Light Tomato
  indianRedLight: "rgba(205, 92, 92, 0.5)", // Light Indian Red
  lightCoralLight: "rgba(240, 128, 128, 0.5)", // Light Light Coral
  salmonLight: "rgba(250, 128, 114, 0.5)", // Light Salmon
  darkSalmonLight: "rgba(233, 150, 122, 0.5)", // Light Dark Salmon
  lightSalmonLight: "rgba(255, 160, 122, 0.5)", // Light Light Salmon
  rosyBrownLight: "rgba(188, 143, 143, 0.5)", // Light Rosy Brown
};

function isKartikDataVisible() {
  const startDate = moment("2024-10-17", "YYYY-MM-DD");
  const endDate = moment("2024-11-16", "YYYY-MM-DD");
  const currentDate = moment();

  // Check if current date is within the range (inclusive)
  return currentDate.isBetween(startDate, endDate, "day", "[]");
}

let IS_KARTIK_DATA_VISIABLE = isKartikDataVisible();

const DEVOTEE_TYPE_CONSTANT = {
  nkdDevotee: "nkdDevotee",
  otherDevotee: "otherDevotee",
  ggStudent: "ggStudent",
};

const ORIGNAL_SLEEP_OPTIONS = [
  { value: "Before 21:01", text: "Before 21:01 Hrs" },
  { value: "21:01 to 21:15", text: "21:01 to 21:15 Hrs" },
  { value: "21:16 to 21:30", text: "21:16 to 21:30 Hrs" },
  { value: "21:31 to 21:45", text: "21:31 to 21:45 Hrs" },
  { value: "21:46 to 22:00", text: "21:46 to 22:00 Hrs" },
  { value: "22:01 to 22:15", text: "22:01 to 22:15 Hrs" },
  { value: "22:16 to 22:30", text: "22:16 to 22:30 Hrs" },
  { value: "22:31 to 22:45", text: "22:31 to 22:45 Hrs" },
  { value: "22:46 to 23:00", text: "22:46 to 23:00 Hrs" },
  { value: "After 23:00", text: "After 23:00 Hrs" },
];

const ORIGNAL_WAKEUP_OPTIONS = [
  { value: "Before 03:01", text: "Before 03:01 Hrs" },
  { value: "03:01 to 03:15", text: "03:01 to 03:15 Hrs" },
  { value: "03:16 to 03:30", text: "03:16 to 03:30 Hrs" },
  { value: "03:31 to 03:45", text: "03:31 to 03:45 Hrs" },
  { value: "03:46 to 04:00", text: "03:46 to 04:00 Hrs" },
  { value: "04:01 to 04:15", text: "04:01 to 04:15 Hrs" },
  { value: "04:16 to 04:30", text: "04:16 to 04:30 Hrs" },
  { value: "04:31 to 04:45", text: "04:31 to 04:45 Hrs" },
  { value: "04:46 to 05:00", text: "04:46 to 05:00 Hrs" },
  { value: "After 05:00", text: "After 05:00 Hrs" },
];

// New options for Sleeping Time (to simulate change)
const GG_SLEEP_OPTIONS = [
  { value: "20:30", text: "Before 20:31 Hrs" },
  { value: "20:31 to 20:45", text: "20:31 to 20:45 Hrs" },
  { value: "20:46 to 21:00", text: "20:46 to 21:00 Hrs" },
  { value: "21:01 to 21:15", text: "21:01 to 21:15 Hrs" },
  { value: "21:16 to 21:30", text: "21:16 to 21:30 Hrs" },
  { value: "21:30", text: "After 21:30 Hrs" },
];

// New options for Wake Up Time (to simulate change)
const GG_WAKEUP_OPTIONS = [
  { value: "04:00", text: "Before 04:00 Hrs" },
  { value: "04:01 to 04:15", text: "04:01 to 04:15 Hrs" },
  { value: "04:16 to 04:30", text: "04:16 to 04:30 Hrs" },
  { value: "04:31 to 04:45", text: "04:31 to 04:45 Hrs" },
  { value: "04:46 to 05:00", text: "04:46 to 05:00 Hrs" },
  { value: "05:00", text: "After 05:00 Hrs" },
];

const KEY_PRESS_HANDLER_KEY_CONSTANT = {
  Enter: "Enter",
  Space: "Space",
  Backspace: "Backspace",
};

const BASE_URL_YOUTUBE = "https://www.googleapis.com/youtube/v3";
const API_KEY_YOUTUBE_NKD = "AIzaSyCs50rDSmxeTUnDYNl48Yon2YuZpTaIoDA";
