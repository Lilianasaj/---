// src/api.js
const API_BASE_URL = 'https://690277c5b208b24affe63fdb.mockapi.io';

export class ApiService {
  static async getTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      if (!response.ok) throw new Error('Ошибка загрузки транзакций');
      const data = await response.json();
      console.log('Загружено транзакций:', data.length);
      return data;
    } catch (error) {
      console.error('Ошибка getTransactions:', error);
      return [
        { id: "1", date: "2024-11-25", desc: "Зарплата", category: "Доход", amount: 50000 },
        { id: "2", date: "2024-11-24", desc: "Продукты", category: "Еда", amount: -3500 },
        { id: "3", date: "2024-11-23", desc: "Бензин", category: "Автомобиль", amount: -2500 }
      ];
    }
  }

  static async addTransaction(transaction) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transaction,
          createdAt: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Ошибка добавления транзакции');
      const saved = await response.json();
      console.log('Транзакция добавлена:', saved);
      return saved;
    } catch (error) {
      console.error('Ошибка addTransaction:', error);
      const localTransaction = { 
        ...transaction, 
        id: 't' + Date.now(),
        createdAt: new Date().toISOString()
      };
      return localTransaction;
    }
  }

  static async deleteTransaction(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Ошибка удаления транзакции');
      console.log('Транзакция удалена:', id);
      return true;
    } catch (error) {
      console.error('Ошибка deleteTransaction:', error);
      return false;
    }
  }

  static async getBudgets() {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`);
      if (!response.ok) throw new Error('Ошибка загрузки бюджетов');
      const data = await response.json();
      console.log('Загружено бюджетов:', data.length);
      return data;
    } catch (error) {
      console.error('Ошибка getBudgets:', error);
      return [
        { id: "1", name: "Еда", limit: 10000, spent: 6000 },
        { id: "2", name: "Образование", limit: 30000, spent: 21000 },
        { id: "3", name: "Автомобиль", limit: 20000, spent: 4000 }
      ];
    }
  }

  static async addBudget(budget) {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...budget,
          createdAt: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Ошибка добавления бюджета');
      const saved = await response.json();
      console.log('Бюджет добавлен:', saved);
      return saved;
    } catch (error) {
      console.error('Ошибка addBudget:', error);
      // Локальное сохранение
      const localBudget = { 
        ...budget, 
        id: 'b' + Date.now(),
        createdAt: new Date().toISOString()
      };
      return localBudget;
    }
  }

  static async updateBudget(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Ошибка обновления бюджета');
      const updated = await response.json();
      console.log('Бюджет обновлен:', updated);
      return updated;
    } catch (error) {
      console.error('Ошибка updateBudget:', error);
      return updates;
    }
  }

  static async getCategories() {
    return [
      'Доход',
      'Продукты питания',
      'Автомобиль', 
      'Образование',
      'Еда вне дома',
      'Развлечения',
      'Одежда и обувь',
      'Здоровье',
      'Дом',
      'Транспорт',
      'Путешествия',
      'Техника',
      'Дети',
      'Домашние животные',
      'Хобби и увлечения',
      'Другое',
      'Без категории'
    ];
  }

  static async addCategory(category) {
    console.log('Категория добавлена локально:', category);
    return { name: category };
  }
}