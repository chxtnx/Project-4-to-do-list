const todoBtn = document.getElementById('todo-btn');
const sections = document.querySelectorAll('.panel-section');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const filters = document.querySelectorAll('.filters li');
const categories = document.querySelectorAll('.categories li');
const taskFilters = document.querySelectorAll('.task-filters li');

let currentView = 'all';

function showSection(id) {
  sections.forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

todoBtn.addEventListener('click', () => showSection('todo-section'));
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function isToday(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  return date.toDateString() === today.toDateString();
}

function daysBetween(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.ceil((then - now) / (1000 * 60 * 60 * 24));
}

function filterTasks(task) {
  if (currentView === 'completed' && !task.completed) return false;
  if (currentView === 'due' && daysBetween(task.date) !== 1) return false;
  if (currentView === 'priority') return true;
  if (currentView === 'today' && !isToday(task.date)) return false;
  if (currentView === '3days' && daysBetween(task.date) > 3) return false;
  if (currentView === 'bookmarks' && !task.bookmark) return false;
  return true;
}

function renderTasks() {
  let tasks = loadTasks();

  if (currentView === 'priority') {
    tasks = tasks.sort((a, b) => {
      const order = { high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
  }

  taskList.innerHTML = '';

  tasks.forEach(task => {
    if (!filterTasks(task)) return;

    const li = document.createElement('li');
    li.className = `task-card ${task.priority} ${task.category} ${task.bookmark ? 'bookmarked' : ''} ${task.completed ? 'completed' : ''}`;

    li.innerHTML = `
      <div class="task-header">
        <input type="checkbox" class="complete-toggle" data-id="${task.id}" ${task.completed ? 'checked' : ''}/>
        <span class="task-title">${task.name}</span>
        <div class="task-actions">
          <span class="material-icons edit-btn" data-id="${task.id}">edit</span>
          <span class="material-icons delete-btn" data-id="${task.id}">delete</span>
          <span class="bookmark-icon material-icons" data-id="${task.id}">
            ${task.bookmark ? 'star' : 'star_border'}
          </span>
        </div>
      </div>
      <div class="task-meta">
        <span class="task-date">${task.date}</span>
        <span class="task-time">${task.time}</span>
        <span class="priority-badge ${task.priority}">${task.priority}</span>
        <span class="category-tag ${task.category}">${task.category}</span>
      </div>
    `;

    taskList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      let tasks = loadTasks();
      tasks = tasks.filter(task => task.id !== id);
      saveTasks(tasks);
      renderTasks();
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      const tasks = loadTasks();
      const task = tasks.find(t => t.id === id);

      document.getElementById('taskName').value = task.name;
      document.getElementById('taskDate').value = task.date;
      document.getElementById('taskTime').value = task.time;
      document.getElementById('taskPriority').value = task.priority;
      document.getElementById('taskCategory').value = task.category;
      document.getElementById('taskBookmark').checked = task.bookmark;

      document.getElementById('taskModal').classList.add('active');

      taskForm.onsubmit = function (e) {
        e.preventDefault();
        task.name = document.getElementById('taskName').value;
        task.date = document.getElementById('taskDate').value;
        task.time = document.getElementById('taskTime').value;
        task.priority = document.getElementById('taskPriority').value;
        task.category = document.getElementById('taskCategory').value;
        task.bookmark = document.getElementById('taskBookmark').checked;

        saveTasks(tasks);
        renderTasks();
        taskForm.reset();
        document.getElementById('taskModal').classList.remove('active');
        taskForm.onsubmit = defaultSubmitHandler;
      };
    });
  });

  document.querySelectorAll('.bookmark-icon').forEach(icon => {
    icon.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      const tasks = loadTasks();
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.bookmark = !task.bookmark;
        saveTasks(tasks);
        renderTasks();
      }
    });
  });

  document.querySelectorAll('.complete-toggle').forEach(box => {
    box.addEventListener('change', e => {
      const id = Number(e.target.dataset.id);
      const tasks = loadTasks();
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.completed = e.target.checked;
        saveTasks(tasks);
        renderTasks();
      }
    });
  });
}

const defaultSubmitHandler = function (e) {
  e.preventDefault();
  const name = document.getElementById('taskName').value;
  const date = document.getElementById('taskDate').value;
  const time = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value;
  const bookmark = document.getElementById('taskBookmark').checked;

  const newTask = {
    id: Date.now(),
    name,
    date,
    time,
    priority,
    category,
    bookmark,
    completed: false
  };

  const tasks = loadTasks();
  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks();

  taskForm.reset();
  document.getElementById('taskModal').classList.remove('active');
};

taskForm.addEventListener('submit', defaultSubmitHandler);

filters.forEach(f => {
  f.addEventListener('click', () => {
    currentView = f.dataset.filter;
    renderTasks();
  });
});

categories.forEach(cat => {
  cat.addEventListener('click', () => {
    const category = cat.getAttribute('data-cat');
    const tasks = loadTasks().filter(t => t.category === category);
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-card ${task.priority} ${task.category}`;
      li.innerHTML = `
        <div class="task-header">
          <span class="task-title">${task.name}</span>
        </div>
        <div class="task-meta">
          <span class="task-date">${task.date}</span>
          <span class="task-time">${task.time}</span>
          <span class="priority-badge ${task.priority}">${task.priority}</span>
          <span class="category-tag ${task.category}">${task.category}</span>
        </div>
      `;
      taskList.appendChild(li);
    });
  });
});

taskFilters.forEach(f => {
  f.addEventListener('click', () => {
    currentView = f.getAttribute('data-view');
    renderTasks();
  });
});

renderTasks();
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderMiniCalendar(month = currentMonth, year = currentYear) {
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarMonth = document.getElementById("calendarMonth");

  const now = new Date();
  const today = now.getDate();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  calendarMonth.textContent = `${monthNames[month]} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const startDayIndex = firstDayOfMonth.getDay();

  let html = `<table><thead><tr>
    <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
  </tr></thead><tbody><tr>`;

  let day = 1;
  for (let cell = 0; cell < 42; cell++) {
    if (cell < startDayIndex || day > totalDays) {
      html += "<td></td>";
    } else {
      const isToday = day === today && month === thisMonth && year === thisYear;
      html += `<td class="${isToday ? "today" : ""}">${day}</td>`;
      day++;
    }

    if ((cell + 1) % 7 === 0 && cell !== 41) {
      html += "</tr><tr>";
    }
  }

  html += "</tr></tbody></table>";
  calendarGrid.innerHTML = html;
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderMiniCalendar(currentMonth, currentYear);
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderMiniCalendar(currentMonth, currentYear);
});

renderMiniCalendar();
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('span');

function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  themeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
}

const savedTheme = localStorage.getItem('theme');
applyTheme(savedTheme === 'dark');

themeToggleBtn.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark-mode');
  applyTheme(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

