(() => {
  const measurementId = document.documentElement.dataset.googleAnalyticsId;
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
})();

(() => {
  const lightbox = document.querySelector("[data-image-lightbox]");
  if (!lightbox) return;

  const image = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector(".image-lightbox-close");
  const close = () => {
    lightbox.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
    document.body.classList.remove("lightbox-open");
  };

  document.querySelectorAll(".image-zoom-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      image.src = button.dataset.fullSrc || "";
      image.alt = button.dataset.alt || "";
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });
  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) close();
  });
})();

(() => {
  const triggers = document.querySelectorAll(".audio-trigger");
  const playAllButton = document.querySelector("[data-audio-play-all]");
  const loopSwitch = document.querySelector("[data-audio-loop]");
  if (!triggers.length && !playAllButton) return;

  const audio = document.querySelector("[data-audio-player]") || new Audio();
  let activeTrigger = null;
  let queue = [];
  let playAllQueue = [];
  let isPlayingAll = false;
  const clearActiveTrigger = () => {
    if (activeTrigger) activeTrigger.classList.remove("is-playing");
    activeTrigger = null;
  };
  const highlightQueueItem = (item) => {
    clearActiveTrigger();
    if (!item) return;
    activeTrigger = Array.from(triggers).find(
      (trigger) =>
        trigger.dataset.audioSegment === item.segment_id &&
        trigger.dataset.audioLanguage === item.language,
    );
    if (activeTrigger) activeTrigger.classList.add("is-playing");
  };
  const playSource = (source) => {
    if (!source) return;
    audio.src = source;
    audio.play().catch(() => {
      queue = [];
      playAllQueue = [];
      isPlayingAll = false;
      clearActiveTrigger();
    });
  };
  const playQueueItem = (item) => {
    if (!item) return;
    highlightQueueItem(item);
    playSource(item.url);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      audio.pause();
      queue = [];
      playAllQueue = [];
      isPlayingAll = false;
      clearActiveTrigger();
      activeTrigger = trigger;
      activeTrigger.classList.add("is-playing");
      playSource(trigger.dataset.audioSrc || "");
    });
  });

  if (playAllButton) {
    const manifestElement = document.getElementById("audio-manifest-data");
    const trackSelect = document.querySelector("[data-audio-track-select]");
    const manifest = manifestElement ? JSON.parse(manifestElement.textContent) : null;
    playAllButton.addEventListener("click", () => {
      const trackId = trackSelect?.value || manifest?.default_track_id;
      const track = manifest?.tracks?.find((item) => item.track_id === trackId);
      const language = (track?.code || "").split("-", 1)[0].toLowerCase();
      playAllQueue = (track?.playlist || [])
        .filter((clip) => clip.url)
        .map((clip) => ({ ...clip, language }));
      queue = [...playAllQueue];
      isPlayingAll = queue.length > 0;
      audio.pause();
      clearActiveTrigger();
      playQueueItem(queue.shift());
    });
  }

  audio.addEventListener("ended", () => {
    if (queue.length) {
      playQueueItem(queue.shift());
      return;
    }
    if (isPlayingAll && loopSwitch?.checked && playAllQueue.length) {
      queue = [...playAllQueue];
      playQueueItem(queue.shift());
      return;
    }
    isPlayingAll = false;
    clearActiveTrigger();
  });
  audio.addEventListener("error", () => {
    queue = [];
    playAllQueue = [];
    isPlayingAll = false;
    clearActiveTrigger();
  });
})();

(() => {
  const routesElement = document.getElementById("scene-routes");
  if (!routesElement) return;

  const sceneRoutes = JSON.parse(routesElement.textContent);
  const status = document.getElementById("redirect-status");
  const form = document.getElementById("daily-lookup");
  const input = document.getElementById("scene-number");
  const rawNumber = new URLSearchParams(window.location.search).get("no");
  const sceneNumber = rawNumber === null ? "" : rawNumber.trim();

  const showForm = (message, value = "") => {
    status.textContent = message;
    input.value = value;
    form.hidden = false;
    input.focus();
  };

  const openConversation = (number) => {
    if (!/^[1-9]\d*$/.test(number)) {
      showForm("Enter a positive whole number.", number);
      return;
    }

    const target = sceneRoutes[number];
    if (!target) {
      showForm(`Conversation No. ${number} was not found.`, number);
      return;
    }

    status.textContent = `Opening conversation No. ${number}…`;
    window.location.replace(new URL(target, window.location.href).href);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    openConversation(input.value.trim());
  });

  if (sceneNumber) {
    openConversation(sceneNumber);
  } else {
    showForm("Enter a conversation number to open it.");
  }
})();
