// Утилиты для рендера компонентов
export const render = (container, element, position = 'beforeend') => {
  const parent = (typeof container === 'string') ? document.querySelector(container) : container;
  parent.insertAdjacentElement(position, element);
};

export const replace = (newChild, oldChild) => {
  const parent = oldChild.parentElement;
  if (!parent || !newChild) return;
  parent.replaceChild(newChild, oldChild);
};

export const remove = (element) => {
  if (element && element.parentElement) {
    element.parentElement.removeChild(element);
  }
};
