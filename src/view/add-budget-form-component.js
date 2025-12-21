export default class AddBudgetFormComponent {
  constructor() {
    this._onAdd = null;
    this._selectedCategory = null;

    this._createModal();
  }

  _cleanTextNodes(root) {
    root.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
        node.remove();
      }
    });
  }

  _createModal() {
    this._modalOverlay = document.createElement('div');
    this._modalOverlay.className = 'budget-modal-overlay hidden';

    this._modalContent = document.createElement('div');
    this._modalContent.className = 'budget-modal-content';
    this._modalContent.innerHTML = `
<div class="budget-modal-header">
  <h2>Установите бюджет</h2>
  <button class="close-modal-btn">&times;</button>
</div>

<form class="budget-form">
  <div class="form-section">
    <h3>Категория</h3>
    <button type="button" class="category-select-btn" id="budgetCategorySelectBtn">
      <span id="budgetSelectedCategoryText">Выберите категорию</span>
      <span class="dropdown-arrow">▼</span>
    </button>
    <input type="hidden" name="category" id="budgetCategoryInput" required />
  </div>

  <div class="form-section">
    <h3>Лимит бюджета</h3>
    <input name="limit" placeholder="0" type="number" required class="form-input" />
  </div>

  <button type="submit" class="submit-btn">Установить бюджет</button>
</form>
`;

    this._cleanTextNodes(this._modalContent);

    this._modalOverlay.appendChild(this._modalContent);
    document.body.appendChild(this._modalOverlay);

    this._modalContent
      .querySelector('#budgetCategorySelectBtn')
      .addEventListener('click', () => this._showCategoryModal());

    this._modalContent
      .querySelector('.budget-form')
      .addEventListener('submit', e => {
        e.preventDefault();
        this._handleFormSubmit();
      });

    this._modalContent
      .querySelector('.close-modal-btn')
      .addEventListener('click', () => this._hideModal());

    this._modalOverlay.addEventListener('click', e => {
      if (e.target === this._modalOverlay) this._hideModal();
    });

    this._createCategoryModal();
  }

  _createCategoryModal() {
    this._categoryModalOverlay = document.createElement('div');
    this._categoryModalOverlay.className = 'category-modal-overlay hidden';

    this._categoryModalContent = document.createElement('div');
    this._categoryModalContent.className = 'category-modal-content';
    this._categoryModalContent.innerHTML = `
<div class="category-modal-header">
  <h3>Выберите категорию</h3>
  <button class="close-modal-btn">&times;</button>
</div>

<div class="category-search">
  <input type="text" placeholder="Поиск категорий..." class="search-input">
</div>

<div class="categories-grid"></div>
`;

    this._cleanTextNodes(this._categoryModalContent);

    this._categoryModalOverlay.appendChild(this._categoryModalContent);
    document.body.appendChild(this._categoryModalOverlay);

    const categories = this._getCategories();
    const grid = this._categoryModalContent.querySelector('.categories-grid');

    categories.forEach(category => {
      if (category.name === 'Доход') return;

      const el = document.createElement('div');
      el.className = 'category-item';
      el.innerHTML = `
<div class="category-main">
  <span class="category-icon">${category.icon}</span>
  <span class="category-name">${category.name}</span>
  ${category.subcategories ? '<span class="expand-arrow">▶</span>' : ''}
</div>
${category.subcategories ? `
<div class="subcategories hidden">
  ${category.subcategories.map(sub => `
  <div class="subcategory-item" data-category="${sub}">
    <span class="subcategory-icon">${category.icon}</span>
    <span class="subcategory-name">${sub}</span>
  </div>`).join('')}
</div>` : ''}
`;

      el.querySelector('.category-main').addEventListener('click', () => {
        if (!category.subcategories) {
          this._selectCategory(category.name);
          return;
        }
        const subs = el.querySelector('.subcategories');
        const arrow = el.querySelector('.expand-arrow');
        subs.classList.toggle('hidden');
        arrow.textContent = subs.classList.contains('hidden') ? '▶' : '▼';
      });

      el.querySelectorAll('.subcategory-item').forEach(sub => {
        sub.addEventListener('click', e => {
          e.stopPropagation();
          this._selectCategory(sub.dataset.category);
        });
      });

      grid.appendChild(el);
    });

    this._categoryModalContent
      .querySelector('.close-modal-btn')
      .addEventListener('click', () => this._hideCategoryModal());

    this._categoryModalOverlay.addEventListener('click', e => {
      if (e.target === this._categoryModalOverlay) this._hideCategoryModal();
    });
  }

  _getCategories() {
    return [
      { name: 'Все расходы', icon: '📊' },
      { name: 'Продукты питания', icon: '🛒', subcategories: ['Алкоголь', 'Мясо', 'Сладости', 'Ягоды и фрукты'] },
      { name: 'Дом', icon: '🏠', subcategories: ['Арендная плата', 'Бытовая химия', 'Квартплата', 'Коммунальные платежи', 'Мебель', 'Обслуживание жилья', 'Посуда', 'Промтовары', 'Ремонт'] },
      { name: 'Транспорт', icon: '🚗', subcategories: ['Каршеринг', 'Общественный транспорт', 'Такси'] },
      { name: 'Развлечения', icon: '🎭', subcategories: ['Активный отдых', 'Выставки и музеи', 'Игры и программы', 'Кино, театры и концерты', 'Клубы и бары', 'Книги и пресса'] },
      { name: 'Другое', icon: '📦' },
      { name: 'Доход', icon: '💰' },
      { name: 'Без категории', icon: '📄' }
    ];
  }

  _showCategoryModal() {
    this._categoryModalOverlay.classList.remove('hidden');
  }

  _hideCategoryModal() {
    this._categoryModalOverlay.classList.add('hidden');
  }

  _selectCategory(name) {
    this._selectedCategory = name;
    this._modalContent.querySelector('#budgetSelectedCategoryText').textContent = name;
    this._modalContent.querySelector('#budgetCategoryInput').value = name;
    this._hideCategoryModal();
  }

  _resetCategory() {
    this._selectedCategory = null;
    this._modalContent.querySelector('#budgetSelectedCategoryText').textContent = 'Выберите категорию';
    this._modalContent.querySelector('#budgetCategoryInput').value = '';
  }

  _handleFormSubmit() {
    if (!this._selectedCategory) {
      alert('Пожалуйста, выберите категорию');
      return;
    }

    const fd = new FormData(this._modalContent.querySelector('.budget-form'));

    this._onAdd?.({
      name: this._selectedCategory,
      limit: Number(fd.get('limit')),
      spent: 0
    });

    this._hideModal();
    this._resetForm();
  }

  _resetForm() {
    this._modalContent.querySelector('.budget-form').reset();
    this._resetCategory();
  }

  show() {
    this._resetForm();
    this._modalOverlay.classList.remove('hidden');
  }

  _hideModal() {
    this._modalOverlay.classList.add('hidden');
  }

  bindAdd(fn) {
    this._onAdd = fn;
  }
}
