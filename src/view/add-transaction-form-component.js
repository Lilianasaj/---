// Форма добавления операции в модальном окне
export default class AddTransactionFormComponent {
  constructor() {
    this._onAdd = null;
    this._selectedCategory = null;
    this._isIncome = false; // false = расход, true = доход

    // Создаем модальное окно
    this._createModal();
  }

  _createModal() {
    // Основное модальное окно
    this._modalOverlay = document.createElement('div');
    this._modalOverlay.className = 'transaction-modal-overlay hidden';
    
    this._modalContent = document.createElement('div');
    this._modalContent.className = 'transaction-modal-content';
    // В методе _createModal() измените поле описания:
    this._modalContent.innerHTML = `
      <div class="transaction-modal-header">
        <h2>Добавить запись</h2>
        <button class="close-modal-btn">&times;</button>
      </div>
      <div class="transaction-type-switch">
        <button type="button" class="type-btn income-btn active" data-type="income">Доход</button>
        <button type="button" class="type-btn expense-btn" data-type="expense">Расход</button>
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
          <input name="amount" placeholder="0" type="number" required class="form-input amount-input" />
        </div>
        
        <button type="submit" class="submit-btn">Добавить запись</button>
      </form>
    `;

    this._modalOverlay.appendChild(this._modalContent);
    document.body.appendChild(this._modalOverlay);

    // Устанавливаем сегодняшнюю дату по умолчанию
    const today = new Date().toISOString().split('T')[0];
    this._modalContent.querySelector('.date-input').value = today;

    // Обработчики переключателя Доход/Расход
    const incomeBtn = this._modalContent.querySelector('.income-btn');
    const expenseBtn = this._modalContent.querySelector('.expense-btn');
    
    incomeBtn.addEventListener('click', () => this._setTransactionType('income'));
    expenseBtn.addEventListener('click', () => this._setTransactionType('expense'));

    // Обработчик открытия модального окна категорий
    this._modalContent.querySelector('#categorySelectBtn').addEventListener('click', () => {
      this._showCategoryModal();
    });

    // Обработчик отправки формы
    this._modalContent.querySelector('.transaction-form').addEventListener('submit', (e) => {
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

    // Категории с иконками
    const categories = this._getCategories();
    const categoriesGrid = this._categoryModalContent.querySelector('.categories-grid');
    
    categories.forEach(category => {
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

  // В методе _getCategories() добавьте подкатегории для Доходов:
  _getCategories() {
    return [
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
      { 
        name: 'Доход', 
        icon: '💰', 
        subcategories: [
          'Зарплата', 
          'Подработка', 
          'Проценты по счетам', 
          'Возврат долга', 
          'Возврат средств',
          'Приятные находки',
          'Другое'
        ] 
      },
      { name: 'Без категории', icon: '📄' }
    ];
  }

  _setTransactionType(type) {
    this._isIncome = type === 'income';
    
    const incomeBtn = this._modalContent.querySelector('.income-btn');
    const expenseBtn = this._modalContent.querySelector('.expense-btn');
    
    if (this._isIncome) {
      incomeBtn.classList.add('active');
      expenseBtn.classList.remove('active');
    } else {
      expenseBtn.classList.add('active');
      incomeBtn.classList.remove('active');
    }
    
    // Сбрасываем выбранную категорию при смене типа
    this._resetCategory();
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
    this._modalContent.querySelector('#selectedCategoryText').textContent = categoryName;
    this._modalContent.querySelector('#categoryInput').value = categoryName;
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

    const form = this._modalContent.querySelector('.transaction-form');
    const fd = new FormData(form);
    const today = new Date().toISOString().split('T')[0];
    
    let amount = Number(fd.get('amount'));
    if (!this._isIncome && amount > 0) {
      amount = -amount; // Для расходов делаем отрицательное число
    }

    const data = {
      date: fd.get('date') || today,
      desc: fd.get('desc'),
      category: this._selectedCategory,
      amount: amount
    };

    if (this._onAdd) this._onAdd(data);
    this._hideModal();
    this._resetForm();
  }

  _resetForm() {
    const form = this._modalContent.querySelector('.transaction-form');
    form.reset();
    
    const today = new Date().toISOString().split('T')[0];
    this._modalContent.querySelector('.date-input').value = today;
    
    this._resetCategory();
    this._setTransactionType('expense'); // По умолчанию расход
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