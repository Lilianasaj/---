// В этой минимальной реализации не нужен отдельный файл — логика встроена в list.
// Оставлю заглушку для расширения.
export default class TransactionItemComponent {
  constructor(transaction) {
    this.transaction = transaction;
  }

  render() {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${this.transaction.date}</td>
                    <td>${this.transaction.desc}</td>
                    <td>${this.transaction.category}</td>
                    <td>${this.transaction.amount}</td>`;
    return tr;
  }
}
