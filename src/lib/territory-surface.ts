import { dark, light } from "../styles/theme.css";
import { territorySurface } from "../styles/home.css";
import type { Theme } from "../atoms/theme";

/** A visual-only live mirror. The real page continues to own every interaction. */
export function createTerritorySurface(source: HTMLElement, theme: Theme) {
  const copies = new WeakMap<Node, Node>();
  const canvases = new Map<HTMLCanvasElement, HTMLCanvasElement>();
  function copy(node: Node): Node {
    if (
      node instanceof HTMLStyleElement ||
      node instanceof HTMLScriptElement ||
      (node instanceof HTMLCanvasElement && node.hasAttribute("data-battle"))
    )
      return document.createComment("visual-only");
    const clone = node.cloneNode(false);
    copies.set(node, clone);
    if (clone instanceof Element) clone.removeAttribute("id");
    if (node instanceof HTMLCanvasElement && clone instanceof HTMLCanvasElement)
      canvases.set(node, clone);
    for (const child of node.childNodes) clone.appendChild(copy(child));
    return clone;
  }
  const page = copy(source);
  if (!(page instanceof HTMLElement))
    throw new Error("Theme surface unavailable");
  const overlay = document.createElement("div");
  overlay.className = territorySurface;
  overlay.dataset["territoryCopy"] = "";
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  overlay.appendChild(page);
  const palette = (): void => {
    page.classList.remove(light, dark);
    page.classList.add(theme === "dark" ? dark : light);
    page.dataset["theme"] = theme;
  };
  function syncSize(): void {
    const bounds = source.getBoundingClientRect();
    overlay.style.left = `${bounds.left}px`;
    overlay.style.top = `${bounds.top}px`;
    overlay.style.width = `${bounds.width}px`;
    overlay.style.height = `${bounds.height}px`;
  }
  palette();
  syncSize();
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = copies.get(record.target);
      if (!target) continue;
      if (record.type === "characterData")
        target.nodeValue = record.target.nodeValue;
      else if (
        record.type === "attributes" &&
        record.target instanceof Element &&
        target instanceof Element &&
        record.attributeName &&
        record.attributeName !== "id"
      ) {
        const value = record.target.getAttribute(record.attributeName);
        if (value === null) target.removeAttribute(record.attributeName);
        else target.setAttribute(record.attributeName, value);
      } else if (record.type === "childList") {
        for (const removed of record.removedNodes) {
          const old = copies.get(removed);
          if (old?.parentNode === target) target.removeChild(old);
        }
        for (const added of record.addedNodes) {
          const next = record.nextSibling
            ? copies.get(record.nextSibling)
            : null;
          target.insertBefore(
            copy(added),
            next?.parentNode === target ? next : null,
          );
        }
      }
    }
    palette();
  });
  observer.observe(source, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  const scroll = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const clone = copies.get(event.target);
    if (clone instanceof HTMLElement) {
      clone.scrollTop = event.target.scrollTop;
      clone.scrollLeft = event.target.scrollLeft;
    }
  };
  source.addEventListener("scroll", scroll, true);
  window.addEventListener("resize", syncSize);
  document.body.appendChild(overlay);
  for (const original of [source, ...source.querySelectorAll("*")]) {
    const clone = copies.get(original);
    if (clone instanceof Element) {
      clone.scrollTop = original.scrollTop;
      clone.scrollLeft = original.scrollLeft;
    }
  }
  function syncInteraction(): void {
    for (const clone of overlay.querySelectorAll(
      "[data-territory-hover], [data-territory-focus]",
    )) {
      clone.removeAttribute("data-territory-hover");
      clone.removeAttribute("data-territory-focus");
    }
    for (const original of source.querySelectorAll(":hover, :focus-visible")) {
      const clone = copies.get(original);
      if (!(clone instanceof Element)) continue;
      if (original.matches(":hover"))
        clone.setAttribute("data-territory-hover", "");
      if (original.matches(":focus-visible"))
        clone.setAttribute("data-territory-focus", "");
    }
  }
  syncInteraction();
  return {
    draw(mask: string): void {
      overlay.style.maskImage = mask;
      syncInteraction();
      for (const [original, clone] of canvases) {
        if (!source.contains(original)) {
          canvases.delete(original);
          continue;
        }
        if (clone.width !== original.width) clone.width = original.width;
        if (clone.height !== original.height) clone.height = original.height;
        clone.getContext("2d")?.drawImage(original, 0, 0);
      }
    },
    dispose(): void {
      observer.disconnect();
      source.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", syncSize);
      canvases.clear();
      overlay.remove();
    },
  };
}
