(function initChatUiUtils(global) {
  function escapeHtml(input) {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function isRenderableImageUrl(url) {
    return /^https?:\/\//i.test(url) || /^\/public\//i.test(url);
  }

  function renderMarkdownToHtml(raw) {
    const source = String(raw || "");
    const markedApi = global.marked;
    if (!markedApi || typeof markedApi.parse !== "function") {
      return escapeHtml(source);
    }
    const parsed = markedApi.parse(source, {
      gfm: true,
      breaks: true,
      mangle: false,
      headerIds: false,
    });
    const purifier = global.DOMPurify;
    if (purifier && typeof purifier.sanitize === "function") {
      return purifier.sanitize(parsed);
    }
    return parsed;
  }

  function renderMessageHtml(text) {
    const html = renderMarkdownToHtml(text);
    const tpl = document.createElement("template");
    tpl.innerHTML = html;

    const images = tpl.content.querySelectorAll("img");
    for (const img of images) {
      const src = String(img.getAttribute("src") || "");
      if (!isRenderableImageUrl(src)) {
        const fallback = document.createTextNode(img.getAttribute("alt") || src);
        img.replaceWith(fallback);
        continue;
      }
      img.classList.add("inline-image");
      img.setAttribute("loading", "lazy");
      const wrap = document.createElement("div");
      wrap.className = "inline-image-wrap";
      img.replaceWith(wrap);
      wrap.appendChild(img);
    }

    const links = tpl.content.querySelectorAll("a[href]");
    for (const link of links) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }

    const hljsApi = global.hljs;
    if (hljsApi && typeof hljsApi.highlightElement === "function") {
      const codeBlocks = tpl.content.querySelectorAll("pre code");
      for (const block of codeBlocks) {
        try {
          hljsApi.highlightElement(block);
        } catch {
          // ignore highlight failures for unknown languages
        }
      }
    }

    return tpl.innerHTML;
  }

  function extractMarkdownImages(text) {
    const source = String(text || "");
    const images = [];
    const cleaned = source.replace(
      /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (_, altRaw, urlRaw) => {
        const src = String(urlRaw || "").trim().replace(/^<|>$/g, "");
        if (!src) return "";
        if (!/^(https?:\/\/|data:image\/|\/public\/uploads\/)/i.test(src)) {
          return "";
        }
        const fileName = String(altRaw || "").trim() || "assistant-image";
        images.push({ url: src, fileName });
        return "";
      }
    );
    return {
      text: cleaned.replace(/\n{3,}/g, "\n\n").trim(),
      images,
    };
  }

  function setSummaryButtonText(summaryBtn, text) {
    if (!(summaryBtn instanceof HTMLElement)) return;
    summaryBtn.textContent = "";
    const label = document.createElement("span");
    label.className = "stream-bubble-summary-label";
    label.textContent = String(text || "");
    summaryBtn.appendChild(label);
  }

  global.ChatUiUtils = Object.freeze({
    escapeHtml,
    renderMessageHtml,
    extractMarkdownImages,
    setSummaryButtonText,
  });
})(window);
