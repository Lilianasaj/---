// Форма добавления бюджета в модальном окне
export default class AddBudgetFormComponent {
  constructor() {
    this._onAdd = null;
    this._selectedCategory = null;

    // Создаем модальное окно
    this._createModal();
  }

  _createModal() {
    // Основное модальное окно
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

    this._modalOverlay.appendChild(this._modalContent);
    document.body.appendChild(this._modalOverlay);

    // Обработчик открытия модального окна категорий
    this._modalContent.querySelector('#budgetCategorySelectBtn').addEventListener('click', () => {
      this._showCategoryModal();
    });

    // Обработчик отправки формы
    this._modalContent.querySelector('.budget-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleFormSubmit();
    });

    // Закрытие модального окна
    this._modalContent.querySelector('.close-modal-btn').addEventListener('click', () => {
      this._hideModal();
    });

    this._modalOverlay.addEventListener('click', (e) => {
      if (e.target === this._modalOverlay) {
        this._hideModal();
      }
    });

    // Создаем модальное окно для категорий
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

    this._categoryModalOverlay.appendChild(this._categoryModalContent);
    document.body.appendChild(this._categoryModalOverlay);

    // Категории с иконками (исключаем категорию "Доход")
    const categories = this._getCategories();
    const categoriesGrid = this._categoryModalContent.querySelector('.categories-grid');
    
