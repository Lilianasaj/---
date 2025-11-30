// Модель операций: хранит список и уведомляет подписчиков о изменениях
export default class TransactionModel {
  constructor(initial = []) {
    this._transactions = Array.from(initial);
    this._observers = [];
  }

  getAll() {
    // вернуть копию
    return this._transactions.slice();
  }

  add(transaction) {
    const t = { id: 't' + Date.now(), ...transaction };
    this._transactions.push(t);
    this._notify('add', t);
    return t;
  }

  remove(id) {
    const idx = this._transactions.findIndex(t => t.id === id);
    if (idx >= 0) {
      const removed = this._transactions.splice(idx, 1)[0];
      this._notify('remove', removed);
    }
  }

  update(id, patch) {
    const t = this._transactions.find(item => item.id === id);
    if (t) {
      Object.assign(t, patch);
      this._notify('update', t);
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    this._observers.forEach(fn => fn(type, payload));
  }
}
