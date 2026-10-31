const youTubeContainerNew = "youTubeContainer";
const youTubePlayListItemContainer = "youTubePlayListItemContainer";
const youTubePlayVideoContainer = "youTubePlayVideoContainer";
const youTubeShortsContainer = "youTubeShortsContainer";
const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/";
const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v=";
let playlistsData = [];
let shortsItemData = [];
let completeYoutubeData = {};
let currentPlayListName = "";

// Watch page state: every video of the open playlist in display order
let currentPlaylistVideos = [];
let currentVideoIndex = -1;
let videoIndexMap = new Map();
let currentPlaylistData = [];
let currentChapters = [];
let currentChapterIndex = -1;
let currentPanelQuery = "";
let openedChapterGroupKey = null;

// Line icons shared by the accordions
const ICON_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
const ICON_BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`;

const sortOrder = [
  "Bhagavad Gita As It Is",
  "Srimad Bhagavatam",
  "Sri Chaitanya Charitamrit",
  "Sri Chaitanya Bhagwat",
  "Sri Chaitanya Mangal",
  "Ramayana",
];
document.addEventListener("DOMContentLoaded", async function () {
  await fetchPlaylists();
  SHOW_SPECIFIC_DIV(youTubeContainerNew);
});

//#region YouTube Data API: saved responses and friendly errors
// The API key has a daily quota. Each browser keeps the responses for a few
// hours, so most visits use no quota at all; when the quota runs out, the
// last saved copy is shown instead of an error.
const NKD_CHANNEL_ID = "UCyPwLzmeTmyhpDsCBrMubbQ";
// YouTube's automatic "all Shorts of this channel" playlist (UC... -> UUSH...)
const NKD_SHORTS_PLAYLIST_ID = "UUSH" + NKD_CHANNEL_ID.slice(2);
const API_CACHE_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours
const SHORTS_MAX_PAGES = 2; // 50 shorts per page, 1 quota unit per page

function readApiCache(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (!saved || !Array.isArray(saved.items)) return null;
    return { items: saved.items, fresh: Date.now() - saved.time < API_CACHE_MAX_AGE };
  } catch {
    return null; // storage blocked or the saved copy is corrupt
  }
}

function writeApiCache(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), items }));
  } catch {
    // storage full or blocked: the page still works, just without the copy
  }
}

class YouTubeApiError extends Error {
  constructor(status) {
    super(`YouTube API HTTP ${status}`);
    this.status = status;
  }
}

async function youTubeApiGet(path) {
  const response = await fetch(
    `${BASE_URL_YOUTUBE}${path}&key=${API_KEY_YOUTUBE_NKD}`,
  );
  if (!response.ok) throw new YouTubeApiError(response.status);
  return response.json();
}

// Fresh saved copy, else the API, else an older saved copy, else null
async function loadWithCache(key, fetchItems) {
  const saved = readApiCache(key);
  if (saved?.fresh) return saved.items;
  try {
    IsLoading(true);
    const items = await fetchItems();
    writeApiCache(key, items);
    return items;
  } catch (error) {
    console.error(`Loading ${key} failed:`, error.message);
    if (saved) return saved.items;
    SHOW_ERROR_POPUP(apiErrorMessage(error));
    return null;
  } finally {
    IsLoading(false);
  }
}

function apiErrorMessage(error) {
  if (error.status === 429 || error.status === 403) {
    return "YouTube is limiting requests right now. Please try again in a little while.";
  }
  if (!navigator.onLine) {
    return "You seem to be offline. Please check your internet connection.";
  }
  return "Could not load videos from YouTube. Please try again.";
}
//#endregion

async function fetchPlaylists() {
  const items = await loadWithCache("nkd-yt-playlists", async () => {
    const data = await youTubeApiGet(
      `/playlists?part=snippet,contentDetails&channelId=${NKD_CHANNEL_ID}&maxResults=50`,
    );
    return data.items || [];
  });
  if (!items) return;

  playlistsData = [
    ...sortOrder
      .map((title) => items.find((item) => item.snippet.title === title))
      .filter(Boolean),
    ...items.filter((item) => !sortOrder.includes(item.snippet.title)),
  ];
  applyPlaylistLatestDates();
  renderPlaylists(playlistsData);
  // Missing / outdated dates are worked out in the background, then the
  // cards are re-sorted newest first
  refreshPlaylistLatestDates().then((changed) => {
    if (!changed) return;
    applyPlaylistLatestDates();
    if (activeScreenId === youTubeContainerNew) {
      const query = document.getElementById("headerSearchInput").value;
      query ? filterPlaylists(query) : renderPlaylists(playlistsData);
    }
  });
}

//#region Playlist dates: the newest video in each playlist
// Saved per browser for 30 days; a playlist is read again only when its video
// count changes (a video was added or removed).
const PLAYLIST_DATES_KEY = "nkd-yt-playlist-latest";
const PLAYLIST_DATES_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function readPlaylistDates() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYLIST_DATES_KEY));
    if (saved && Date.now() - saved.time < PLAYLIST_DATES_MAX_AGE) {
      return saved.dates || {};
    }
  } catch {
    // storage blocked or corrupt: start again
  }
  return {};
}

function writePlaylistDates(dates) {
  try {
    localStorage.setItem(
      PLAYLIST_DATES_KEY,
      JSON.stringify({ time: Date.now(), dates }),
    );
  } catch {
    // storage full or blocked
  }
}

// Newest videoPublishedAt in a playlist. Playlists that list the newest video
// first are settled by their first page; others are read to the end.
async function fetchPlaylistLatest(playlistId) {
  let latest = "";
  let pageToken = "";
  for (let page = 0; page < 40; page++) {
    const data = await youTubeApiGet(
      `/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}` +
        (pageToken ? `&pageToken=${pageToken}` : ""),
    );
    const dates = (data.items || [])
      .map((item) => item.contentDetails?.videoPublishedAt)
      .filter(Boolean);
    const pageMax = dates.reduce((a, b) => (b > a ? b : a), "");
    if (pageMax > latest) latest = pageMax;
    const newestFirst = page === 0 && dates.length > 1 && dates[0] === pageMax;
    pageToken = data.nextPageToken;
    if (!pageToken || newestFirst) break;
  }
  return latest;
}

// Fills in the dates that are missing or out of date; true if any changed
async function refreshPlaylistLatestDates() {
  const dates = readPlaylistDates();
  const todo = playlistsData.filter((playlist) => {
    const saved = dates[playlist.id];
    return !saved || saved.count !== playlist.contentDetails?.itemCount;
  });
  if (!todo.length) return false;

  let changed = false;
  const queue = [...todo];
  const worker = async () => {
    while (queue.length) {
      const playlist = queue.shift();
      try {
        const latest = await fetchPlaylistLatest(playlist.id);
        dates[playlist.id] = {
          count: playlist.contentDetails?.itemCount,
          latest: latest || playlist.snippet.publishedAt,
        };
        changed = true;
        // Show this date straight away and keep the progress saved
        playlist.latestVideoAt = dates[playlist.id].latest;
        showPlaylistDate(playlist);
        writePlaylistDates(dates);
      } catch (error) {
        // quota or network: keep whatever was saved and try another time
        console.error("Playlist date failed:", error.message);
        if (error.status === 429 || error.status === 403) queue.length = 0;
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (changed) writePlaylistDates(dates);
  return changed;
}

// Puts the saved date on each playlist and sorts newest first
function applyPlaylistLatestDates() {
  const dates = readPlaylistDates();
  playlistsData.forEach((playlist) => {
    playlist.latestVideoAt = dates[playlist.id]?.latest || "";
  });
  if (!playlistsData.some((playlist) => playlist.latestVideoAt)) return;
  playlistsData.sort((a, b) =>
    (b.latestVideoAt || "").localeCompare(a.latestVideoAt || ""),
  );
}

// Updates the date line on this playlist's card(s) without re-rendering
function showPlaylistDate(playlist) {
  document
    .querySelectorAll(`.image_card[data-playlist-id="${playlist.id}"] .image_meta`)
    .forEach((meta) => (meta.textContent = playlistDateText(playlist)));
}

function playlistDateText(playlist) {
  const date = formatVideoDate(playlist.latestVideoAt);
  return date ? `NKD · ${date}` : "View full playlist";
}
//#endregion

// Thumbnail card shared by the playlist and shorts grids
function createThumbnailCard({ title, thumbnailUrl, badge, hoverText, meta }) {
  const card = document.createElement("div");
  card.className = "image_card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");

  card.innerHTML = `
    <div class="image_thumb_wrap">
      <img class="image_thumbnail" loading="lazy" alt="" />
      <span class="thumb_badge"></span>
      <span class="thumb_hover"></span>
    </div>
    <div class="image_title"></div>
    <div class="image_meta"></div>
  `;
  card.querySelector(".image_thumbnail").src = thumbnailUrl;
  card.querySelector(".thumb_badge").textContent = badge;
  card.querySelector(".thumb_hover").textContent = hoverText;
  card.querySelector(".image_title").textContent = title;
  card.querySelector(".image_meta").textContent = meta;
  card.setAttribute("aria-label", title);

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      card.click();
    }
  });
  return card;
}

function renderPlaylists(playlists) {
  const container = document.getElementById("youTubePlayListImageCardView");
  container.innerHTML = ""; // Clear container

  playlists.forEach((playlist) => {
    try {
      const { title, thumbnails } = playlist.snippet;
      const count = playlist.contentDetails?.itemCount;
      const card = createThumbnailCard({
        title,
        thumbnailUrl: thumbnails.medium.url,
        badge: count ? `${count} videos` : "Playlist",
        hoverText: "Play all",
        meta: playlistDateText(playlist),
      });

      card.dataset.playlistId = playlist.id;
      card.addEventListener("click", () => {
        fetchPlaylistItems(title.trim());
      });
      container.appendChild(card);
    } catch (ex) {
      console.log("renderPlaylists : error", ex.message);
    }
  });
}

//#region Watch page (player + chapter panel + chapter list)
async function fetchPlaylistItems(playlistName, autoplay = true) {
  try {
    currentPlayListName = playlistName;
    let data = completeYoutubeData[playlistName];
    if (!data) {
      const rows = await loadPlaylistRows(playlistName);
      if (!rows) return;
      data = sortGroupsByNumber(buildPlaylistData(playlistName, rows));
      completeYoutubeData[playlistName] = data;
    }

    currentPlaylistData = data;
    currentPlaylistVideos = flattenPlaylist(data);
    videoIndexMap = new Map(currentPlaylistVideos.map((v, i) => [v, i]));
    currentChapters = buildChapters(data);
    currentChapterIndex = -1;
    currentVideoIndex = -1;
    currentPanelQuery = "";

    document.getElementById("playlistH2Ctrl").innerText = playlistName;
    document.getElementById("watchCrumbTitle").textContent = playlistName;
    setPlaylistPanelOpen(true, false);
    renderSidePlaylists();
    renderChapterSection();
    SHOW_SPECIFIC_DIV(youTubePlayListItemContainer);
    document.getElementById(youTubePlayListItemContainer).scrollTop = 0;

    if (currentPlaylistVideos.length) {
      playVideoAt(0, autoplay);
    } else {
      renderPlaylistPanel();
      updateWatchInfo(null);
    }
  } catch (error) {
    console.error("Error fetching playlist items:", error);
  }
}

// A playlist's videos as rows [title, videoId, publishedAt, thumbMedium,
// thumbDefault]. Comes from the backend sheet; when the backend has no sheet
// for this playlist (or fails), it is read straight from YouTube instead.
async function loadPlaylistRows(playlistName) {
  const fromBackend = await fetchBackendPlaylistRows(playlistName);
  if (fromBackend?.length) return fromBackend;

  const playlist = playlistsData.find(
    (p) => p.snippet.title.trim() === playlistName,
  );
  if (!playlist) {
    SHOW_ERROR_POPUP("Could not load this playlist. Please try again.");
    return null;
  }
  return loadWithCache(`nkd-yt-pl-${playlist.id}`, () =>
    fetchYouTubePlaylistRows(playlist.id),
  );
}

// Quiet backend call: no error popup, so the YouTube fallback can take over
async function fetchBackendPlaylistRows(playlistName) {
  try {
    IsLoading(true);
    const response = await axios.post(
      YOUTUBE_PLAYLIST_BACKEND_API,
      JSON.stringify({
        apiType: "GET_YOUTUBE_PLAYLIST_DATA",
        inputData: { playlistName },
      }),
    );
    const data = response?.data;
    if (data?.status && Array.isArray(data.result)) return data.result;
    console.warn(`Backend has no data for "${playlistName}":`, data?.result);
  } catch (error) {
    console.warn(`Backend request for "${playlistName}" failed:`, error.message);
  } finally {
    IsLoading(false);
  }
  return null;
}

// 1 quota unit per 50 videos; private / deleted videos are skipped
async function fetchYouTubePlaylistRows(playlistId) {
  const rows = [];
  let pageToken = "";
  for (let page = 0; page < 40; page++) {
    const data = await youTubeApiGet(
      `/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}` +
        (pageToken ? `&pageToken=${pageToken}` : ""),
    );
    for (const { snippet, contentDetails } of data.items || []) {
      if (!snippet?.thumbnails?.medium) continue;
      rows.push([
        snippet.title,
        snippet.resourceId.videoId,
        contentDetails?.videoPublishedAt || snippet.publishedAt,
        snippet.thumbnails.medium.url,
        snippet.thumbnails.default?.url || "",
      ]);
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return rows;
}

// Groups the raw rows by book structure: array (flat), { chapter: [] } or
// { canto: { chapter: [] } }
function buildPlaylistData(playlistName, rows) {
  switch (playlistName) {
    case "Sri Chaitanya Bhagwat":
    case "Sri Chaitanya Mangal":
    case "Sri Chaitanya Charitamrit":
      return populateCCData(playlistName, rows);
    case "Srimad Bhagavatam":
      return populateSBData(rows);
    case "Bhagavad Gita As It Is":
    case "Bhagavad Gita as it is Version 2.0":
    case "Bhagavad Gita As It Is - Interactive Series":
      return populateGitaData(rows);
    default:
      return rows.map(function (row) {
        return {
          title: row[0],
          videoID: row[1],
          publishedAt: row[2],
          thumbnailMedium: row[3],
          thumbnailDefault: row[4],
        };
      });
  }
}

// Time of a video's upload (0 when unknown), for sorting by date
function videoTime(video) {
  const time = Date.parse(video.publishedAt);
  return isNaN(time) ? 0 : time;
}

// Newest upload anywhere inside a chapter / canto / playlist
function latestVideoTime(node) {
  return flattenPlaylist(node).reduce((max, v) => Math.max(max, videoTime(v)), 0);
}

// Cantos and chapters in number order (Canto 1, 2, 3 ... Chapter 1, 2, 3),
// "Unknown" last. The videos inside a chapter keep their verse order.
function sortGroupsByNumber(node) {
  if (Array.isArray(node)) return node;
  const rank = (key) => (/unknown/i.test(key) ? 1 : 0);
  return Object.fromEntries(
    Object.entries(node)
      .map(([key, child]) => [key, sortGroupsByNumber(child)])
      .sort(
        ([a], [b]) =>
          rank(a) - rank(b) ||
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      ),
  );
}

function flattenPlaylist(node) {
  if (Array.isArray(node)) return node;
  return Object.values(node).flatMap(flattenPlaylist);
}

function countPlaylistVideos(node) {
  if (Array.isArray(node)) return node.length;
  return Object.values(node).reduce((sum, c) => sum + countPlaylistVideos(c), 0);
}

// Every innermost group as a chapter: { path: ["SB Canto 1", "Chapter 2"],
// videos, startIndex }. A flat playlist is one chapter with an empty path.
function buildChapters(node, path = []) {
  if (Array.isArray(node)) {
    if (!node.length) return [];
    return [{ path, videos: node, startIndex: videoIndexMap.get(node[0]) }];
  }
  return Object.entries(node).flatMap(([key, child]) =>
    buildChapters(child, [...path, key]),
  );
}

// Chapters hold consecutive videos, so the last chapter starting at or
// before the index is the one containing it
function chapterIndexForVideo(index) {
  let found = -1;
  currentChapters.forEach((chapter, i) => {
    if (chapter.startIndex <= index) found = i;
  });
  return found;
}

// Same shape as the input, keeping only videos whose title matches
function filterPlaylistNode(node, query) {
  if (Array.isArray(node)) {
    const matched = node.filter((video) =>
      video.title.toLowerCase().includes(query),
    );
    return matched.length ? matched : null;
  }
  const result = {};
  for (const [key, child] of Object.entries(node)) {
    const matched = filterPlaylistNode(child, query);
    if (matched) result[key] = matched;
  }
  return Object.keys(result).length ? result : null;
}

// The panel lists the playing chapter; while searching it lists every match
// across the playlist, grouped by chapter
function renderPlaylistPanel() {
  const list = document.getElementById("youTubeItemAccordion");
  list.innerHTML = "";
  list.scrollTop = 0;

  const node = currentPanelQuery
    ? filterPlaylistNode(currentPlaylistData, currentPanelQuery)
    : currentChapters[currentChapterIndex]?.videos;

  if (!node || !countPlaylistVideos(node)) {
    const empty = document.createElement("div");
    empty.className = "pl-empty";
    empty.textContent = currentPanelQuery
      ? "No videos match your search."
      : "No videos in this playlist yet.";
    list.appendChild(empty);
    return;
  }

  renderPlaylistNode(list, node, Boolean(currentPanelQuery));
  highlightActiveVideo();
}

function renderPlaylistNode(container, node, expandAll) {
  if (Array.isArray(node)) {
    node.forEach((video) => container.appendChild(createPlaylistRow(video)));
    return;
  }
  for (const [title, child] of Object.entries(node)) {
    container.appendChild(createPlaylistGroup(title, child, expandAll));
  }
}

function createPlaylistGroup(title, child, expandAll) {
  const item = document.createElement("div");
  item.className = "accordion-item";

  const header = document.createElement("button");
  header.type = "button";
  header.className = "accordion-header";
  header.innerHTML = `
    <span class="accordion-header__title"></span>
    <span class="accordion-header__count"></span>
    <span class="icon">${ICON_CHEVRON}</span>
  `;
  header.querySelector(".accordion-header__title").textContent = title;
  header.querySelector(".accordion-header__count").textContent =
    countPlaylistVideos(child);

  const content = document.createElement("div");
  content.className = "accordion-content";
  const inner = document.createElement("div");
  inner.className = "accordion-content__inner";
  content.appendChild(inner);
  renderPlaylistNode(inner, child, expandAll);

  header.addEventListener("click", () => {
    const open = !item.classList.contains("open");
    // Only one group open per level
    item.parentElement
      .querySelectorAll(":scope > .accordion-item.open")
      .forEach((sibling) => setGroupOpen(sibling, false));
    setGroupOpen(item, open);
  });

  item.appendChild(header);
  item.appendChild(content);
  setGroupOpen(item, expandAll);
  return item;
}

// Opening and closing is animated in CSS from the "open" class
function setGroupOpen(item, open) {
  const header = item.querySelector(":scope > .accordion-header");
  item.classList.toggle("open", open);
  header.classList.toggle("active", open);
  header.setAttribute("aria-expanded", open);
}

function createPlaylistRow(video) {
  const index = videoIndexMap.get(video);
  const chapter = currentChapters[chapterIndexForVideo(index)];
  const row = document.createElement("a");
  row.className = "pl-item";
  row.href = YOUTUBE_WATCH_URL + video.videoID;
  row.dataset.index = index;

  row.innerHTML = `
    <span class="pl-item__index">
      <span class="pl-item__num"></span>
      <span class="eq eq--sm" aria-hidden="true"><i></i><i></i><i></i></span>
    </span>
    <span class="pl-item__thumb"><img loading="lazy" alt="" /></span>
    <span class="pl-item__text">
      <span class="pl-item__title"></span>
      <span class="pl-item__meta"></span>
    </span>
  `;
  // Numbered within its chapter, like a YouTube playlist
  row.querySelector(".pl-item__num").textContent =
    index - (chapter ? chapter.startIndex : 0) + 1;
  row.querySelector("img").src =
    video.thumbnailMedium || video.thumbnailDefault || "";
  row.querySelector(".pl-item__title").textContent = video.title;
  row.querySelector(".pl-item__meta").textContent = videoMetaText(video);

  row.addEventListener("click", (event) => {
    event.preventDefault();
    playVideoAt(index, true);
  });
  return row;
}

// Brings the player into view: the screens scroll inside their .popup.
// Starts straight away, then once more just after the lists re-render in
// case that layout change cut the first smooth scroll short.
function scrollScreenToTop(screenId) {
  const screen = document.getElementById(screenId);
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go = () =>
    screen.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  go();
  setTimeout(() => {
    if (screen.scrollTop > 0) go();
  }, 60);
}

// autoplay = the user picked this video, so scroll up to the player too
function playVideoAt(index, autoplay) {
  const video = currentPlaylistVideos[index];
  if (!video) return;
  currentVideoIndex = index;
  // A video the user picked: scroll the playlist page up to the player
  if (autoplay) scrollScreenToTop(youTubePlayListItemContainer);

  loadPlayerVideo(video.videoID, autoplay);

  const chapterIndex = chapterIndexForVideo(index);
  if (chapterIndex !== currentChapterIndex) {
    currentChapterIndex = chapterIndex;
    if (!currentPanelQuery) renderPlaylistPanel();
  }

  updateChapterSectionActive();
  updateWatchInfo(video);
  highlightActiveVideo();
}

//#region Playback state from the embedded player (YouTube IFrame API)
// "playing" | "paused" | null. null means not known yet (the API has not
// reported): the indicator keeps animating as the default.
let playbackState = null;
const PLAYBACK_PREFIX = { playing: "Playing", paused: "Paused", ready: "Ready" };
let ytPlayer = null; // YT.Player bound to #youTubeVideoIframe
let ytPlayerReady = false;

function buildEmbedUrl(videoID, autoplay) {
  const params = new URLSearchParams({ rel: "0", enablejsapi: "1" });
  if (autoplay) params.set("autoplay", "1");
  if (location.origin.startsWith("http")) params.set("origin", location.origin);
  return `${YOUTUBE_EMBED_URL}${videoID}?${params}`;
}

function loadYouTubeIframeApi() {
  if (window.YT?.Player || document.getElementById("youtube-iframe-api")) return;
  const script = document.createElement("script");
  script.id = "youtube-iframe-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

// The API script calls this once it has loaded
window.onYouTubeIframeAPIReady = () => bindYouTubePlayer();

function bindYouTubePlayer() {
  const iframe = document.getElementById("youTubeVideoIframe");
  if (ytPlayer || !window.YT?.Player) return;
  if (!iframe.src.includes("youtube.com/embed")) return;

  ytPlayer = new YT.Player(iframe, {
    events: {
      onReady: () => {
        ytPlayerReady = true;
        setPlaybackState(playbackStateFor(ytPlayer.getPlayerState()));
      },
      onStateChange: (event) => setPlaybackState(playbackStateFor(event.data)),
    },
  });
}

// "paused" only once a started video is paused; a video that has not
// started (or has finished) is "ready" to play
function playbackStateFor(state) {
  const { PLAYING, BUFFERING, PAUSED } = YT.PlayerState;
  if (state === PLAYING || state === BUFFERING) return "playing";
  if (state === PAUSED) return "paused";
  return "ready";
}

// Once the API player is ready videos switch inside it, which keeps the
// state events flowing; until then the iframe is simply pointed at the video
function loadPlayerVideo(videoID, autoplay) {
  if (ytPlayerReady) {
    if (autoplay) ytPlayer.loadVideoById(videoID);
    else ytPlayer.cueVideoById(videoID);
    if (!autoplay) setPlaybackState("ready");
    return;
  }
  // Not autoplaying: nothing is playing yet. Autoplaying: wait for the player.
  setPlaybackState(autoplay ? null : "ready");
  document.getElementById("youTubeVideoIframe").src = buildEmbedUrl(
    videoID,
    autoplay,
  );
  bindYouTubePlayer();
}

function setPlaybackState(state) {
  if (state === playbackState) return;
  playbackState = state;
  const page = document.getElementById(youTubePlayListItemContainer);
  if (state) page.dataset.playback = state;
  else delete page.dataset.playback;
  updateChapterSectionActive();
}

// Leaving the watch page stops the video but keeps the player connected
document.addEventListener("screenchange", (event) => {
  if (event.detail === youTubePlayListItemContainer) return;
  if (ytPlayerReady) ytPlayer.stopVideo();
});

loadYouTubeIframeApi();
//#endregion

//#region Collapsible playlist panel
function togglePlaylistPanel() {
  const panel = document.querySelector(".pl-panel");
  setPlaylistPanelOpen(panel.classList.contains("is-collapsed"));
}

// Animates the list's height between 0 and whatever it naturally fills
function setPlaylistPanelOpen(open, animate = true) {
  const panel = document.querySelector(".pl-panel");
  const body = panel.querySelector(".pl-panel__body");
  if (panel.classList.contains("is-collapsed") !== open) return;

  panel.classList.toggle("is-collapsed", !open);
  document
    .getElementById("playlistPanelToggle")
    .setAttribute("aria-expanded", open);
  clearTimeout(body.dataset.timer);

  if (!animate) {
    body.style.height = open ? "" : "0px";
    return;
  }
  const from = body.offsetHeight;
  body.style.height = "";
  const to = open ? body.offsetHeight : 0;
  body.style.height = `${from}px`;
  void body.offsetHeight; // start the transition from the current height
  body.style.height = `${to}px`;
  body.dataset.timer = setTimeout(() => {
    if (open) {
      body.style.height = "";
      highlightActiveVideo();
    }
  }, 420);
}
//#endregion

//#region "More playlists": a few home page playlists beside the player
const SIDE_PLAYLIST_COUNT = 5;
let sidePlaylistIds = [];

function shuffleArray(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Picks a random handful, preferring ones not on screen so Shuffle always
// shows something new
function renderSidePlaylists() {
  const section = document.getElementById("watchSuggest");
  const list = document.getElementById("watchSuggestList");
  const others = playlistsData.filter(
    (playlist) => playlist.snippet.title.trim() !== currentPlayListName,
  );
  section.hidden = !others.length;
  list.innerHTML = "";
  if (!others.length) return;

  const unseen = others.filter((p) => !sidePlaylistIds.includes(p.id));
  const pool = unseen.length >= SIDE_PLAYLIST_COUNT ? unseen : others;
  // A random handful, shown newest first
  const picks = shuffleArray(pool)
    .slice(0, SIDE_PLAYLIST_COUNT)
    .sort((a, b) => (b.latestVideoAt || "").localeCompare(a.latestVideoAt || ""));
  sidePlaylistIds = picks.map((p) => p.id);

  document.getElementById("watchSuggestSub").textContent =
    `Showing ${picks.length} of ${others.length} · newest first`;
  // Shuffle button is hidden for now (commented out in index.html)
  // document.getElementById("watchShuffleBtn").hidden =
  //   others.length <= SIDE_PLAYLIST_COUNT;
  picks.forEach((playlist, n) =>
    list.appendChild(createSidePlaylistRow(playlist, n)),
  );
}

// "More playlists" card opens / closes like the playlist panel
function toggleSideCard() {
  const card = document.getElementById("watchSuggest");
  const open = card.classList.toggle("is-collapsed") === false;
  document.getElementById("sideCardToggle").setAttribute("aria-expanded", open);
}

// Shuffle is turned off for now; uncomment this and the button in index.html
// to bring it back.
// function shuffleSidePlaylists() {
//   const button = document.getElementById("watchShuffleBtn");
//   button.classList.remove("is-spinning");
//   void button.offsetWidth; // restart the spin
//   button.classList.add("is-spinning");
//   renderSidePlaylists();
// }

function createSidePlaylistRow(playlist, position) {
  const { title, thumbnails } = playlist.snippet;
  const count = playlist.contentDetails?.itemCount;
  const row = document.createElement("a");
  row.className = "pl-item pl-item--suggest pl-item--playlist";
  row.href = `https://www.youtube.com/playlist?list=${playlist.id}`;
  // Only the first rows stagger in; the rest appear with the last of them
  row.style.setProperty("--i", position);
  row.innerHTML = `
    <span class="pl-item__thumb">
      <img loading="lazy" alt="" />
      <span class="thumb_badge"></span>
    </span>
    <span class="pl-item__text">
      <span class="pl-item__title"></span>
      <span class="pl-item__meta">
        <span class="pl-item__date"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </span>
    </span>
  `;
  row.querySelector("img").src = thumbnails.medium.url;
  row.querySelector(".thumb_badge").textContent = count
    ? `${count} videos`
    : "Playlist";
  row.querySelector(".pl-item__title").textContent = title;
  row.querySelector(".pl-item__date").textContent = playlistDateText(playlist);
  row.addEventListener("click", (event) => {
    event.preventDefault();
    fetchPlaylistItems(title.trim());
  });
  return row;
}
//#endregion

