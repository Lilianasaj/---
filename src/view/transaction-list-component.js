// src/view/transaction-list-component.js
export default class TransactionListComponent {
  constructor(container) {
    this.container = (typeof container === 'string') 
      ? document.querySelector(container) 
      : container;
    
    this._onAdd = null;
    this._onDelete = null;
    
    this._root = document.createElement('div');
    this._root.className = 'card transactions';
    
    const h = document.createElement('h3');
    h.textContent = 'Операции';
    this._root.appendChild(h);
    
    this._table = document.createElement('table');
    this._table.className = 'transaction-table';
    this._table.innerHTML = `
      <thead>
        <tr>
          <th>Дата</th>
          <th>Описание</th>
          <th>Категория</th>
          <th>Сумма</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    this._root.appendChild(this._table);
    
    if (this.container) {
      this.container.appendChild(this._root);
    }
  }

  bindAdd(fn) { this._onAdd = fn; }
  bindDelete(fn) { this._onDelete = fn; }

  renderList(transactions) {
    const tbody = this._table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #999; font-style: italic;">
            Нет операций. Добавьте первую запись!
          </td>
        </tr>
      `;
      return;
    }
    
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      const amountClass = t.amount > 0 ? 'amount-positive' : 'amount-negative';
      const amountText = t.amount > 0 ? `+${t.amount}₽` : `${t.amount}₽`;
      
      tr.innerHTML = `
        <td>${t.date}</td>
        <td>${t.desc || '-'}</td>
        <td>${t.category}</td>
        <td class="${amountClass}">${amountText}</td>
        <td><button class="delete-btn" data-id="${t.id}">Удалить</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this._onDelete) this._onDelete(id);
      });
    });
  }
}