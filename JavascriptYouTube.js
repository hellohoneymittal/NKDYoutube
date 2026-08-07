const youTubeContainerNew = "youTubeContainer";
const youTubePlayListItemContainer = "youTubePlayListItemContainer";
const youTubePlayVideoContainer = "youTubePlayVideoContainer";
const youTubeShortsContainer = "youTubeShortsContainer";
let playlistsData = [];
let playListInnerItemData = [];
let shortsItemData = [];
let completeYoutubeData = {};
let currentPlayListName = "";

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

async function fetchPlaylists() {
  try {
    // Fetch all playlists
    IsLoading(true);
    const playlistsResponse = await fetch(
      BASE_URL_YOUTUBE +
        "/playlists?part=snippet&channelId=UCyPwLzmeTmyhpDsCBrMubbQ&maxResults=50&key=" +
        API_KEY_YOUTUBE_NKD
    );
    IsLoading(false);

    if (!playlistsResponse.ok) {
      SHOW_ERROR_POPUP(`HTTP error! Status: ${playlistsResponse.status}`);
      throw new Error(`HTTP error! Status: ${playlistsResponse.status}`);
    }

    const data = await playlistsResponse.json();

    const sortedPlaylists = [
      ...sortOrder
        .map((title) => data.items.find((item) => item.snippet.title === title))
        .filter(Boolean),

      ...data.items.filter((item) => !sortOrder.includes(item.snippet.title)),
    ];

    if (data.items) {
      playlistsData = sortedPlaylists;

      renderPlaylists(playlistsData);
    } else {
      console.error("No playlists found.", data);
    }
  } catch (error) {
    console.error("Error fetching playlists:", error.message);
  }
}

function renderPlaylists(playlists) {
  const container = document.getElementById("youTubePlayListImageCardView");
  container.innerHTML = ""; // Clear container

  // Iterate through each playlist and log its name and URL
  playlists.forEach((playlist) => {
    try {
      const { title, thumbnails } = playlist.snippet;
      const playlistId = playlist.id;
      const card = document.createElement("div");
      card.className = "image_card";

      card.innerHTML = `
                <img class="image_thumbnail" src="${thumbnails.medium.url}" alt="${title}" />
                <div class="image_title">${title}</div>
              `;

      card.addEventListener("click", () => {
        console.log("playlist Name", title);
        const titleTrimed = title.trim();
        fetchPlaylistItems(titleTrimed);
      });
      container.appendChild(card);
    } catch (ex) {
      console.log("renderPlaylists : error", ex.message);
    }
  });
}

async function fetchPlaylistItems(playlistName) {
  try {
    currentPlayListName = playlistName;
    let apiResponse;
    let modifiedApiResponse;
    if (!completeYoutubeData[playlistName]) {
      apiResponse = await CALL_API("GET_YOUTUBE_PLAYLIST_DATA", {
        playlistName: playlistName,
      });
    }
    document.getElementById("youTubeItemAccordion").innerHTML = "";

    switch (playlistName) {
      case "Sri Chaitanya Bhagwat":
      case "Sri Chaitanya Mangal":
      case "Sri Chaitanya Charitamrit": {
        let ccResponse;
        if (completeYoutubeData[playlistName]) {
          ccResponse = completeYoutubeData[playlistName];
        } else {
          ccResponse = populateCCData(playlistName, apiResponse.result);
          completeYoutubeData[playlistName] = ccResponse;
        }

        createMainAccordion(ccResponse);
        break;
      }
      case "Srimad Bhagavatam": {
        let sbResponse;
        debugger;
        if (completeYoutubeData[playlistName]) {
          sbResponse = completeYoutubeData[playlistName];
        } else {
          sbResponse = populateSBData(apiResponse.result);
          completeYoutubeData[playlistName] = sbResponse;
        }
        createMainAccordion(sbResponse);
        break;
      }
      case "Bhagavad Gita As It Is":
      case "Bhagavad Gita as it is Version 2.0": {
        let bgResponse;
        if (completeYoutubeData[playlistName]) {
          bgResponse = completeYoutubeData[playlistName];
        } else {
          bgResponse = populateGitaData(apiResponse.result);
          completeYoutubeData[playlistName] = bgResponse;
        }

        for (const [title, data] of Object.entries(bgResponse)) {
          CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
            "youTubeItemAccordion",
            "101",
            { title: `${title} (${data.length})`, data: data },
            onYouTubeVideoClick
          );
        }
        break;
      }

      default: {
        if (completeYoutubeData[playlistName]) {
          const data = completeYoutubeData[playlistName];
          CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
            "youTubeItemAccordion",
            "101",
            { title: `${playlistName} (${data.length})`, data: data },
            onYouTubeVideoClick
          );
        } else {
          modifiedApiResponse = apiResponse.result.map(function (row) {
            return {
              title: row[0],
              videoID: row[1],
              publishedAt: row[2],
              thumbnailMedium: row[3],
              thumbnailDefault: row[4],
            };
          });
          completeYoutubeData[playlistName] = modifiedApiResponse;

          CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
            "youTubeItemAccordion",
            "101",
            {
              title: `${playlistName} (${modifiedApiResponse.length})`,
              data: modifiedApiResponse,
            },
            onYouTubeVideoClick
          );
        }
      }
    }

    document.getElementById("playlistH2Ctrl").innerText = playlistName;
    SHOW_SPECIFIC_DIV(youTubePlayListItemContainer);
  } catch (error) {
    console.error("Error fetching playlist items:", error);
  }
}

function CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
  accordionContainerId,
  parentId,
  item,
  callback
) {
  debugger;
  const accordionContainer = document.getElementById(accordionContainerId);
  const accordionItem = document.createElement("div");
  accordionItem.classList.add("accordion-item");

  const header = document.createElement("button");
  header.classList.add("accordion-header");
  header.innerHTML = `${item.title} <span class="icon">▼</span>`;

  const content = document.createElement("div");
  content.classList.add("accordion-content");
  debugger;
  // Check if links exist in the provided item
  if (item.data) {
    // Iterate over the links directly from the item object
    let videoStaticPart = "https://www.youtube.com/embed/";
    item.data.forEach((linkData) => {
      const link = document.createElement("a");
      link.href = videoStaticPart + linkData.videoID;
      link.textContent = linkData.title;

      // Add a click event listener for each link
      link.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default link behavior
        callback(linkData.videoID, parentId, item.title, linkData.title);
      });

      content.appendChild(link);
    });
  } else if (item.content) {
    content.innerHTML = `<p>${item.content}</p>`; // If content exists, just append it
  }

  // Toggle the accordion section on click
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

function onYouTubeVideoClick(videoID, parentId, playListTitle, itemTitle) {
  const iframe = document.getElementById("youTubeVideoIframe");
  const videoDiv = document.getElementById("youTubeVideoIframeDiv");
  let videoStaticPart = "https://www.youtube.com/embed/";

  iframe.src = videoStaticPart + videoID;
  videoDiv.style.display = "block";
  iframe.scrollIntoView({
    behavior: "smooth", // Smooth scrolling
    block: "center", // Align the iframe to the center of the viewport
  });
}

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
  const khandChapterCounts = {};
  rowData.forEach((item) => {
    const [title, videoID, publishedAt, thumbnailMedium, thumbnailDefault] =
      item;

    if (!thumbnailMedium || thumbnailMedium.trim() === "") return;

    let match = null;
    switch (playlistName) {
      case "Sri Chaitanya Charitamrit":
        match = title.match(
          /(Adi Leela|ADL|Madhya Leela|ML|Antya Lila|AL).*?(\d+)\.\d+/i
        );
        break;
      case "Sri Chaitanya Mangal":
      case "Sri Chaitanya Bhagwat":
        match = title.match(
          /(Sutra Khand|Adi Khand|Madhya Khand|Antya Khand|Shesh Khand|Balyaleela|Balya Leela|Paugand Leela|Kishore Leela|Madhya leela|Mahya Khand).*?(\d+)\.\d+/i
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
    khandChapterCounts[khand] = (khandChapterCounts[khand] || 0) + 1;
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
    playlist?.snippet?.title.toLowerCase().includes(lowerSearchValue)
  );
  renderPlaylists(filteredPlaylists);
}

function filteryouTubeItem(searchValue) {
  const lowerSearchText = searchValue.toLowerCase();

  // Get the current playlist's data from cache
  const data = completeYoutubeData[currentPlayListName];
  if (!data) return;
  let filteredData;
  document.getElementById("youTubeItemAccordion").innerHTML = "";

  switch (currentPlayListName) {
    case "Sri Chaitanya Bhagwat":
    case "Sri Chaitanya Mangal":
    case "Sri Chaitanya Charitamrit":
    case "Srimad Bhagavatam": {
      filteredData = {};
      for (const [outerKey, chapters] of Object.entries(data)) {
        const matchingChapters = {};

        for (const [chapterKey, videos] of Object.entries(chapters)) {
          const matchedVideos = videos.filter((video) =>
            video.title.toLowerCase().includes(lowerSearchText)
          );
          if (matchedVideos.length > 0) {
            matchingChapters[chapterKey] = matchedVideos;
          }
        }

        if (Object.keys(matchingChapters).length > 0) {
          filteredData[outerKey] = matchingChapters;
        }
      }

      createMainAccordion(filteredData);
      break;
    }
    case "Bhagavad Gita As It Is":
    case "Bhagavad Gita as it is Version 2.0": {
      filteredData = {};

      for (const [chapterKey, videos] of Object.entries(data)) {
        const matchedVideos = videos.filter((video) =>
          video.title.toLowerCase().includes(lowerSearchText)
        );
        if (matchedVideos.length > 0) {
          filteredData[chapterKey] = matchedVideos;
        }
      }

      document.getElementById("youTubeItemAccordion").innerHTML = "";
      for (const [title, videoList] of Object.entries(filteredData)) {
        CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
          "youTubeItemAccordion",
          "101",
          { title: `${title} (${videoList.length})`, data: videoList },
          onYouTubeVideoClick
        );
      }
      break;
    }
    default: {
      filteredData = data.filter((video) =>
        video.title.toLowerCase().includes(lowerSearchText)
      );

      document.getElementById("youTubeItemAccordion").innerHTML = "";

      CREATE_ACCORDIAN_ITEM_WITH_LINKS_YOUTBUE(
        "youTubeItemAccordion",
        "101",
        {
          title: `${currentPlayListName} (${filteredData.length})`,
          data: filteredData,
        },
        onYouTubeVideoClick
      );
      break;
    }
  }
}

function backToPlayList() {
  filterPlaylists("");
  SHOW_SPECIFIC_DIV("youTubeContainer");
}

/*youtube short code*/
async function openyouTubeShortsWindow() {
  await fetchYouTubeShorts();
  SHOW_SPECIFIC_DIV(youTubeShortsContainer);
}

async function fetchYouTubeShorts() {
  try {
    IsLoading(true);
    const shortsResponse = await fetch(
      `${BASE_URL_YOUTUBE}/search?part=snippet&channelId=UCyPwLzmeTmyhpDsCBrMubbQ&type=video&videoDuration=short&maxResults=50&key=${API_KEY_YOUTUBE_NKD}`
    );
    IsLoading(false);

    if (!shortsResponse.ok) {
      SHOW_ERROR_POPUP(`HTTP error! Status: ${shortsResponse.status}`);
      throw new Error(`HTTP error! Status: ${shortsResponse.status}`);
    }

    const data = await shortsResponse.json();

    if (data.items) {
      const shortsData = data.items;
      shortsItemData = shortsData;
      renderShorts(shortsData);
    } else {
      console.error("No Shorts found.", data);
    }
  } catch (error) {
    console.error("Error fetching Shorts:", error.message);
  }
}

function renderShorts(shorts) {
  const container = document.getElementById("youTubeShortsImageCardView");
  container.innerHTML = ""; // Clear container

  // Iterate through each Short and log its name and URL
  shorts.forEach((short) => {
    try {
      const { title, thumbnails } = short.snippet;

      const card = document.createElement("div");
      card.className = "image_card";

      card.innerHTML = `
        <img class="image_thumbnail" src="${thumbnails.medium.url}" alt="${title}" />
        <div class="image_title">${title}</div>
      `;

      card.addEventListener("click", () => {
        embedShortsVideo(short);
      });

      container.appendChild(card);
    } catch (ex) {
      console.log("renderShorts : error", ex.message);
    }
  });
}

function embedShortsVideo(short) {
  try {
    const videoId = short.id.videoId || short.id; // fallback
    if (!videoId) return;

    const iframeDiv = document.getElementById("youTubeShortVideoIframeDiv");
    const iframe = document.getElementById("youTubeShortVideoIframe");

    // Set the iframe src with autoplay
    const embedUrl =
      "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0";

    iframe.src = embedUrl;
    iframeDiv.style.display = "block";

    iframeDiv.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } catch (error) {
    console.log("embedShortsVideo : error", error.message);
  }
}

function filterShorts(query) {
  if (!Array.isArray(shortsItemData)) return;

  const lowerQuery = query.toLowerCase();

  const filtered = shortsItemData.filter((short) => {
    const title = short.snippet?.title?.toLowerCase() || "";
    return title.includes(lowerQuery);
  });

  renderShorts(filtered);
}
