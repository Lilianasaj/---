export default class FilterComponent {
  constructor(container) {
    // Если container - строка, ищем элемент, иначе используем как есть
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    this._root = document.createElement('div');
    this._root.className = 'filter';
    this._root.innerHTML = `
      <h2>Фильтр</h2>
      <div class="filter-selects">
        <select name="month">
          <option value="">Месяц</option>
          ${[...Array(12)].map((_,i)=>`<option value="${i+1}">${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][i]}</option>`).join('')}
        </select>
        <select name="day">
          <option value="">День</option>
          ${[...Array(31)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
        </select>
      </div>
    `;
    
    // Проверяем, что container существует перед добавлением
    if (this.container) {
      this.container.appendChild(this._root);
    }
    
    this._onChange = null;

    this._root.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', () => {
        const month = this._root.querySelector('select[name="month"]').value || null;
        const day = this._root.querySelector('select[name="day"]').value || null;
        if (this._onChange) this._onChange({month, day});
      });
    });
  }

  bindChange(fn) { this._onChange = fn; }
}