// Logo click: back to the playlists from any screen
function goHome(event) {
  event.preventDefault();
  if (activeScreenId === youTubeContainerNew) {
    document
      .getElementById(youTubeContainerNew)
      .scrollTo({ top: 0, behavior: "smooth" });
  } else {
    backToPlayList();
  }
}

function playAdjacentVideo(step) {
  playVideoAt(currentVideoIndex + step, true);
}

function updateWatchInfo(video) {
  const total = currentPlaylistVideos.length;
  document.getElementById("watchVideoTitle").textContent = video
    ? video.title
    : "No videos found";
  document.getElementById("watchVideoMeta").textContent = video
    ? videoMetaText(video)
    : "";
  document.getElementById("watchOnYouTube").href = video
    ? YOUTUBE_WATCH_URL + video.videoID
    : "https://www.youtube.com/";
  document.getElementById("watchPrevBtn").disabled =
    !video || currentVideoIndex <= 0;
  document.getElementById("watchNextBtn").disabled =
    !video || currentVideoIndex >= total - 1;
  const next = video && currentPlaylistVideos[currentVideoIndex + 1];
  document.getElementById("playlistPanelNext").textContent = next
    ? `Next: ${next.title}`
    : "End of playlist";
  updatePanelSubtitle();
}

// "SB Canto 1 · Chapter 2 · 3 / 8", or "NKD YouTube · 3 / 40" for flat lists
function updatePanelSubtitle() {
  const sub = document.getElementById("playlistPanelSub");
  const chapter = currentChapters[currentChapterIndex];
  const label = chapter?.path.length ? chapter.path.join(" · ") : "NKD YouTube";
  const position = chapter
    ? `${currentVideoIndex - chapter.startIndex + 1} / ${chapter.videos.length}`
    : "0 / 0";

  const strong = document.createElement("span");
  strong.textContent = position;
  sub.textContent = `${label} · `;
  sub.appendChild(strong);
}

