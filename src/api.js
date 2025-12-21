// src/api.js
const API_BASE_URL = 'https://690277c5b208b24affe63fdb.mockapi.io';

// Ключи для localStorage
const STORAGE_KEYS = {
  TRANSACTIONS: 'spendly_transactions',
  BUDGETS: 'spendly_budgets',
  LAST_SYNC: 'spendly_last_sync'
};

// Кэш в памяти
const cache = new Map();
const CACHE_DURATION = 30000; // 30 секунд

// Функции для работы с localStorage
const StorageService = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return true;
    } catch (e) {
      console.warn('StorageService: Не удалось сохранить данные:', e);
      return false;
    }
  },

  load(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Проверяем, что данные не старше 24 часов
      if (Date.now() - parsed.timestamp < 86400000) {
        return parsed.data;
      }
    } catch (e) {
      console.warn('StorageService: Не удалось загрузить данные:', e);
    }
    return null;
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('StorageService: Не удалось удалить данные:', e);
    }
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => this.remove(key));
  }
};

// Функция для быстрого запроса с коротким таймаутом
async function quickFetch(url, options = {}, timeout = 2000) {
  if (!navigator.onLine) {
    throw new Error('Оффлайн');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Функция для слияния данных (приоритет у серверных данных)
function mergeData(serverData, localData) {
  if (!serverData || serverData.length === 0) return localData || [];
  if (!localData || localData.length === 0) return serverData;
  
  const serverMap = new Map();
  const localMap = new Map();
  
  // Создаем карты для быстрого поиска
  serverData.forEach(item => serverMap.set(item.id, item));
  localData.forEach(item => {
    // Игнорируем локальные временные ID
    if (!item.id || item.id.startsWith('local_')) {
      return;
    }
    localMap.set(item.id, item);
  });
  
  // Объединяем данные, приоритет у серверных
  const result = [...serverData];
  
  // Добавляем локальные данные, которых нет на сервере
  localData.forEach(item => {
    if (!item.id || item.id.startsWith('local_')) return;
    if (!serverMap.has(item.id)) {
      result.push(item);
    }
  });
  
  return result;
}

// Функция для удаления дубликатов бюджетов
function removeDuplicateBudgets(budgets) {
  if (!budgets || budgets.length === 0) return budgets;
  
  const seenNames = new Set();
  const seenIds = new Set();
  const uniqueBudgets = [];
  
  budgets.forEach(budget => {
    // Проверяем по ID (первый приоритет)
    if (budget.id && seenIds.has(budget.id)) {
      console.warn('API: Удаляю дубликат бюджета по ID:', budget.id, budget.name);
      return;
    }
    
    // Проверяем по имени (особенно важно для "Все расходы")
    if (seenNames.has(budget.name)) {
      console.warn('API: Удаляю дубликат бюджета по имени:', budget.name);
      return;
    }
    
    seenIds.add(budget.id);
    seenNames.add(budget.name);
    uniqueBudgets.push(budget);
  });
  
  console.log('API: После фильтрации дубликатов осталось бюджетов:', uniqueBudgets.length);
  return uniqueBudgets;
}

export class ApiService {
  // ====== ТРАНЗАКЦИИ ======
  static async getTransactions() {
    const cacheKey = 'transactions';
    const now = Date.now();
    
    // 1. Проверяем кэш в памяти
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('API: Использую кэшированные транзакции');
      return cached.data;
    }
    
    // 2. Загружаем из localStorage
    const storedTransactions = StorageService.load(STORAGE_KEYS.TRANSACTIONS) || [];
    
    try {
      console.log('API: Быстрая загрузка транзакций с сервера...');
      const response = await quickFetch(`${API_BASE_URL}/transactions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const serverTransactions = await response.json();
      
      // 3. Сливаем данные
      const mergedTransactions = mergeData(serverTransactions, storedTransactions);
      
      // 4. Сохраняем везде
      cache.set(cacheKey, { data: mergedTransactions, timestamp: now });
      StorageService.save(STORAGE_KEYS.TRANSACTIONS, mergedTransactions);
      
      console.log('API: Транзакции загружены (сервер:', serverTransactions.length, 
                  'локально:', storedTransactions.length, 
                  'итого:', mergedTransactions.length, ')');
      
      return mergedTransactions;
      
    } catch (error) {
      console.warn('API: Не удалось загрузить транзакции с сервера:', error.message);
      
      // Используем сохраненные данные
      if (storedTransactions.length > 0) {
        console.log('API: Использую сохраненные транзакции');
        cache.set(cacheKey, { data: storedTransactions, timestamp: now });
        return storedTransactions;
      }
      
      // Если кэш есть, используем его
      if (cached) {
        console.log('API: Возвращаю старые кэшированные данные');
        return cached.data;
      }
      
      return [];
    }
  }

  static async addTransaction(transaction) {
    const localId = 'local_t_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const transactionWithId = { ...transaction, id: localId };
    
    // 1. Сохраняем локально
    const stored = StorageService.load(STORAGE_KEYS.TRANSACTIONS) || [];
    stored.push(transactionWithId);
    StorageService.save(STORAGE_KEYS.TRANSACTIONS, stored);
    
    // 2. Обновляем кэш
    cache.delete('transactions');
    
    // 3. Фоновое сохранение на сервер
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...transaction,
            createdAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const saved = await response.json();
          console.log('API: Транзакция сохранена на сервере:', saved.id);
          
          // Обновляем локальную запись
          const allTransactions = StorageService.load(STORAGE_KEYS.TRANSACTIONS) || [];
          const index = allTransactions.findIndex(t => t.id === localId);
          if (index !== -1) {
            allTransactions[index] = { ...allTransactions[index], id: saved.id };
            StorageService.save(STORAGE_KEYS.TRANSACTIONS, allTransactions);
            cache.delete('transactions');
          }
        }
      } catch (error) {
        console.log('API: Не удалось сохранить транзакцию на сервере');
      }
    }, 100);
    
    return transactionWithId;
  }

  static async deleteTransaction(id) {
    // 1. Удаляем локально
    const stored = StorageService.load(STORAGE_KEYS.TRANSACTIONS) || [];
    const filtered = stored.filter(t => t.id !== id);
    StorageService.save(STORAGE_KEYS.TRANSACTIONS, filtered);
    
    // 2. Обновляем кэш
    cache.delete('transactions');
    
    // 3. Фоновое удаление с сервера (только если это не локальный ID)
    if (!id.startsWith('local_')) {
      setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log('API: Транзакция удалена с сервера');
          }
        } catch (error) {
          console.log('API: Не удалось удалить транзакцию с сервера');
        }
      }, 100);
    }
    
    return true;
  }

  // ====== БЮДЖЕТЫ ======
  static async getBudgets() {
    const cacheKey = 'budgets';
    const now = Date.now();
    
    // 1. Проверяем кэш в памяти
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('API: Использую кэшированные бюджеты');
      return removeDuplicateBudgets(cached.data);
    }
    
    // 2. Загружаем из localStorage
    const storedBudgets = StorageService.load(STORAGE_KEYS.BUDGETS) || [];
    
    try {
      console.log('API: Быстрая загрузка бюджетов с сервера...');
      const response = await quickFetch(`${API_BASE_URL}/budgets`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const serverBudgets = await response.json();
      
      // 3. Сливаем данные
      const mergedBudgets = mergeData(serverBudgets, storedBudgets);
      
      // 4. Удаляем дубликаты
      const filteredBudgets = removeDuplicateBudgets(mergedBudgets);
      
      // 5. Сохраняем везде
      cache.set(cacheKey, { data: filteredBudgets, timestamp: now });
      StorageService.save(STORAGE_KEYS.BUDGETS, filteredBudgets);
      
      console.log('API: Бюджеты загружены (сервер:', serverBudgets.length, 
                  'локально:', storedBudgets.length, 
                  'после слияния:', mergedBudgets.length,
                  'после фильтрации:', filteredBudgets.length, ')');
      
      return filteredBudgets;
      
    } catch (error) {
      console.warn('API: Не удалось загрузить бюджеты с сервера:', error.message);
      
      // Используем сохраненные данные (после фильтрации дубликатов)
      const filteredStored = removeDuplicateBudgets(storedBudgets);
      if (filteredStored.length > 0) {
        console.log('API: Использую сохраненные бюджеты');
        cache.set(cacheKey, { data: filteredStored, timestamp: now });
        return filteredStored;
      }
      
      // Если кэш есть, используем его
      if (cached) {
        console.log('API: Возвращаю старые кэшированные данные');
        return removeDuplicateBudgets(cached.data);
      }
      
      return [];
    }
  }

  static async addBudget(budget) {
    // Проверяем, не пытаемся ли добавить дубликат "Все расходы"
    if (budget.name === 'Все расходы') {
      const existingBudgets = await this.getBudgets();
      const existingTotal = existingBudgets.find(b => b.name === 'Все расходы');
      
      if (existingTotal) {
        console.warn('API: Бюджет "Все расходы" уже существует, обновляю вместо создания');
        return await this.updateBudget(existingTotal.id, {
          limit: budget.limit || existingTotal.limit,
          spent: budget.spent !== undefined ? budget.spent : existingTotal.spent
        });
      }
    }
    
    const localId = 'local_b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const budgetWithId = { ...budget, id: localId };
    
    // 1. Сохраняем локально
    const stored = StorageService.load(STORAGE_KEYS.BUDGETS) || [];
    stored.push(budgetWithId);
    const filteredStored = removeDuplicateBudgets(stored);
    StorageService.save(STORAGE_KEYS.BUDGETS, filteredStored);
    
    // 2. Обновляем кэш
    cache.delete('budgets');
    
    // 3. Фоновое сохранение на сервер
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...budget,
            createdAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const saved = await response.json();
          console.log('API: Бюджет сохранен на сервере:', saved.id);
          
          // Обновляем локальную запись
          const allBudgets = StorageService.load(STORAGE_KEYS.BUDGETS) || [];
          const index = allBudgets.findIndex(b => b.id === localId);
          if (index !== -1) {
            allBudgets[index] = { ...allBudgets[index], id: saved.id };
            const filteredAll = removeDuplicateBudgets(allBudgets);
            StorageService.save(STORAGE_KEYS.BUDGETS, filteredAll);
            cache.delete('budgets');
          }
        }
      } catch (error) {
        console.log('API: Не удалось сохранить бюджет на сервере');
      }
    }, 100);
    
    return budgetWithId;
  }

  static async updateBudget(id, updates) {
    // 1. Обновляем локально
    const stored = StorageService.load(STORAGE_KEYS.BUDGETS) || [];
    const index = stored.findIndex(b => b.id === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      const filteredStored = removeDuplicateBudgets(stored);
      StorageService.save(STORAGE_KEYS.BUDGETS, filteredStored);
    }
    
    // 2. Обновляем кэш
    cache.delete('budgets');
    
    // 3. Фоновое обновление на сервере (только если это не локальный ID)
    if (!id.startsWith('local_')) {
      setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          
          if (response.ok) {
            console.log('API: Бюджет обновлен на сервере');
          }
        } catch (error) {
          console.log('API: Не удалось обновить бюджет на сервере');
        }
      }, 100);
    }
    
    return updates;
  }

  // ====== КАТЕГОРИИ ======
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

  // ====== РАСЧЕТ ВСЕХ РАСХОДОВ ======
  static async calculateTotalExpenses() {
    try {
      const transactions = await this.getTransactions();
      
      // Суммируем все расходы (отрицательные значения)
      const totalExpenses = transactions.reduce((total, transaction) => {
        if (transaction.amount < 0) {
          return total + Math.abs(transaction.amount);
        }
        return total;
      }, 0);
      
      console.log('API: Расчет всех расходов:', totalExpenses);
      return totalExpenses;
      
    } catch (error) {
      console.error('API: Ошибка расчета расходов:', error);
      return 0;
    }
  }

  // ====== ОБНОВЛЕНИЕ БЮДЖЕТА "ВСЕ РАСХОДЫ" ======
  static async updateTotalExpensesBudget() {
    try {
      // 1. Получаем текущие бюджеты (уже без дубликатов)
      const budgets = await this.getBudgets();
      
      // 2. Ищем бюджет "Все расходы"
      const totalBudget = budgets.find(b => b.name === 'Все расходы');
      
      // 3. Рассчитываем текущие расходы
      const totalExpenses = await this.calculateTotalExpenses();
      
      console.log('API: Обновление бюджета "Все расходы": текущие расходы =', totalExpenses);
      
      // 4. Если бюджет существует - обновляем, если нет - создаем
      if (totalBudget) {
        // Обновляем только spent, limit оставляем как есть
        const result = await this.updateBudget(totalBudget.id, { spent: totalExpenses });
        console.log('API: Бюджет "Все расходы" обновлен, spent:', totalExpenses);
        return { ...totalBudget, spent: totalExpenses, ...result };
      } else {
        // Создаем новый бюджет
        const newBudget = {
          name: 'Все расходы',
          limit: 0, // По умолчанию без лимита
          spent: totalExpenses
        };
        
        const saved = await this.addBudget(newBudget);
        console.log('API: Бюджет "Все расходы" создан');
        return saved;
      }
      
    } catch (error) {
      console.error('API: Ошибка обновления бюджета "Все расходы":', error);
      return null;
    }
  }

  // ====== ПОЛУЧЕНИЕ БЮДЖЕТА "ВСЕ РАСХОДЫ" ======
  static async getTotalExpensesBudget() {
    try {
      const budgets = await this.getBudgets();
      const totalBudget = budgets.find(b => b.name === 'Все расходы');
      
      if (totalBudget) {
        return totalBudget;
      }
      
      // Если бюджета нет, создаем его
      return await this.updateTotalExpensesBudget();
      
    } catch (error) {
      console.error('API: Ошибка получения бюджета "Все расходы":', error);
      return null;
    }
  }

  // ====== СИНХРОНИЗАЦИЯ ======
  static async syncAll() {
    console.log('API: Начинаю синхронизацию всех данных...');
    
    try {
      const [transactions, budgets] = await Promise.all([
        this.getTransactions(),
        this.getBudgets()
      ]);
      
      // Обновляем бюджет "Все расходы" при синхронизации
      await this.updateTotalExpensesBudget();
      
      console.log('API: Синхронизация завершена');
      return { transactions, budgets };
    } catch (error) {
      console.error('API: Ошибка синхронизации:', error);
      throw error;
    }
  }

  // ====== УДАЛЕНИЕ ДУБЛИКАТОВ ======
  static async removeAllDuplicates() {
    try {
      const budgets = await this.getBudgets();
      const filteredBudgets = removeDuplicateBudgets(budgets);
      
      // Сохраняем очищенные данные
      StorageService.save(STORAGE_KEYS.BUDGETS, filteredBudgets);
      cache.set('budgets', { data: filteredBudgets, timestamp: Date.now() });
      
      console.log('API: Удалены дубликаты бюджетов, осталось:', filteredBudgets.length);
      return filteredBudgets;
      
    } catch (error) {
      console.error('API: Ошибка удаления дубликатов:', error);
      return [];
    }
  }

  // ====== ПОИСК ДУБЛИКАТОВ ======
  static async findDuplicates() {
    try {
      const budgets = await this.getBudgets();
      const duplicates = [];
      const seenNames = new Map();
      
      budgets.forEach(budget => {
        if (seenNames.has(budget.name)) {
          duplicates.push({
            name: budget.name,
            duplicates: [seenNames.get(budget.name), budget]
          });
        } else {
          seenNames.set(budget.name, budget);
        }
      });
      
      return duplicates;
    } catch (error) {
      console.error('API: Ошибка поиска дубликатов:', error);
      return [];
    }
  }

  // Очистка всех данных
  static clearAll() {
    cache.clear();
    StorageService.clearAll();
    console.log('API: Все данные очищены');
  }
}

// Глобальные функции
window.clearApiCache = ApiService.clearAll;
window.syncData = ApiService.syncAll;
window.updateTotalBudget = ApiService.updateTotalExpensesBudget;
window.getTotalBudget = ApiService.getTotalExpensesBudget;
window.removeBudgetDuplicates = ApiService.removeAllDuplicates;
window.findBudgetDuplicates = ApiService.findDuplicates;