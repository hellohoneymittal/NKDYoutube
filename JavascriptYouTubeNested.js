function createNestedAccordion(container, title, links) {
  const chapterItem = document.createElement("div");
  chapterItem.classList.add("accordion-item");

  const chapterHeader = document.createElement("button");
  chapterHeader.classList.add("accordion-header");
  chapterHeader.innerHTML = `${title} <span class="icon">▼</span>`;

  const chapterContent = document.createElement("div");
  chapterContent.classList.add("accordion-content");
  links.forEach((linkData, index) => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = linkData.title;

    link.addEventListener("click", function (event) {
      event.preventDefault();
      onYouTubeVideoClick(linkData.videoID, "", "", "");
    });

    chapterContent.appendChild(link);
  });

  chapterHeader.addEventListener("click", function () {
    const isOpen = chapterContent.style.display === "block";
    container
      .querySelectorAll(".accordion-content")
      .forEach((c) => (c.style.display = "none"));
    container
      .querySelectorAll(".accordion-header")
      .forEach((h) => h.classList.remove("active"));
    if (!isOpen) {
      chapterContent.style.display = "block";
      chapterHeader.classList.add("active");
    }
  });

  chapterItem.appendChild(chapterHeader);
  chapterItem.appendChild(chapterContent);
  container.appendChild(chapterItem);
}

function createMainAccordion(data) {
  const mainContainer = document.getElementById("youTubeItemAccordion");
  mainContainer.innerHTML = "";

  Object.entries(data).forEach(([cantoTitle, chapters]) => {
    const cantoItem = document.createElement("div");
    cantoItem.classList.add("accordion-item");

    // Calculate total videos in all chapters
    let cantoVideoCount = 0;
    for (const videos of Object.values(chapters)) {
      cantoVideoCount += videos.length;
    }

    const cantoHeader = document.createElement("button");
    cantoHeader.classList.add("accordion-header");
    cantoHeader.innerHTML = `${cantoTitle} (${cantoVideoCount}) <span class="icon">▼</span>`;

    const cantoContent = document.createElement("div");
    cantoContent.classList.add("accordion-content");

    // Nested accordion inside canto
    Object.entries(chapters).forEach(([chapterTitle, links]) => {
      const chapterTitleWithCount = `${chapterTitle} (${links.length})`;
      createNestedAccordion(cantoContent, chapterTitleWithCount, links);
    });

    cantoHeader.addEventListener("click", function () {
      const isOpen = cantoContent.style.display === "block";
      document
        .querySelectorAll(
          "#youTubeItemAccordion > .accordion-item > .accordion-content"
        )
        .forEach((e) => (e.style.display = "none"));
      document
        .querySelectorAll(
          "#youTubeItemAccordion > .accordion-item > .accordion-header"
        )
        .forEach((h) => h.classList.remove("active"));

      if (!isOpen) {
        cantoContent.style.display = "block";
        cantoHeader.classList.add("active");
      }
    });

    cantoItem.appendChild(cantoHeader);
    cantoItem.appendChild(cantoContent);
    mainContainer.appendChild(cantoItem);
  });
}