// Chapter cards under the video, grouped by canto / khand when there is one
function renderChapterSection() {
  const section = document.getElementById("watchChapters");
  const container = document.getElementById("watchChapterList");
  container.innerHTML = "";

  const hasChapters = currentChapters.some((c) => c.path.length);
  section.hidden = !hasChapters;
  if (!hasChapters) return;

  document.getElementById("watchChaptersSub").textContent =
    `${currentChapters.length} chapters · ${currentPlaylistVideos.length} videos`;

  const groupStats = {};
  currentChapters.forEach((chapter) => {
    const key = chapterGroupKey(chapter);
    groupStats[key] ??= { chapters: 0, videos: 0 };
    groupStats[key].chapters += 1;
    groupStats[key].videos += chapter.videos.length;
  });

  openedChapterGroupKey = null;
  let grid = null;
  let gridKey = null;
  currentChapters.forEach((chapter, i) => {
    const key = chapterGroupKey(chapter);
    if (!grid || key !== gridKey) {
      gridKey = key;
      grid = document.createElement("div");
      grid.className = "image_container playlist-grid playlist-grid--compact";
      container.appendChild(
        key ? createChapterGroup(key, groupStats[key], grid) : grid,
      );
    }

    const first = chapter.videos[0];
    const card = createThumbnailCard({
      title: chapter.path[chapter.path.length - 1],
      thumbnailUrl: first.thumbnailMedium || first.thumbnailDefault || "",
      badge: `${chapter.videos.length} videos`,
      hoverText: "Play",
      meta: first.title,
    });
    card.dataset.chapter = i;
    card.dataset.meta = first.title;
    // "NKD · 12 Oct 2026": the newest video in this chapter
    const latest = latestVideoTime(chapter.videos);
    if (latest) {
      const dateLine = document.createElement("div");
      dateLine.className = "image_date";
      dateLine.textContent = `NKD · ${formatVideoDate(latest)}`;
      card.appendChild(dateLine);
    }
    // Staggers the cards' entrance when their group opens
    card.style.setProperty("--i", Math.min(grid.children.length, 12));
    card.querySelector(".image_thumb_wrap").insertAdjacentHTML(
      "beforeend",
      `<span class="now-playing" aria-hidden="true">
        <span class="eq"><i></i><i></i><i></i><i></i></span>
        <span class="now-playing__label"><span class="when-playing">Now playing</span><span class="when-paused">Paused</span><span class="when-ready">Ready to play</span></span>
      </span>`,
    );
    card.addEventListener("click", () => playVideoAt(chapter.startIndex, true));
    grid.appendChild(card);
  });
  updateChapterSectionActive();
}

