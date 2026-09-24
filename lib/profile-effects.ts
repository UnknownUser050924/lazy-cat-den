const EFFECTS: Record<string, { label: string; count: number }> = {
  none: { label: "关闭", count: 0 },
  fireflies: { label: "萤火晚灯", count: 22 },
  petals: { label: "花信缓落", count: 18 },
  comets: { label: "流星来信", count: 16 },
  aurora: { label: "极光轻纱", count: 12 },
  embers: { label: "壁炉余温", count: 22 },
  moonorbit: { label: "月亮轨道", count: 16 },
};

export const PROFILE_EFFECTS = EFFECTS;

export function applyProfileEffect(container: HTMLElement | null, requested: string) {
  if (!container) return;
  const name = Object.hasOwn(EFFECTS, requested) ? requested : "none";
  container.replaceChildren();
  container.className = `lcd-effect lcd-effect--${name}`;
  container.setAttribute("aria-hidden", "true");
  if (name === "none") return;
  const count = EFFECTS[name].count;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const node = document.createElement("i");
    node.className = "lcd-effect__particle";
    node.style.setProperty("--x", `${((i * 57.3 + 13) % 100).toFixed(1)}%`);
    node.style.setProperty("--y", `${((i * 37.9 + 9) % 95).toFixed(1)}%`);
    node.style.setProperty("--d", `${(-i * 0.87).toFixed(2)}s`);
    node.style.setProperty("--dur", `${(5.2 + (i % 5) * 1.05).toFixed(1)}s`);
    node.style.setProperty("--sz", `${7 + (i % 5) * 2.4}px`);
    node.style.setProperty("--rot", `${(i * 43) % 360}deg`);
    fragment.append(node);
  }
  container.append(fragment);
}
