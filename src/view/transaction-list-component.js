// Рендерит таблицу операций. Подключает обработчики удаления.
export default class TransactionListComponent {
  constructor(container) {
    // Если container - строка, ищем элемент, иначе используем как есть
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    this._onAdd = null;
    this._onDelete = null;
    
    // создаём базовую структуру
    this._root = document.createElement('div');
    this._root.className = 'card';
    const h = document.createElement('h3');
    h.textContent = 'Операции';
    this._root.appendChild(h);
    
    // create table
    this._table = document.createElement('table');
    this._table.innerHTML = `
      <thead>
        <tr><th>Дата</th><th>Описание</th><th>Категория</th><th>Сумма</th><th></th></tr>
      </thead>
      <tbody></tbody>
    `;
    this._root.appendChild(this._table);
    
    // container может быть колонкой
    if (this.container) {
      this.container.appendChild(this._root);
    }
  }

  bindAdd(fn) { this._onAdd = fn; }
  bindDelete(fn) { this._onDelete = fn; }

  renderList(transactions) {
    const tbody = this._table.querySelector('tbody');
    tbody.innerHTML = '';
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.desc}</td>
        <td>${t.category}</td>
        <td>${t.amount > 0 ? '+'+t.amount+'₽' : t.amount+'₽'}</td>
        <td><button class="delete-btn" data-id="${t.id}">Удалить</button></td>
      `;
      tbody.appendChild(tr);
      
    });

    // делегирование клика по кнопкам delete
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this._onDelete) this._onDelete(id);
      });
    });
  }
}