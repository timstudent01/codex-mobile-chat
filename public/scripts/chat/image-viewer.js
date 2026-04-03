(function initChatImageViewerUtils(global) {
  function createImageViewerController(params) {
    const viewer = params?.viewer;
    const imageEl = params?.imageEl;
    const prevBtn = params?.prevBtn;
    const nextBtn = params?.nextBtn;
    const counterEl = params?.counterEl;

    let gallery = [];
    let index = 0;

    function renderState() {
      if (!(imageEl instanceof HTMLImageElement)) return;
      const item = gallery[index];
      if (!item) return;
      imageEl.src = String(item.src || "");
      imageEl.alt = String(item.alt || "preview");

      const hasMultiple = gallery.length > 1;
      if (prevBtn instanceof HTMLElement) prevBtn.classList.toggle("show", hasMultiple);
      if (nextBtn instanceof HTMLElement) nextBtn.classList.toggle("show", hasMultiple);
      if (counterEl instanceof HTMLElement) {
        if (hasMultiple) {
          counterEl.textContent = `${index + 1} / ${gallery.length}`;
          counterEl.classList.add("show");
        } else {
          counterEl.textContent = "";
          counterEl.classList.remove("show");
        }
      }
    }

    function open(src, alt, nextGallery, nextIndex) {
      const fallback = [{ src, alt }];
      gallery = Array.isArray(nextGallery) && nextGallery.length > 0 ? nextGallery : fallback;
      const safeIndex = Number(nextIndex);
      index = Number.isFinite(safeIndex)
        ? Math.max(0, Math.min(safeIndex, gallery.length - 1))
        : 0;
      renderState();
      if (viewer instanceof HTMLElement) {
        viewer.classList.add("open");
        viewer.setAttribute("aria-hidden", "false");
      }
    }

    function close() {
      if (viewer instanceof HTMLElement) {
        viewer.classList.remove("open");
        viewer.setAttribute("aria-hidden", "true");
      }
      if (imageEl instanceof HTMLImageElement) {
        imageEl.removeAttribute("src");
      }
      gallery = [];
      index = 0;
      if (counterEl instanceof HTMLElement) {
        counterEl.textContent = "";
        counterEl.classList.remove("show");
      }
    }

    function navigate(step) {
      if (!(viewer instanceof HTMLElement) || !viewer.classList.contains("open")) return;
      if (!Array.isArray(gallery) || gallery.length <= 1) return;
      const total = gallery.length;
      index = (index + step + total) % total;
      renderState();
    }

    return Object.freeze({
      open,
      close,
      navigate,
      renderState,
    });
  }

  global.ChatImageViewerUtils = Object.freeze({
    createImageViewerController,
  });
})(window);
