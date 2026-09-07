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
  if (!triggers.length) return;

  const audio = new Audio();
  let activeTrigger = null;
  const clearActiveTrigger = () => {
    if (activeTrigger) activeTrigger.classList.remove("is-playing");
    activeTrigger = null;
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      audio.pause();
      clearActiveTrigger();
      activeTrigger = trigger;
      activeTrigger.classList.add("is-playing");
      audio.src = trigger.dataset.audioSrc || "";
      audio.play().catch(clearActiveTrigger);
    });
  });

  audio.addEventListener("ended", clearActiveTrigger);
  audio.addEventListener("error", clearActiveTrigger);
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
