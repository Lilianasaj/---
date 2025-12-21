// src/main.js
import HeaderComponent from './view/header-component.js';
import TransactionListComponent from './view/transaction-list-component.js';
import AddTransactionFormComponent from './view/add-transaction-form-component.js';
import BudgetListComponent from './view/budget-list-component.js';
import FilterComponent from './view/filter-component.js';
import ChartPieComponent from './view/chart-pie-component.js';


import TransactionModel from './model/transaction-model.js';
import BudgetModel from './model/budget-model.js';
import CategoryModel from './model/category-model.js';

import TransactionPresenter from './presenter/transaction-presenter.js';
import BudgetPresenter from './presenter/budget-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import ChartPresenter from './presenter/chart-presenter.js';
import AddBudgetFormComponent from './view/add-budget-form-component.js';

// ====== ГЛОБАЛЬНЫЙ ИНДИКАТОР ЗАГРУЗКИ ======
const createLoadingIndicator = () => {
  const indicator = document.createElement('div');
  indicator.id = 'global-loading';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(62, 62, 67, 0.9);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    flex-direction: column;
  `;
  
  indicator.innerHTML = `
    <div class="spinner" style="
      width: 60px;
      height: 60px;
      border: 6px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      border-top-color: #1F83E7;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    "></div>
    <p style="color: white; font-size: 18px; font-family: 'MullerRegular';">Загрузка...</p>
  `;
  
  document.body.appendChild(indicator);
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  return indicator;
};

const loadingIndicator = createLoadingIndicator();
window.showLoading = () => loadingIndicator.style.display = 'flex';
window.hideLoading = () => loadingIndicator.style.display = 'none';

// ====== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ======
const initApp = async () => {
  console.log('=== ЗАПУСК ПРИЛОЖЕНИЯ ===');
  
  window.showLoading();
  
  // 1. Рендерим шапку
  const header = new HeaderComponent('#app-header');
  header.render();
  
  // 2. Создаем основную структуру
  const root = document.querySelector('#app-root');
  
  // Верхняя панель
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
  
  // Блок фильтра
  const filterWrap = document.createElement('div');
  filterWrap.className = 'filter';
  filterWrap.innerHTML = `
    <h2>Фильтр</h2>
    <div class="filter-selects">
      <select name="month">
        <option value="">Месяц</option>
        ${[...Array(12)].map((_,i)=>`<option value="${i+1}">${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][i]}</option>`).join('')}
      </select>
      <select name="day">
        <option value="">День</option>
        ${[...Array(31)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
      </select>
    </div>
  `;
  root.appendChild(filterWrap);
  
  // СЕТКА 2x2: Верхний ряд (Операции + Круговая), Средний ряд (Динамика), Нижний ряд (Бюджеты)
  const contentGrid = document.createElement('section');
  contentGrid.className = 'content-grid';
  contentGrid.innerHTML = `
    <!-- Верхний ряд: Операции слева (2/3), Круговая справа (1/3) -->
    <div class="transactions-container"></div>
    <div class="categories-container"></div>
    
    <!-- Средний ряд: Динамика занимает всю ширину (2/3) -->
    <div class="dynamic-container" style="grid-column: 1;"></div>
    
    <!-- Нижний ряд: Бюджеты (будет добавлен отдельно) -->
  `;
  root.appendChild(contentGrid);
  
  // Получаем контейнеры
  const transactionsContainer = contentGrid.querySelector('.transactions-container');
  const categoriesContainer = contentGrid.querySelector('.categories-container');
  const dynamicContainer = contentGrid.querySelector('.dynamic-container');
  
  // 3. Создаем модели
  const transactionModel = new TransactionModel();
  const budgetModel = new BudgetModel(transactionModel);
  const categoryModel = new CategoryModel();
  
  // 4. Создаем вьюхи
  const filterView = new FilterComponent(filterWrap);
  const transList = new TransactionListComponent(transactionsContainer);
  const chartPie = new ChartPieComponent(categoriesContainer);

  
  // Секция бюджетов (полная ширина)
  const budgetsSection = document.createElement('section');
  budgetsSection.className = 'budgets-section';
  root.appendChild(budgetsSection);
  
  const budgetList = new BudgetListComponent(budgetsSection);
  
  // 5. Создаем презентеры
  const filterPresenter = new FilterPresenter({view: filterView});
  const chartPresenter = new ChartPresenter({pieView: chartPie});
  chartPresenter.setBudgetModel(budgetModel);
  
  const transactionPresenter = new TransactionPresenter({
    model: transactionModel,
    view: transList,
    chartPresenter,
    filterPresenter,
    budgetModel
  });
  
  const budgetPresenter = new BudgetPresenter({
    model: budgetModel, 
    view: budgetList,
    transactionModel: transactionModel
  });
  
  // 6. Создаем формы
  const addForm = new AddTransactionFormComponent();
  const addBudgetForm = new AddBudgetFormComponent();
  
  // 7. Настраиваем связи
  addForm.bindAdd((data) => {
    console.log('Добавление транзакции:', data);
    transactionPresenter._onViewAdd(data);
  });
  
  addBudgetForm.bindAdd((data) => {
    console.log('Добавление бюджета:', data);
    budgetPresenter._onViewAdd(data);
  });
  
  // 8. Обработчики кнопок
  document.getElementById('show-add-form').addEventListener('click', () => {
    addForm.show();
  });
  
  document.getElementById('show-add-budget').addEventListener('click', () => {
    addBudgetForm.show();
  });
  
  // 9. Подписка на изменения транзакций
  transactionModel.subscribe((type, payload) => {
    if (type === 'remove') {
      budgetModel.updateOnTransactionDelete(payload);
    } else if (type === 'add' && payload.amount < 0) {
      budgetModel.updateOnTransactionAdd(payload);
    }
    
    const all = transactionModel.getAll();
    chartPresenter.update(all);
    
    if (type === 'load' || type === 'add' || type === 'remove') {
      budgetModel._updateTotalExpensesBudget();
    }
  });
  
  // 10. Подписка на изменения бюджетов
  budgetModel.subscribe((type, payload) => {
    if (type === 'load' || type === 'update' || type === 'add') {
      const allTransactions = transactionModel.getAll();
      chartPresenter.update(allTransactions);
    }
  });
  
  // 11. Загружаем данные
  const loadData = async () => {
    console.log('Начинаю загрузку данных...');
    
    await transactionModel.load();
    await budgetModel.load();
    
    transactionPresenter.init();
    budgetPresenter.init();
    
    setTimeout(() => {
      window.hideLoading();
      console.log('Приложение готово!');
    }, 300);
  };
  
  // 12. Запускаем загрузку
  await loadData();
  
  // 13. Отладочные функции
  window.debugApp = () => {
    console.log('=== ОТЛАДКА ===');
    const transactions = transactionModel.getAll();
    const budgets = budgetModel.getAll();
    
    console.log('Транзакции:', transactions.length);
    console.log('Бюджеты:', budgets.length);
    
    const totalBudget = budgets.find(b => b.name === 'Все расходы');
    if (totalBudget) {
      console.log('Бюджет "Все расходы":', totalBudget);
    }
    
    const totalExpenses = transactions.reduce((total, t) => {
      if (t.amount < 0) return total + Math.abs(t.amount);
      return total;
    }, 0);
    console.log('Общие расходы из транзакций:', totalExpenses);
  };
  
  window.reloadData = () => {
    window.showLoading();
    setTimeout(async () => {
      await transactionModel.load();
      await budgetModel.load();
      window.hideLoading();
    }, 500);
  };
};

// ====== ЗАПУСК ======
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initApp().catch(error => {
      console.error('Ошибка запуска приложения:', error);
      window.hideLoading();
      alert('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
    });
  }, 100);
});

window.addEventListener('error', (event) => {
  console.error('Глобальная ошибка:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанный промис:', event.reason);
});