// src/view/filter-component.js
export default class FilterComponent {
  constructor(container) {
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    // Создаем структуру фильтра
    this._root = document.createElement('div');
    this._root.className = 'filter';
    
    // Получаем текущую дату для предустановки значений
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    
    this._root.innerHTML = `
      <h2>Фильтр по дате</h2>
      <div class="filter-selects">
        <select name="month" id="filter-month">
          <option value="">Все месяцы</option>
          <option value="1">Январь</option>
          <option value="2">Февраль</option>
          <option value="3">Март</option>
          <option value="4">Апрель</option>
          <option value="5">Май</option>
          <option value="6">Июнь</option>
          <option value="7">Июль</option>
          <option value="8">Август</option>
          <option value="9">Сентябрь</option>
          <option value="10">Октябрь</option>
          <option value="11">Ноябрь</option>
          <option value="12">Декабрь</option>
        </select>
        
        <select name="day" id="filter-day">
          <option value="">Все дни</option>
          ${Array.from({length: 31}, (_, i) => 
            `<option value="${i + 1}">${i + 1}</option>`
          ).join('')}
        </select>
        
        <button class="reset-filter-btn" id="reset-filter">Сбросить фильтр</button>
      </div>
    `;
    
    // Добавляем в контейнер
    if (this.container) {
      this.container.appendChild(this._root);
    }
    
    this._onChange = null;
    
    // Назначаем обработчики
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Обработчики для селектов
    const monthSelect = this._root.querySelector('#filter-month');
    const daySelect = this._root.querySelector('#filter-day');
    const resetBtn = this._root.querySelector('#reset-filter');
    
    const triggerChange = () => {
      const month = monthSelect.value || null;
      const day = daySelect.value || null;
      
      console.log('Filter: Изменение фильтра:', { month, day });
      
      if (this._onChange) {
        this._onChange({ month, day });
      }
    };
    
    monthSelect.addEventListener('change', triggerChange);
    daySelect.addEventListener('change', triggerChange);
    
    // Обработчик кнопки сброса
    resetBtn.addEventListener('click', () => {
      monthSelect.value = '';
      daySelect.value = '';
      triggerChange();
    });
  }

  bindChange(fn) { 
    this._onChange = fn; 
    console.log('Filter: обработчик изменений установлен');
  }

  // Метод для получения текущих значений фильтра
  getCurrentFilter() {
    const monthSelect = this._root.querySelector('#filter-month');
    const daySelect = this._root.querySelector('#filter-day');
    
    return {
      month: monthSelect.value || null,
      day: daySelect.value || null
    };
  }
}