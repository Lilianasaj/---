import { ApiService } from '../api.js';

export default class TransactionModel {
  constructor() { 
    this._transactions = [];
    this._observers = [];
    this._loadTransactions(); 
  }
  
  async _loadTransactions() {
    try {
      const transactions = await ApiService.getTransactions();
      this._transactions = transactions;
      this._notify('load', this._transactions);
    } catch (error) {
      console.error('TransactionModel: Ошибка загрузки:', error);
      
      this._transactions = [
        { id: 't1', date: '2024-04-01', desc: 'Продукты', category: 'Еда', amount: -5000 },
        { id: 't2', date: '2024-04-02', desc: 'Зарплата', category: 'Доход', amount: 50000 },
        { id: 't3', date: '2024-04-02', desc: 'Долг', category: 'Доход', amount: 5000 }
      ];
      this._notify('load', this._transactions);
    }
  }

  getAll() {
    return this._transactions.slice();
  }

  async add(transaction) { 
    try {
      const savedTransaction = await ApiService.addTransaction(transaction);
      this._transactions.push(savedTransaction);
      this._notify('add', savedTransaction);
      return savedTransaction;
    } catch (error) {
      console.error('Ошибка добавления транзакции:', error);
      const t = { id: 't' + Date.now(), ...transaction };
      this._transactions.push(t);
      this._notify('add', t);
      return t;
    }
  }

  async remove(id) { 
    try {
      await ApiService.deleteTransaction(id);
      const idx = this._transactions.findIndex(t => t.id === id);
      if (idx >= 0) {
        const removed = this._transactions.splice(idx, 1)[0];
        this._notify('remove', removed);
      }
    } catch (error) {
      console.error('Ошибка удаления транзакции:', error);
     
      const idx = this._transactions.findIndex(t => t.id === id);
      if (idx >= 0) {
        const removed = this._transactions.splice(idx, 1)[0];
        this._notify('remove', removed);
      }
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    this._observers.forEach(fn => fn(type, payload));
  }
}