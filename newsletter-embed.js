(() => {
  const FORM_SRC = "https://eomail5.com/form/";
  const wrappers = Array.from(document.querySelectorAll("[data-eo-form]"));
  if (!wrappers.length) return;

  function injectStyles() {
    if (document.getElementById("oddunit-eo-style")) return;
    const style = document.createElement("style");
    style.id = "oddunit-eo-style";
    style.textContent = `
      .eo-consent-card {
        min-height: 128px;
        display: grid;
        align-content: center;
        gap: 12px;
        padding: 18px;
        border: 2px solid var(--orange, #ff6b00);
        background: var(--bg, #070707);
        color: var(--text-main, #f2f2f2);
        font-family: var(--font-jet, ui-monospace, SFMono-Regular, Menlo, monospace);
      }
      .eo-consent-card p {
        margin: 0;
        font-size: 11px;
        line-height: 1.45;
        letter-spacing: 0.04em;
        text-transform: none;
      }
      .eo-consent-button {
        justify-self: start;
        min-height: 42px;
        padding: 0 18px;
        border: 2px solid var(--orange, #ff6b00);
        border-radius: 999px;
        background: transparent;
        color: var(--orange, #ff6b00);
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .eo-consent-button:focus-visible {
        outline: 2px solid var(--purple, #8a2be2);
        outline-offset: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  function loadForm(wrapper) {
    if (wrapper.dataset.eoLoaded === "true") return;
    const id = wrapper.dataset.eoForm;
    if (!id) return;

    wrapper.dataset.eoLoaded = "true";
    wrapper.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = `${FORM_SRC}${id}.js`;
    script.dataset.form = id;
    wrapper.appendChild(script);
  }

  function mountPlaceholder(wrapper) {
    if (wrapper.dataset.eoMounted === "true") return;
    wrapper.dataset.eoMounted = "true";

    const card = document.createElement("div");
    card.className = "eo-consent-card";
    card.innerHTML = `
      <p>
        Het nieuwsbrief formulier wordt geladen via EmailOctopus en kan Google reCAPTCHA gebruiken.
      </p>
      <button class="eo-consent-button" type="button">
        Laad formulier
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => loadForm(wrapper));
    wrapper.replaceChildren(card);
  }

  injectStyles();
  wrappers.forEach(mountPlaceholder);
})();