function chapterGroupKey(chapter) {
  return chapter.path.slice(0, -1).join(" · ");
}

function createChapterGroup(title, stats, grid) {
  const group = document.createElement("div");
  group.className = "chapter-group";
  group.dataset.group = title;
  group.innerHTML = `
    <button type="button" class="chapter-group__head" aria-expanded="false">
      <span class="chapter-group__icon">${ICON_BOOK}</span>
      <span class="chapter-group__text">
        <span class="chapter-group__title"></span>
        <span class="chapter-group__meta"></span>
      </span>
      <span class="chapter-group__live">
        <span class="eq eq--sm" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="when-playing">Now playing</span><span class="when-paused">Paused</span><span class="when-ready">Ready to play</span>
      </span>
      <span class="chapter-group__chev">${ICON_CHEVRON}</span>
    </button>
    <div class="chapter-group__panel">
      <div class="chapter-group__inner"></div>
    </div>
  `;
  group.querySelector(".chapter-group__title").textContent = title;
  group.querySelector(".chapter-group__meta").textContent =
    `${stats.chapters} chapters · ${stats.videos} videos`;
  group.querySelector(".chapter-group__inner").appendChild(grid);
  group
    .querySelector(".chapter-group__head")
    .addEventListener("click", () => toggleChapterGroup(group));
  return group;
}

