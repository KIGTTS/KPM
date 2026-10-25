export function catalogMotion(grid) {
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
      const card = entry.target;
      card.style.setProperty('--reveal-delay', `${Math.min(index * 30, 120)}ms`);
      card.classList.remove('catalog-pending'); card.classList.add('catalog-revealed');
      observer.unobserve(card);
    });
  });
  const observe = cards => cards.forEach(card => {
    card.classList.add('catalog-pending'); observer.observe(card);
  });
  return {
    replace(cards) { observer.disconnect(); grid.replaceChildren(...cards); observe(cards); },
    append(cards) { grid.append(...cards); observe(cards); },
    clear() { observer.disconnect(); },
  };
}
