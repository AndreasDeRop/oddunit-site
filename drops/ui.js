export function updateDropIndicator(activeIdx) {
  const dots = Array.from(document.querySelectorAll(".dot"));
  dots.forEach((d, i) => d.classList.toggle("active", i === activeIdx));
}