function toggleChapterGroup(group) {
  const open = !group.classList.contains("open");
  if (
    !open ||
    !window.matchMedia("(max-width: 640px)").matches ||
    ![...group.parentElement.querySelectorAll(":scope > .chapter-group.open")]
      .some((other) => other !== group)
  ) {
    setChapterGroupOpen(group, open);
    return;
  }

  const screen = document.getElementById(youTubePlayListItemContainer);
  const head = group.querySelector(".chapter-group__head");
  const initialTop = head.getBoundingClientRect().top;
  setChapterGroupOpen(group, true, true);
  screen.scrollTop += head.getBoundingClientRect().top - initialTop;
}

// One group open at a time, like an accordion
function setChapterGroupOpen(group, open, instantlyCloseSiblings = false) {
  if (open) {
    group.classList.remove("is-instantly-closed");
    group.parentElement
      .querySelectorAll(":scope > .chapter-group.open")
      .forEach((other) => {
        if (other !== group) {
          if (instantlyCloseSiblings) {
            other.classList.add("is-instantly-closed");
          }
          setChapterGroupOpen(other, false);
        }
      });
  }
  group.classList.toggle("open", open);
  group
    .querySelector(".chapter-group__head")
    .setAttribute("aria-expanded", open);
}

// Highlights the playing chapter; its subtitle names the video playing now.
// The group holding it opens whenever playback moves into a new group.
function updateChapterSectionActive() {
  const playing = currentPlaylistVideos[currentVideoIndex];
  document.querySelectorAll("#watchChapterList .image_card").forEach((card) => {
    const isCurrent = Number(card.dataset.chapter) === currentChapterIndex;
    card.classList.toggle("is-current", isCurrent);
    card.querySelector(".image_meta").textContent =
      isCurrent && playing
        ? `${PLAYBACK_PREFIX[playbackState] || "Playing"}: ${playing.title}`
        : card.dataset.meta;
  });

  const chapter = currentChapters[currentChapterIndex];
  const currentKey = chapter ? chapterGroupKey(chapter) : null;
  document.querySelectorAll("#watchChapterList .chapter-group").forEach((group) => {
    const isCurrent = group.dataset.group === currentKey;
    group.classList.toggle("is-current", isCurrent);
    if (isCurrent && currentKey !== openedChapterGroupKey) {
      setChapterGroupOpen(group, true);
    }
  });
  openedChapterGroupKey = currentKey;
}

