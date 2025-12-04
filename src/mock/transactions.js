// Тестовые данные (можно заменить реальными)
export const transactionsMock = [
  { id: 't1', date: '2024-04-01', desc: 'Продукты', category: 'Еда', amount: -5000 },
  { id: 't2', date: '2024-04-02', desc: 'Зарплата', category: 'Доход', amount: 50000 },
  { id: 't3', date: '2024-04-02', desc: 'Долг', category: 'Доход', amount: 5000 },
  { id: 't4', date: '2024-04-04', desc: 'Бензин', category: 'Автомобиль', amount: -2200 },
  { id: 't5', date: '2024-04-05', desc: 'Учёба', category: 'Образование', amount: -20000 },
  { id: 't6', date: '2024-04-05', desc: 'Продукты', category: 'Еда', amount: -1000 }
];

export const budgetsMock = [
  { id: 'b1', name: 'Все расходы', limit: 0, spent: 0 },
  { id: 'b2', name: 'Еда', limit: 10000, spent: 6000 },
  { id: 'b3', name: 'Образование', limit: 30000, spent: 21000 },
  { id: 'b4', name: 'Автомобиль', limit: 20000, spent: 4000 },
  { id: 'b5', name: 'Прочее', limit: 20000, spent: 5000 }
];

export const categoriesMock = ['Доход', 'Еда', 'Автомобиль', 'Образование', 'Прочее'];
