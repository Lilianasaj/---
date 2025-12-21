export default class AddTransactionFormComponent {
  constructor() {
    this._onAdd = null;
    this._selectedCategory = null;
    this._isIncome = false;

    this._createModal();
  }

  /* =========================
     УТИЛИТА: удаление text-нод
     ========================= */
  _cleanTextNodes(root) {
    root.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
        node.remove();
      }
    });
  }

  _createModal() {
    this._modalOverlay = document.createElement('div');
    this._modalOverlay.className = 'transaction-modal-overlay hidden';

    this._modalContent = document.createElement('div');
    this._modalContent.className = 'transaction-modal-content';
    this._modalContent.innerHTML = `
<div class="transaction-modal-header">
  <h2>Добавить запись</h2>
  <button class="close-modal-btn">&times;</button>
</div>

<div class="transaction-type-switch">
  <button type="button" class="type-btn income-btn active">Доход</button>
  <button type="button" class="type-btn expense-btn">Расход</button>
</div>

<form class="transaction-form">
  <div class="form-section">
    <h3>Категория</h3>
    <button type="button" class="category-select-btn" id="categorySelectBtn">
      <span id="selectedCategoryText">Выберите категорию</span>
      <span class="dropdown-arrow">▼</span>
    </button>
    <input type="hidden" name="category" id="categoryInput" required />
  </div>

  <div class="form-section">
    <h3>Дата</h3>
    <input name="date" type="date" required class="form-input date-input" />
  </div>

  <div class="form-section">
    <h3>Описание <span class="optional">(необязательно)</span></h3>
    <input name="desc" placeholder="Введите описание" class="form-input" />
  </div>

  <div class="form-section">
    <h3>Сумма</h3>
    <input name="amount" type="number" required placeholder="0" class="form-input amount-input" />
  </div>

  <button type="submit" class="submit-btn">Добавить запись</button>
</form>
`;

    this._cleanTextNodes(this._modalContent);

    this._modalOverlay.appendChild(this._modalContent);
    document.body.appendChild(this._modalOverlay);

    const today = new Date().toISOString().split('T')[0];
    this._modalContent.querySelector('.date-input').value = today;

    const incomeBtn = this._modalContent.querySelector('.income-btn');
    const expenseBtn = this._modalContent.querySelector('.expense-btn');

    incomeBtn.addEventListener('click', () => this._setTransactionType('income'));
    expenseBtn.addEventListener('click', () => this._setTransactionType('expense'));

    this._modalContent
      .querySelector('#categorySelectBtn')
      .addEventListener('click', () => this._showCategoryModal());

    this._modalContent
      .querySelector('.transaction-form')
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
      { name: 'Продукты питания', icon: '🛒', subcategories: ['Алкоголь', 'Мясо', 'Сладости', 'Ягоды и фрукты'] },
      { name: 'Дом', icon: '🏠', subcategories: ['Арендная плата', 'Коммунальные платежи', 'Ремонт'] },
      { name: 'Транспорт', icon: '🚗', subcategories: ['Такси', 'Общественный транспорт'] },
      { name: 'Развлечения', icon: '🎭', subcategories: ['Кино', 'Игры'] },
      { name: 'Доход', icon: '💰', subcategories: ['Зарплата', 'Подработка', 'Другое'] },
      { name: 'Без категории', icon: '📄' }
    ];
  }

  _setTransactionType(type) {
    this._isIncome = type === 'income';

    const incomeBtn = this._modalContent.querySelector('.income-btn');
    const expenseBtn = this._modalContent.querySelector('.expense-btn');

    incomeBtn.classList.toggle('active', this._isIncome);
    expenseBtn.classList.toggle('active', !this._isIncome);

    this._resetCategory();
  }

  _showCategoryModal() {
    this._categoryModalOverlay.classList.remove('hidden');
  }

  _hideCategoryModal() {
    this._categoryModalOverlay.classList.add('hidden');
  }

  _selectCategory(name) {
    this._selectedCategory = name;
    this._modalContent.querySelector('#selectedCategoryText').textContent = name;
    this._modalContent.querySelector('#categoryInput').value = name;
    this._hideCategoryModal();
  }

  _resetCategory() {
    this._selectedCategory = null;
    this._modalContent.querySelector('#selectedCategoryText').textContent = 'Выберите категорию';
    this._modalContent.querySelector('#categoryInput').value = '';
  }

  _handleFormSubmit() {
    if (!this._selectedCategory) {
      alert('Пожалуйста, выберите категорию');
      return;
    }

    const fd = new FormData(this._modalContent.querySelector('.transaction-form'));
    let amount = Number(fd.get('amount'));

    if (!this._isIncome && amount > 0) amount = -amount;

    this._onAdd?.({
      date: fd.get('date'),
      desc: fd.get('desc') || '',
      category: this._selectedCategory,
      amount
    });

    this._hideModal();
    this._resetForm();
  }

  _resetForm() {
    this._modalContent.querySelector('.transaction-form').reset();
    this._modalContent.querySelector('.date-input').value =
      new Date().toISOString().split('T')[0];

    this._resetCategory();
    this._setTransactionType('expense');
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