// Marks the playing row, opens its groups and scrolls it into the panel
function highlightActiveVideo() {
  const list = document.getElementById("youTubeItemAccordion");
  list
    .querySelectorAll(".pl-item.is-active")
    .forEach((row) => row.classList.remove("is-active"));

  const row = list.querySelector(`.pl-item[data-index="${currentVideoIndex}"]`);
  if (!row) return;
  row.classList.add("is-active");

  for (
    let group = row.closest(".accordion-item");
    group;
    group = group.parentElement.closest(".accordion-item")
  ) {
    if (!group.classList.contains("open")) {
      group.parentElement
        .querySelectorAll(":scope > .accordion-item.open")
        .forEach((sibling) => setGroupOpen(sibling, false));
      setGroupOpen(group, true);
    }
  }

  // Only the desktop panel scrolls on its own; on phones the page scrolls
  if (list.scrollHeight > list.clientHeight) {
    const rowBox = row.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    if (rowBox.top < listBox.top || rowBox.bottom > listBox.bottom) {
      list.scrollTop +=
        rowBox.top - listBox.top - listBox.height / 2 + rowBox.height / 2;
    }
  }
}

function videoMetaText(video) {
  const date = formatVideoDate(video.publishedAt);
  return date ? `NKD · ${date}` : "NKD";
}

function formatVideoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
//#endregion

const populateCCData = (playlistName, rowData) => {
  const ccMap = {
    "sutra khand": "Sutra Khand",
    "antya khand": "Antya Khand",
    "shesh khand": "Shesh Khand",
    balyaleela: "Balya Leela",
    "balya leela": "Balya Leela",

    adl: "Adi Khand",
    "adi khand": "Adi Khand",

    ml: "Madhya Leela",
    "madhya leela": "Madhya Leela",
    "madhya khand": "Madhya Khand",
    "mahya khand": "Madhya Khand",

    al: "Antya Lila",
    "antya lila": "Antya Lila",

    "paugand leela": "Paugand Leela",
    "kishore leela": "Kishore Leela",
  };

  const grouped = {};
  rowData.forEach((item) => {
    const [title, videoID, publishedAt, thumbnailMedium, thumbnailDefault] =
      item;

    if (!thumbnailMedium || thumbnailMedium.trim() === "") return;

    let match = null;
    switch (playlistName) {
      case "Sri Chaitanya Charitamrit":
        match = title.match(
          /(Adi Leela|ADL|Madhya Leela|ML|Antya Lila|AL).*?(\d+)\.\d+/i,
        );
        break;
      case "Sri Chaitanya Mangal":
      case "Sri Chaitanya Bhagwat":
        match = title.match(
          /(Sutra Khand|Adi Khand|Madhya Khand|Antya Khand|Shesh Khand|Balyaleela|Balya Leela|Paugand Leela|Kishore Leela|Madhya leela|Mahya Khand).*?(\d+)\.\d+/i,
        );
        break;
    }

    let khand = null;
    let chapterNum = null;
    if (match) {
      khand = ccMap[match[1].trim().toLowerCase()];
      chapterNum = match[2];
    } else {
      khand = "Unknown";
      chapterNum = "Unknown";
    }

    const chapterKey = `Chapter ${chapterNum}`;

    if (!grouped[khand]) {
      grouped[khand] = {};
    }

    if (!grouped[khand][chapterKey]) {
      grouped[khand][chapterKey] = [];
    }

    grouped[khand][chapterKey].push({
      title,
      videoID,
      publishedAt,
      thumbnailMedium,
      thumbnailDefault,
    });
  });

  return grouped;
};

const populateGitaData = (rowData) => {
  const chapterData = {};

  rowData.forEach((item) => {
    const [title, videoID, publishedAt, thumbnailMedium, thumbnailDefault] =
      item;

    if (!thumbnailMedium || thumbnailMedium.trim() === "") return;
    // Match chapter number from either "3.43" or "Chapter 3.Summary"
    let match = title.match(/(?:Chapter\s*)?(\d+)(?:\.\d+)?/i);
    let chapterNum = null;

    if (match) {
      chapterNum = parseInt(match[1], 10);
    } else {
      chapterNum = "Unknown";
    }

    const chapterKey = `Chapter ${chapterNum}`;

    if (!chapterData[chapterKey]) {
      chapterData[chapterKey] = [];
    }

    chapterData[chapterKey].push({
      title,
      videoID,
      publishedAt,
      thumbnailMedium,
      thumbnailDefault,
    });
  });

  return chapterData;
};

const populateSBData = (rowData) => {
  const tempData = {}; // Step 1: Raw grouping

  rowData.forEach((item) => {
    const [title, videoID, publishedAt, thumbnailMedium, thumbnailDefault] =
      item;

    if (!thumbnailMedium || thumbnailMedium.trim() === "") return;
    const match = title.match(/(\d+)\.(\d+)(?:\.(\d+))?/);

    let cantoNum = null;
    let chapterNum = null;
    if (match) {
      cantoNum = parseInt(match[1], 10);
      chapterNum = parseInt(match[2], 10);
    } else {
      cantoNum = "Unknown";
      chapterNum = "Unknown";
    }

    const cantoKeyRaw = `SB Canto ${cantoNum}`;
    const chapterKeyRaw = `Chapter ${chapterNum}`;

    if (!tempData[cantoKeyRaw]) tempData[cantoKeyRaw] = {};
    if (!tempData[cantoKeyRaw][chapterKeyRaw])
      tempData[cantoKeyRaw][chapterKeyRaw] = [];

    // Push video
    tempData[cantoKeyRaw][chapterKeyRaw].push({
      title,
      videoID,
      publishedAt,
      thumbnailMedium,
      thumbnailDefault,
    });
  });

  return tempData;
};