    categories.forEach(category => {
      // Пропускаем категорию "Доход" для бюджета
      if (category.name === 'Доход') return;
      
      const categoryElement = document.createElement('div');
      categoryElement.className = 'category-item';
      categoryElement.innerHTML = `
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
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
      
      // Обработчик выбора основной категории
      categoryElement.querySelector('.category-main').addEventListener('click', (e) => {
        if (category.subcategories) {
          const subcategories = categoryElement.querySelector('.subcategories');
          const arrow = categoryElement.querySelector('.expand-arrow');
          subcategories.classList.toggle('hidden');
          arrow.textContent = subcategories.classList.contains('hidden') ? '▶' : '▼';
        } else {
          this._selectCategory(category.name);
        }
      });

      // Обработчик выбора подкатегории
      if (category.subcategories) {
        categoryElement.querySelectorAll('.subcategory-item').forEach(subItem => {
          subItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const subcategoryName = subItem.dataset.category;
            this._selectCategory(subcategoryName);
          });
        });
      }

      categoriesGrid.appendChild(categoryElement);
    });

    // Поиск категорий
    const searchInput = this._categoryModalContent.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const allItems = categoriesGrid.querySelectorAll('.category-item');
      
      allItems.forEach(item => {
        const categoryName = item.querySelector('.category-name').textContent.toLowerCase();
        const subcategories = item.querySelectorAll('.subcategory-name');
        let hasMatch = categoryName.includes(searchTerm);
        
        subcategories.forEach(sub => {
          const subName = sub.textContent.toLowerCase();
          const subItem = sub.closest('.subcategory-item');
          if (subName.includes(searchTerm)) {
            hasMatch = true;
            subItem.style.display = 'flex';
          } else {
            subItem.style.display = 'none';
          }
        });
        
        item.style.display = hasMatch ? 'block' : 'none';
      });
    });

    // Закрытие модального окна категорий
    this._categoryModalContent.querySelector('.close-modal-btn').addEventListener('click', () => {
      this._hideCategoryModal();
    });

    this._categoryModalOverlay.addEventListener('click', (e) => {
      if (e.target === this._categoryModalOverlay) {
        this._hideCategoryModal();
      }
    });
  }

  _getCategories() {
    return [
      { name: 'Все расходы', icon: '📊' },
      { name: 'Продукты питания', icon: '🛒', subcategories: ['Алкоголь', 'Мясо', 'Сладости', 'Ягоды и фрукты'] },
      { name: 'Дом', icon: '🏠', subcategories: ['Арендная плата', 'Бытовая химия', 'Квартплата', 'Коммунальные платежи', 'Мебель', 'Обслуживание жилья', 'Посуда', 'Промтовары', 'Ремонт'] },
      { name: 'Транспорт', icon: '🚗', subcategories: ['Каршеринг', 'Общественный транспорт', 'Такси'] },
      { name: 'Развлечения', icon: '🎭', subcategories: ['Активный отдых', 'Выставки и музеи', 'Игры и программы', 'Кино, театры и концерты', 'Клубы и бары', 'Книги и пресса'] },
      { name: 'Еда вне дома', icon: '🍽️', subcategories: ['Кофейни', 'Рестораны', 'Фастфуд'] },
      { name: 'Одежда и обувь', icon: '👕', subcategories: ['Аксессуары', 'Нижнее бельё', 'Обувь', 'Одежда'] },
      { name: 'Автомобиль', icon: '🚙', subcategories: ['Автоаксессуары', 'Автосервис', 'Автостраховка', 'Автохимия', 'Запчасти', 'Мойка авто', 'Парковка', 'Платные дороги', 'Топливо', 'Штрафы'] },
      { name: 'Дети', icon: '👶', subcategories: ['Детская одежда', 'Детское здоровье', 'Детское питание', 'Игрушки', 'Кружки и занятия', 'Товары для детей'] },
      { name: 'Здоровье', icon: '🏥', subcategories: ['Медикаменты', 'Медицинские услуги', 'Спорт', 'Стоматология', 'Красота и уход', 'Косметика', 'Парикмахерские', 'Салоны красоты'] },
      { name: 'Путешествия', icon: '✈️', subcategories: ['Аренда транспорта', 'Билеты', 'Отель', 'Сувениры', 'Туристические расходы'] },
      { name: 'Техника', icon: '💻', subcategories: ['Бытовая техника', 'Электроника'] },
      { name: 'Услуги связи', icon: '📱', subcategories: ['Интернет', 'Интернет-сервисы', 'Мобильная связь'] },
      { name: 'Домашние животные', icon: '🐕', subcategories: ['Здоровье животных', 'Корм для животных', 'Товары для животных', 'Услуги для животных'] },
      { name: 'Хобби и увлечения', icon: '🎨', subcategories: ['Музыка и видео'] },
      { name: 'Другое', icon: '📦', subcategories: ['Благотворительность', 'Государство', 'Необдуманные траты', 'Подарки', 'Форсмажор'] },
      { name: 'Доход', icon: '💰' },
      { name: 'Без категории', icon: '📄' }
    ];
  }

  _showCategoryModal() {
    this._categoryModalOverlay.classList.remove('hidden');
    this._categoryModalContent.querySelector('.search-input').value = '';
    this._categoryModalContent.querySelectorAll('.category-item').forEach(item => {
      item.style.display = 'block';
      item.querySelectorAll('.subcategory-item').forEach(sub => {
        sub.style.display = 'flex';
      });
    });
  }

  _hideCategoryModal() {
    this._categoryModalOverlay.classList.add('hidden');
  }

  _selectCategory(categoryName) {
    this._selectedCategory = categoryName;
    this._modalContent.querySelector('#budgetSelectedCategoryText').textContent = categoryName;
    this._modalContent.querySelector('#budgetCategoryInput').value = categoryName;
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

    const form = this._modalContent.querySelector('.budget-form');
    const fd = new FormData(form);
    
    const data = {
      name: this._selectedCategory,
      limit: Number(fd.get('limit')),
      spent: 0 // Начинаем с 0 потраченных
    };

    if (this._onAdd) this._onAdd(data);
    this._hideModal();
    this._resetForm();
    this._showSuccessMessage(this._selectedCategory);
  }
  _showSuccessMessage(categoryName) {
    // Можно добавить временное сообщение об успехе
    console.log(`Бюджет для "${categoryName}" обновлен`);
  }

  _resetForm() {
    const form = this._modalContent.querySelector('.budget-form');
    form.reset();
    this._resetCategory();
  }

  show() {
    this._resetForm();
    this._modalOverlay.classList.remove('hidden');
  }

  _hideModal() {
    this._modalOverlay.classList.add('hidden');
  }

  bindAdd(fn) { this._onAdd = fn; }
}