// Точка входа — связываем всё вместе
import HeaderComponent from './view/header-component.js';
import TransactionListComponent from './view/transaction-list-component.js';
import AddTransactionFormComponent from './view/add-transaction-form-component.js';
import BudgetListComponent from './view/budget-list-component.js';
import FilterComponent from './view/filter-component.js';
import ChartPieComponent from './view/chart-pie-component.js';
import ChartDynamicsComponent from './view/chart-dynamics-component.js';
import SummaryComponent from './view/summary-component.js';

import TransactionModel from './model/transaction-model.js';
import BudgetModel from './model/budget-model.js';
import CategoryModel from './model/category-model.js';

import TransactionPresenter from './presenter/transaction-presenter.js';
import BudgetPresenter from './presenter/budget-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import ChartPresenter from './presenter/chart-presenter.js';
import AddBudgetFormComponent from './view/add-budget-form-component.js';
import { transactionsMock, budgetsMock, categoriesMock } from './mock/transactions.js';

// Рендерим шапку
const header = new HeaderComponent('#app-header');
header.render();

// основной контейнер
const root = document.querySelector('#app-root');

// Верхняя панель (заголовок + кнопки) — простая вставка
const topBar = document.createElement('section');
topBar.className = 'top-bar';
topBar.innerHTML = `
  <h1>Личный финансовый учёт</h1>
  <div class="buttons-group">
    <button class="add-btn" id="show-add-form">+ Добавить запись</button>
    <button class="add-budget-btn" id="show-add-budget">+ Добавить бюджет</button>
  </div>
`;
root.appendChild(topBar);

// блок фильтра
const filterWrap = document.createElement('div');
filterWrap.className = 'filter';
root.appendChild(filterWrap);

// content-grid (две колонки)
const contentGrid = document.createElement('section');
contentGrid.className = 'content-grid';
contentGrid.innerHTML = `<div class="left-col"></div><div class="right-col"></div>`;
root.appendChild(contentGrid);

// бюджеты (внизу) добавим также
const budgetsSection = document.createElement('section');


// Инициализация View
const leftCol = contentGrid.querySelector('.left-col');
const rightCol = contentGrid.querySelector('.right-col');

// Form - модальное окно
const addForm = new AddTransactionFormComponent();
// Подключаем добавление транзакций
addForm.bindAdd((data) => {
  transactionPresenter._onViewAdd(data);
});

// Обработчик кнопки "Добавить запись"
document.getElementById('show-add-form').addEventListener('click', () => {
  addForm.show();
});

// Filter
const filterView = new FilterComponent(filterWrap);
const filterPresenter = new FilterPresenter({view: filterView});

// Transaction list
const transList = new TransactionListComponent(leftCol);



// Charts & categories in right column
const chartPie = new ChartPieComponent(rightCol);
const chartDyn = new ChartDynamicsComponent(rightCol);

// Budgets
const budgetList = new BudgetListComponent(root);

// Models
const transactionModel = new TransactionModel(transactionsMock);
const budgetModel = new BudgetModel(budgetsMock);
const categoryModel = new CategoryModel(categoriesMock);

// Presenters
const chartPresenter = new ChartPresenter({pieView: chartPie, dynamicsView: chartDyn});
const transactionPresenter = new TransactionPresenter({
  model: transactionModel,
  view: transList,
  chartPresenter,
  filterPresenter
});
const budgetPresenter = new BudgetPresenter({model: budgetModel, view: budgetList});

// Budget Form - модальное окно
const addBudgetForm = new AddBudgetFormComponent();
// Подключаем добавление бюджета
addBudgetForm.bindAdd((data) => {
  budgetPresenter._onViewAdd(data);
});

// Обработчик кнопки "Добавить бюджет"
document.getElementById('show-add-budget').addEventListener('click', () => {
  addBudgetForm.show();
});

// when transactions change — update summary and budgets (basic)
transactionModel.subscribe(() => {
  const all = transactionModel.getAll();
  chartPresenter.update(all);
});

// init presenters
transactionPresenter.init();
budgetPresenter.init();
chartPresenter.update(transactionModel.getAll());
// Добавьте эту функию для обновления потраченных сумм в бюджетах
const updateBudgetsSpent = () => {
  const transactions = transactionModel.getAll();
  const budgets = budgetModel.getAll();
  
  // Рассчитываем суммы по категориям (только расходы)
  const spentByCategory = transactions.reduce((acc, transaction) => {
    if (transaction.amount < 0) { // Только расходы
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    }
    return acc;
  }, {});

  // Обновляем потраченные суммы в бюджетах
  budgets.forEach(budget => {
    if (budget.name === 'Все расходы') {
      // Для "Все расходов" суммируем все расходы
      const totalSpent = Object.values(spentByCategory).reduce((sum, spent) => sum + spent, 0);
      budgetModel.update(budget.id, { spent: totalSpent });
    } else {
      // Для конкретных категорий берем соответствующую сумму
      const spent = spentByCategory[budget.name] || 0;
      budgetModel.update(budget.id, { spent: spent });
    }
  });
};

const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.innerHTML = `
  <div class="loading-spinner"></div>
  <p>Загрузка данных с сервера...</p>
`;
document.body.appendChild(loadingIndicator);

// Автоматическое скрытие через 3 секунды (на случай ошибок)
setTimeout(() => {
  loadingIndicator.style.opacity = '0';
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
  }, 300);
}, 3000);

// Также скрываем при успешной загрузке данных
transactionModel.subscribe((type) => {
  if (type === 'load' || type === 'add' || type === 'error') {
    loadingIndicator.style.opacity = '0';
    setTimeout(() => {
      loadingIndicator.style.display = 'none';
    }, 300);
  }
});
console.log('API URL:', 'https://690277c5b208b24affe63fdb.mockapi.io');
console.log('TransactionModel создан');
console.log('BudgetModel создан');