function filterPlaylists(searchValue) {
  const lowerSearchValue = searchValue.toLowerCase();
  const filteredPlaylists = playlistsData?.filter((playlist) =>
    playlist?.snippet?.title.toLowerCase().includes(lowerSearchValue),
  );
  renderPlaylists(filteredPlaylists);
}

function filteryouTubeItem(searchValue) {
  if (!completeYoutubeData[currentPlayListName]) return;
  currentPanelQuery = searchValue.trim().toLowerCase();
  renderPlaylistPanel();
}

//#region Header search: filters whichever screen is open
let activeScreenId = youTubeContainerNew;

function getHeaderSearchPlaceholder(screenId) {
  switch (screenId) {
    case youTubePlayListItemContainer:
      return `Search in ${currentPlayListName || "playlist"}`;
    case youTubeShortsContainer:
      return "Search shorts";
    default:
      return "Search playlists";
  }
}

function onHeaderSearchInput(value) {
  document
    .getElementById("headerSearchClear")
    .classList.toggle("is-visible", value.length > 0);

  switch (activeScreenId) {
    case youTubePlayListItemContainer:
      filteryouTubeItem(value);
      break;
    case youTubeShortsContainer:
      filterShorts(value);
      // Phones: results live in the "All shorts" sheet
      if (value) openShortsSheet();
      break;
    default:
      filterPlaylists(value);
  }
}

function clearHeaderSearch(keepFocus = true) {
  const input = document.getElementById("headerSearchInput");
  if (input.value) {
    input.value = "";
    onHeaderSearchInput("");
  }
  if (keepFocus) input.focus();
}

// Results filter live while typing; Enter just closes the phone keyboard
function submitHeaderSearch() {
  document.getElementById("headerSearchInput").blur();
}

function openMobileSearch() {
  document.querySelector(".app-header").classList.add("is-searching");
  document.getElementById("headerSearchInput").focus();
}

function closeMobileSearch() {
  document.querySelector(".app-header").classList.remove("is-searching");
  clearHeaderSearch(false);
  // Drop focus so the phone keyboard closes along with the search bar
  document.getElementById("headerSearchInput").blur();
}

document.addEventListener("screenchange", (event) => {
  activeScreenId = event.detail;
  const input = document.getElementById("headerSearchInput");
  // Each screen renders unfiltered when opened, so just reset the box
  input.value = "";
  input.placeholder = getHeaderSearchPlaceholder(activeScreenId);
  document.getElementById("headerSearchClear").classList.remove("is-visible");
  document.querySelector(".app-header").classList.remove("is-searching");
  // On the Shorts page the Shorts button would go nowhere: show Home instead
  const onShorts = activeScreenId === youTubeShortsContainer;
  document.getElementById("headerShortsBtn").hidden = onShorts;
  document.getElementById("headerHomeBtn").hidden = !onShorts;
});
//#endregion

function backToPlayList() {
  filterPlaylists("");
  SHOW_SPECIFIC_DIV("youTubeContainer");
}

/*youtube short code*/
let visibleShorts = []; // the shorts in the grid right now (after search)
let currentShortId = null;

async function openyouTubeShortsWindow() {
  // Fetched once per visit: the search API costs 100 quota units per call
  if (shortsItemData.length) renderShorts(shortsItemData);
  else await fetchYouTubeShorts();
  SHOW_SPECIFIC_DIV(youTubeShortsContainer);
  document.getElementById(youTubeShortsContainer).scrollTop = 0;
  if (visibleShorts.length) playShortAt(0, false);
}

// Reads the channel's Shorts playlist: 1 quota unit per 50 shorts (the old
// search request cost 100 units per call). Items are reshaped to the
// { id: { videoId }, snippet } form the rest of the Shorts code uses.
async function fetchShortsFromPlaylist() {
  const shorts = [];
  let pageToken = "";
  for (let page = 0; page < SHORTS_MAX_PAGES; page++) {
    const data = await youTubeApiGet(
      `/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${NKD_SHORTS_PLAYLIST_ID}` +
        (pageToken ? `&pageToken=${pageToken}` : ""),
    );
    for (const item of data.items || []) {
      const { snippet, contentDetails } = item;
      // Private or deleted shorts stay in the playlist without a thumbnail
      if (!snippet?.thumbnails?.medium) continue;
      shorts.push({
        id: { videoId: snippet.resourceId.videoId },
        snippet: {
          title: snippet.title,
          publishedAt: contentDetails?.videoPublishedAt || snippet.publishedAt,
          thumbnails: snippet.thumbnails,
        },
      });
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return shorts;
}

async function fetchYouTubeShorts() {
  const items = await loadWithCache("nkd-yt-shorts", fetchShortsFromPlaylist);
  if (!items) return;
  // Newest short first
  items.sort(
    (a, b) =>
      (Date.parse(b.snippet.publishedAt) || 0) -
      (Date.parse(a.snippet.publishedAt) || 0),
  );
  shortsItemData = items;
  renderShorts(items);
}

// The search API returns HTML-escaped titles (&#39;, &amp;)
function decodeHtmlEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

//#region Phones: full-screen reel with an "All shorts" sheet
const isPhoneShorts = () => window.matchMedia("(max-width: 760px)").matches;

function openShortsSheet() {
  if (!isPhoneShorts()) return;
  const page = document.getElementById(youTubeShortsContainer);
  page.classList.add("sheet-open");
  setShortsTab(true);
  // Bring the playing short into view inside the sheet's own list
  // (scrollIntoView would also scroll the full-screen page behind it)
  const grid = document.getElementById("youTubeShortsImageCardView");
  const current = grid.querySelector(".short-card.is-current");
  if (current) {
    grid.scrollTop =
      current.offsetTop - grid.offsetTop - grid.clientHeight / 2 +
      current.offsetHeight / 2;
  }
  page.scrollTop = 0;
}

function closeShortsSheet() {
  document
    .getElementById(youTubeShortsContainer)
    .classList.remove("sheet-open");
  setShortsTab(false);
}

function setShortsTab(allShorts) {
  const tab = document.getElementById("shortsAllTab");
  tab.classList.toggle("is-active", allShorts);
  tab.setAttribute("aria-expanded", allShorts);
}

// Leaving the Shorts page or widening the window closes the sheet
document.addEventListener("screenchange", closeShortsSheet);
window.matchMedia("(max-width: 760px)").addEventListener("change", closeShortsSheet);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeShortsSheet();
});
//#endregion

function shortVideoId(short) {
  return short.id?.videoId || short.id;
}

function renderShorts(shorts) {
  const container = document.getElementById("youTubeShortsImageCardView");
  container.innerHTML = ""; // Clear container
  visibleShorts = shorts;

  const total = shortsItemData.length;
  document.getElementById("shortsTabCount").textContent = total;
  document.getElementById("shortsCount").textContent =
    shorts.length === total
      ? `${total} shorts`
      : `${shorts.length} of ${total} shorts`;
  updateShortsLatest();

  if (!shorts.length) {
    const empty = document.createElement("div");
    empty.className = "pl-empty shorts-empty";
    empty.textContent = "No shorts match your search.";
    container.appendChild(empty);
    return;
  }

  shorts.forEach((short, index) => {
    try {
      container.appendChild(createShortCard(short, index));
    } catch (ex) {
      console.log("renderShorts : error", ex.message);
    }
  });
  highlightCurrentShort();
}

