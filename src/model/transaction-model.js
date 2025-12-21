import { ApiService } from '../api.js';

export default class TransactionModel {
  constructor() { 
    this._transactions = []; // Начинаем с пустого массива
    this._observers = [];
    this._isNotifying = false;
  }

  // Мгновенная загрузка (асинхронная, не блокирует интерфейс)
  async load() {
    try {
      console.log('TransactionModel: Начинаю быструю загрузку...');
      const transactions = await ApiService.getTransactions();
      
      // Убедимся, что у всех есть ID
      this._transactions = transactions.map((t, index) => ({
        ...t,
        id: t.id || `t${Date.now()}_${index}`
      }));
      
      console.log('TransactionModel: Загружено транзакций:', this._transactions.length);
      this._notify('load', this._transactions);
      
    } catch (error) {
      console.error('TransactionModel: Ошибка загрузки:', error);
      this._transactions = [];
      this._notify('load', []);
    }
  }

  getAll() {
    return this._transactions.slice();
  }

  // Быстрое добавление (мгновенное)
  async add(transaction) {
    console.log('TransactionModel: Быстрое добавление транзакции');
    
    // 1. Мгновенное локальное добавление
    const localTransaction = { 
      ...transaction, 
      id: 'local_t_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      _pendingSync: true
    };
    
    this._transactions.push(localTransaction);
    this._notify('add', localTransaction);
    
    // 2. Фоновое сохранение на сервер
    setTimeout(async () => {
      try {
        const saved = await ApiService.addTransaction(transaction);
        console.log('TransactionModel: Серверный ID получен:', saved.id);
        
        // Обновляем локальную запись с серверным ID
        const index = this._transactions.findIndex(t => t.id === localTransaction.id);
        if (index !== -1) {
          this._transactions[index] = { 
            ...localTransaction, 
            id: saved.id,
            _pendingSync: false
          };
          this._notify('update', this._transactions[index]);
        }
      } catch (error) {
        console.warn('TransactionModel: Не удалось синхронизировать с сервером');
        // Оставляем локальную версию
      }
    }, 0);
    
    return localTransaction;
  }

  // Быстрое удаление
  async remove(id) {
    console.log('TransactionModel: Удаление транзакции:', id);
    
    const idx = this._transactions.findIndex(t => t.id === id);
    if (idx >= 0) {
      const removed = this._transactions.splice(idx, 1)[0];
      this._notify('remove', removed);
      
      // Фоновое удаление с сервера
      if (!id.startsWith('local_')) {
        setTimeout(async () => {
          try {
            await ApiService.deleteTransaction(id);
          } catch (error) {
            console.log('TransactionModel: Не удалось удалить с сервера');
          }
        }, 0);
      }
    }
  }

  subscribe(fn) {
    this._observers.push(fn);
  }

  _notify(type, payload) {
    if (this._isNotifying) return;
    
    this._isNotifying = true;
    try {
      this._observers.forEach(fn => fn(type, payload));
    } finally {
      this._isNotifying = false;
    }
  }
  
  // Очистка всех данных
  clear() {
    this._transactions = [];
    this._notify('clear', []);
  }
}
