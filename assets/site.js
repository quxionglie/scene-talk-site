(() => {
  const catalogElement = document.getElementById("site-i18n-data");
  if (!catalogElement) return;
  const catalog = JSON.parse(catalogElement.textContent);
  const supported = new Set(["en", "fr", "es"]);
  const storageKey = "scenetalk-site-language";
  const requested = new URLSearchParams(window.location.search).get("lang");
  let saved = "";
  try { saved = window.localStorage.getItem(storageKey); } catch (_) { /* Optional persistence. */ }
  let language = supported.has(requested) ? requested : supported.has(saved) ? saved : "en";
  const translate = (key, values = {}) => {
    const text = catalog[language]?.[key] || catalog.en[key] || key;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  };
  const updateLinks = () => {
    document.querySelectorAll("a[href]").forEach((link) => {
      const raw = link.getAttribute("href");
      if (!raw || raw.startsWith("#") || link.hasAttribute("download")) return;
      const url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) return;
      url.searchParams.set("lang", language);
      link.href = url.href;
    });
  };
  const apply = (next, announce = true) => {
    if (!supported.has(next)) return;
    language = next;
    document.documentElement.lang = language;
    document.documentElement.dataset.siteLanguage = language;
    document.querySelectorAll("[data-site-language-select]").forEach((select) => { select.value = language; });
    document.querySelectorAll("[data-content-language]").forEach((element) => {
      element.hidden = element.dataset.contentLanguage !== language;
    });
    document.querySelectorAll("[data-image-captions]").forEach((figure) => {
      const captions = JSON.parse(figure.dataset.imageCaptions);
      const caption = captions[language] || captions.en || "";
      const image = figure.querySelector("img");
      const button = figure.querySelector(".image-zoom-trigger");
      image.alt = caption;
      button.dataset.alt = caption;
      button.setAttribute("aria-label", caption ? `View larger image: ${caption}` : "View larger image");
    });
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const values = element.dataset.i18nParams ? JSON.parse(element.dataset.i18nParams) : {};
      element.textContent = translate(element.dataset.i18n, values);
    });
    ["aria-label", "placeholder", "title"].forEach((attribute) => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
        element.setAttribute(attribute, translate(element.getAttribute(`data-i18n-${attribute}`)));
      });
    });
    try { window.localStorage.setItem(storageKey, language); } catch (_) { /* Links also preserve language. */ }
    updateLinks();
    if (announce) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      window.history.replaceState(null, "", url.href);
      document.dispatchEvent(new CustomEvent("site-language-change", { detail: { language } }));
    }
  };
  window.SceneTalkLanguage = { current: () => language, translate };
  document.querySelectorAll("[data-site-language-select]").forEach((select) => {
    select.addEventListener("change", () => apply(select.value));
  });
  apply(language, false);
})();

(() => {
  const header = document.querySelector(".site-header");
  const toggle = header?.querySelector("[data-site-nav-toggle]");
  if (!toggle) return;

  const setOpen = (open) => {
    header.classList.toggle("is-navigation-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.hidden = false;
  header.classList.add("has-nav-toggle");
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  header.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.focus();
    event.preventDefault();
  });
})();

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
  let activeButton = null;
  const close = () => {
    lightbox.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
    activeButton = null;
    document.body.classList.remove("lightbox-open");
  };

  document.querySelectorAll(".image-zoom-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      image.src = button.dataset.fullSrc || "";
      image.alt = button.dataset.alt || "";
      activeButton = button;
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });
  document.addEventListener("site-language-change", () => {
    if (activeButton) image.alt = activeButton.dataset.alt || "";
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
  const navigation = document.querySelector(".dialogue-navigation");
  if (!navigation) return;

  document.addEventListener("keydown", (event) => {
    if (
      event.defaultPrevented || event.repeat || event.isComposing ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
    ) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (
      event.target instanceof Element &&
      (event.target.closest("input, textarea, select, audio, video, [role='slider'], [role='tab']") ||
        event.target.isContentEditable)
    ) return;
    const lightbox = document.querySelector("[data-image-lightbox]");
    if (lightbox && !lightbox.hidden) return;

    const link = navigation.querySelector(
      event.key === "ArrowLeft" ? "[rel='prev']" : "[rel='next']",
    );
    if (!link) return;
    event.preventDefault();
    window.location.assign(link.href);
  });
})();