// "Latest 29 May 2026": when the newest short was posted
function updateShortsLatest() {
  const newest = shortsItemData
    .map((short) => short.snippet.publishedAt)
    .filter(Boolean)
    .sort()
    .pop();
  const date = formatVideoDate(newest);
  document.getElementById("shortsLatestChip").hidden = !date;
  document.getElementById("shortsLatest").textContent = `Latest ${date}`;
}

// Portrait card: the 16:9 thumbnail is cropped to the vertical video inside it
// YouTube-style card: clean portrait thumbnail, title and date below it
function createShortCard(short, index) {
  const { title, thumbnails, publishedAt } = short.snippet;
  const videoId = shortVideoId(short);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "short-card";
  card.dataset.id = videoId;
  card.style.setProperty("--i", Math.min(index, 12));
  card.innerHTML = `
    <span class="short-card__thumb">
      <img class="short-card__img" loading="lazy" alt="" />
      <span class="short-card__now">Now showing</span>
      <span class="short-card__play" aria-hidden="true"></span>
    </span>
    <span class="short-card__title"></span>
    <span class="short-card__meta"></span>
  `;
  const plainTitle = decodeHtmlEntities(title);
  setShortThumbnail(
    card.querySelector(".short-card__img"),
    videoId,
    (thumbnails.high || thumbnails.medium).url,
  );
  card.querySelector(".short-card__title").textContent = plainTitle;
  const date = formatVideoDate(publishedAt);
  card.querySelector(".short-card__meta").textContent = date
    ? `NKD · ${date}`
    : "NKD";
  card.setAttribute("aria-label", plainTitle);
  card.addEventListener("click", () => playShortAt(index, true));
  return card;
}

// The 1280x720 thumbnail is much sharper; when a short has none, YouTube
// returns a tiny 120x90 placeholder, so fall back to the API thumbnail
// (4:3 with letterbox bars, zoomed by CSS to hide them)
function setShortThumbnail(img, videoId, fallbackUrl) {
  const useFallback = () => {
    img.onload = img.onerror = null;
    img.classList.add("is-letterboxed");
    img.src = fallbackUrl;
  };
  img.onload = () => {
    if (img.naturalWidth < 200) useFallback();
  };
  img.onerror = useFallback;
  img.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

function playShortAt(index, autoplay) {
  const short = visibleShorts[index];
  if (!short) return;
  currentShortId = shortVideoId(short);

  const iframe = document.getElementById("youTubeShortVideoIframe");
  iframe.src =
    YOUTUBE_EMBED_URL +
    currentShortId +
    "?rel=0&playsinline=1" +
    (autoplay ? "&autoplay=1" : "");

  const { title, publishedAt } = short.snippet;
  const date = formatVideoDate(publishedAt);
  document.getElementById("shortTitle").textContent = decodeHtmlEntities(title);
  // Ambient glow behind the player, taken from the short's own thumbnail
  const thumbs = short.snippet.thumbnails;
  document
    .querySelector(".shorts-stage")
    .style.setProperty(
      "--ambient",
      `url("${(thumbs.high || thumbs.medium).url}")`,
    );
  document.getElementById("shortMeta").textContent = date || "NKD";
  // Phone bottom bar under the video
  document.getElementById("shortsBarTitle").textContent = decodeHtmlEntities(title);
  document.getElementById("shortsBarMeta").textContent =
    `${date ? `${date} · ` : ""}${index + 1} of ${visibleShorts.length}`;
  document.getElementById("shortPosition").textContent =
    `${index + 1} / ${visibleShorts.length}`;
  document.getElementById("shortProgressFill").style.width =
    `${((index + 1) / visibleShorts.length) * 100}%`;
  document.getElementById("shortOnYouTube").href =
    `https://www.youtube.com/shorts/${currentShortId}`;
  document.getElementById("shortPrevBtn").disabled = index <= 0;
  document.getElementById("shortNextBtn").disabled =
    index >= visibleShorts.length - 1;
  highlightCurrentShort();

  // Phones: picking a short from the sheet closes it to show the player
  if (autoplay) closeShortsSheet();
}

function playAdjacentShort(step) {
  const index = visibleShorts.findIndex(
    (short) => shortVideoId(short) === currentShortId,
  );
  playShortAt(index + step, true);
}

function highlightCurrentShort() {
  document
    .querySelectorAll("#youTubeShortsImageCardView .short-card")
    .forEach((card) =>
      card.classList.toggle("is-current", card.dataset.id === currentShortId),
    );
}

// Sticky player card (desktop): the video is sized so the whole card (video,
// title, channel row) fits on screen while pinned 16px below the header.
// Only on very small screens, where even the minimum size does not fit,
// does the top offset go negative so the card's bottom stays reachable.
const SHORT_MIN_W = 180;
const SHORT_MAX_W = 400;

function updateShortsStageTop() {
  const page = document.getElementById(youTubeShortsContainer);
  const stage = page.querySelector(".shorts-stage");
  const video = stage.querySelector(".video-container--short");
  const gap = 16;
  const padTop = parseFloat(getComputedStyle(page).paddingTop) || 0;
  const desktop = window.matchMedia("(min-width: 761px)").matches;
  const host = page.querySelector(".shorts-page"); // where --short-w lives

  if (desktop && video.offsetWidth) {
    // Everything in the card that is not the video
    const chrome = stage.offsetHeight - video.offsetHeight;
    const fitHeight = page.clientHeight - 2 * gap - chrome;
    const width = Math.round(
      Math.max(
        SHORT_MIN_W,
        Math.min(SHORT_MAX_W, window.innerWidth * 0.3, (fitHeight * 9) / 16),
      ),
    );
    const current = parseFloat(host.style.getPropertyValue("--short-w"));
    // Ignore 1-2px changes so the observer settles instead of looping
    if (!current || Math.abs(current - width) > 2) {
      host.style.setProperty("--short-w", `${width}px`);
    }
  } else {
    host.style.removeProperty("--short-w");
  }

  // Sticky offsets are measured inside the page's top padding
  const visualTop = Math.min(gap, page.clientHeight - stage.offsetHeight - gap);
  stage.style.setProperty("--stage-top", `${visualTop - padTop}px`);
}

if (window.ResizeObserver) {
  const stageObserver = new ResizeObserver(updateShortsStageTop);
  stageObserver.observe(document.getElementById(youTubeShortsContainer));
  stageObserver.observe(document.querySelector(".shorts-stage"));
}

// Arrow keys move between shorts: down / right = next, up / left = previous
const SHORT_KEY_STEP = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
document.addEventListener("keydown", (event) => {
  if (activeScreenId !== youTubeShortsContainer) return;
  if (event.target.closest("input, textarea, select")) return;
  const step = SHORT_KEY_STEP[event.key];
  if (!step) return;
  event.preventDefault();
  playAdjacentShort(step);
});

function filterShorts(query) {
  if (!Array.isArray(shortsItemData)) return;

  const lowerQuery = query.toLowerCase();

  const filtered = shortsItemData.filter((short) => {
    const title = short.snippet?.title?.toLowerCase() || "";
    return title.includes(lowerQuery);
  });

  renderShorts(filtered);
}