(() => {
  const triggers = document.querySelectorAll(".audio-trigger");
  const playAllButton = document.querySelector("[data-audio-play-all]");
  const loopSwitch = document.querySelector("[data-audio-loop]");
  const audioToggle = document.querySelector("[data-audio-toggle]");
  const audioPosition = document.querySelector("[data-audio-position]");
  const audioBar = document.querySelector("[data-audio-player-bar]");
  const expandButton = document.querySelector("[data-audio-expand]");
  const collapseButton = document.querySelector("[data-audio-collapse]");
  if (!triggers.length && !playAllButton) return;

  const audio = document.querySelector("[data-audio-player]") || new Audio();
  let activeTrigger = null;
  let queue = [];
  let playAllQueue = [];
  let isPlayingAll = false;
  let currentSegment = "";
  const dialogueSegments = Array.from(
    document.querySelectorAll("[data-dialogue-segment]"),
    (element) => element.dataset.dialogueSegment,
  );
  const dialogueCount = Number(audio.dataset.dialogueCount) || dialogueSegments.length;
  const expandAudioBar = () => {
    if (!audioBar) return;
    audioBar.classList.add("is-expanded");
    audioBar.classList.remove("is-collapsed");
    if (expandButton) expandButton.setAttribute("aria-expanded", "true");
  };
  const collapseAudioBar = () => {
    if (!audioBar) return;
    audioBar.classList.remove("is-expanded");
    audioBar.classList.add("is-collapsed");
    if (expandButton) expandButton.setAttribute("aria-expanded", "false");
  };
  const updateAudioPosition = (item) => {
    if (!audioPosition) return;
    const index = item ? dialogueSegments.indexOf(item.segment_id) : -1;
    audioPosition.textContent = `${index + 1} / ${dialogueCount}`;
  };
  const setTogglePlaying = (playing) => {
    if (!audioToggle) return;
    audioToggle.classList.toggle("is-playing", playing);
    const key = playing ? "audio.pause" : "audio.play";
    audioToggle.setAttribute("data-i18n-aria-label", key);
    audioToggle.setAttribute("aria-label", window.SceneTalkLanguage.translate(key));
  };
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
    if (audioToggle) audioToggle.disabled = false;
    audio.play().catch(() => {
      queue = [];
      playAllQueue = [];
      isPlayingAll = false;
      clearActiveTrigger();
      updateAudioPosition(null);
      setTogglePlaying(false);
    });
  };
  const playQueueItem = (item) => {
    if (!item) return;
    currentSegment = item.segment_id;
    highlightQueueItem(item);
    updateAudioPosition(item);
    playSource(item.url);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      expandAudioBar();
      audio.pause();
      queue = [];
      playAllQueue = [];
      isPlayingAll = false;
      clearActiveTrigger();
      activeTrigger = trigger;
      currentSegment = trigger.dataset.audioSegment || "";
      activeTrigger.classList.add("is-playing");
      updateAudioPosition({ segment_id: trigger.dataset.audioSegment || "" });
      playSource(trigger.dataset.audioSrc || "");
    });
  });

  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      if (!audio.src) return;
      if (audio.paused) {
        audio.play().catch(() => setTogglePlaying(false));
      } else {
        audio.pause();
      }
    });
  }

  if (expandButton) expandButton.addEventListener("click", expandAudioBar);
  if (collapseButton) collapseButton.addEventListener("click", collapseAudioBar);

  if (playAllButton) {
    const manifestElement = document.getElementById("audio-manifest-data");
    const trackSelect = document.querySelector("[data-audio-track-select]");
    const manifest = manifestElement ? JSON.parse(manifestElement.textContent) : null;
    const stopPlayback = () => {
      audio.pause();
      audio.removeAttribute("src");
      queue = [];
      playAllQueue = [];
      isPlayingAll = false;
      clearActiveTrigger();
      if (audioToggle) audioToggle.disabled = true;
      setTogglePlaying(false);
    };
    const syncLanguageTrack = (language, preserveDefault = false) => {
      if (!trackSelect) return;
      const track = manifest?.tracks?.find((item) => item.code.split("-", 1)[0].toLowerCase() === language);
      if (!preserveDefault) {
        let missing = trackSelect.querySelector("option[value='']");
        if (!missing) {
          missing = document.createElement("option");
          missing.value = "";
          missing.setAttribute("data-i18n", "audio.unavailable");
          trackSelect.prepend(missing);
        }
        missing.textContent = window.SceneTalkLanguage.translate("audio.unavailable");
        missing.hidden = Boolean(track);
        trackSelect.value = track?.track_id || "";
      }
      playAllButton.disabled = !trackSelect.value;
    };
    trackSelect?.addEventListener("change", () => {
      stopPlayback();
      currentSegment = "";
      updateAudioPosition(null);
      playAllButton.disabled = !trackSelect.value;
    });
    document.addEventListener("site-language-change", (event) => {
      stopPlayback();
      const language = event.detail.language;
      syncLanguageTrack(language);
      const matching = Array.from(triggers).find((trigger) =>
        trigger.dataset.audioSegment === currentSegment && trigger.dataset.audioLanguage === language,
      );
      if (matching) {
        audio.src = matching.dataset.audioSrc;
        activeTrigger = matching;
        if (audioToggle) audioToggle.disabled = false;
      }
      updateAudioPosition(currentSegment ? { segment_id: currentSegment } : null);
    });
    const initialLanguage = window.SceneTalkLanguage.current();
    syncLanguageTrack(initialLanguage, initialLanguage === "en");
    playAllButton.addEventListener("click", () => {
      expandAudioBar();
      const trackId = trackSelect ? trackSelect.value : manifest?.default_track_id;
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
    updateAudioPosition(null);
  });
  if (!playAllButton) {
    document.addEventListener("site-language-change", () => {
      audio.pause();
      audio.removeAttribute("src");
      clearActiveTrigger();
    });
  }
  audio.addEventListener("play", () => {
    setTogglePlaying(true);
    if (activeTrigger) activeTrigger.classList.add("is-playing");
  });
  audio.addEventListener("pause", () => setTogglePlaying(false));
  audio.addEventListener("error", () => {
    queue = [];
    playAllQueue = [];
    isPlayingAll = false;
    clearActiveTrigger();
    updateAudioPosition(null);
    setTogglePlaying(false);
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

  const setStatus = (key, values = {}) => {
    status.dataset.i18n = key;
    status.dataset.i18nParams = JSON.stringify(values);
    status.textContent = window.SceneTalkLanguage.translate(key, values);
  };
  const showForm = (key, value = "", values = {}) => {
    setStatus(key, values);
    input.value = value;
    form.hidden = false;
    input.focus();
  };

  const openConversation = (number) => {
    if (!/^[1-9]\d*$/.test(number)) {
      showForm("search.invalid", number);
      return;
    }

    const target = sceneRoutes[number];
    if (!target) {
      showForm("search.notFound", number, { number });
      return;
    }

    setStatus("search.opening", { number });
    const url = new URL(target, window.location.href);
    url.searchParams.set("lang", window.SceneTalkLanguage.current());
    window.location.replace(url.href);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    openConversation(input.value.trim());
  });

  if (sceneNumber) {
    openConversation(sceneNumber);
  } else {
    showForm("search.prompt");
  }
})();

(() => {
  const tabs = Array.from(
    document.querySelectorAll("[data-conversation-group-tab]"),
  );
  const groups = Array.from(
    document.querySelectorAll("[data-conversation-group]"),
  );
  if (!tabs.length || !groups.length) return;

  const sortToggle = document.querySelector("[data-conversation-sort]");
  const updateSortToggle = (group) => {
    if (!sortToggle || !group) return;
    const descending = group.dataset.sortOrder === "descending";
    const nextOrder = descending ? "ascending" : "descending";
    sortToggle.dataset.sortOrder = descending ? "descending" : "ascending";
    sortToggle.setAttribute("aria-controls", group.id);
    const key = descending ? "list.sortAscending" : "list.sortDescending";
    sortToggle.setAttribute("data-i18n-aria-label", key);
    sortToggle.setAttribute("data-i18n-title", key);
    sortToggle.setAttribute("aria-label", window.SceneTalkLanguage.translate(key));
    sortToggle.title = window.SceneTalkLanguage.translate(key);
    sortToggle.disabled =
      group.querySelectorAll("[data-conversation-sequence]").length < 2;
  };

  if (sortToggle) {
    sortToggle.hidden = false;
    sortToggle.addEventListener("click", () => {
      const group = groups.find((item) => !item.hidden);
      if (!group) return;
      const list = group.querySelector(".all-dialogues");
      if (!list) return;
      const descending = group.dataset.sortOrder !== "descending";
      const items = Array.from(
        list.querySelectorAll("[data-conversation-sequence]"),
      );
      items.sort((left, right) => {
        const difference =
          Number(left.dataset.conversationSequence) -
          Number(right.dataset.conversationSequence);
        return descending ? -difference : difference;
      });
      items.forEach((item) => list.appendChild(item));
      group.dataset.sortOrder = descending ? "descending" : "ascending";
      updateSortToggle(group);
    });
  }

  const activateTab = (tab, focus = false, updateUrl = true) => {
    const groupId = tab.dataset.conversationGroupTarget;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
      item.tabIndex = active ? 0 : -1;
    });
    groups.forEach((group) => {
      group.hidden = group.id !== groupId;
    });
    updateSortToggle(groups.find((group) => group.id === groupId));
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("group", tab.dataset.conversationGroupKey);
      window.history.replaceState(window.history.state, "", url.href);
    }
    if (focus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });

  const requestedGroup = new URLSearchParams(window.location.search).get("group");
  const requestedTab = tabs.find(
    (tab) => tab.dataset.conversationGroupKey === requestedGroup,
  );
  activateTab(requestedTab || tabs[0], false, false);
})();
