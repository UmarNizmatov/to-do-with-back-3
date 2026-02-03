// Check if logged in
const username = localStorage.getItem("username");
const userId = localStorage.getItem("userId");
if (!username || !userId) {
  window.location.href = "login.html";
}

// DOM Elements
const sound = document.querySelector("#sound");
const form = document.querySelector("#form2");
const input = document.querySelector("#text");
const listContainer = document.querySelector(".todolist");
const usernameDisplay = document.querySelector("#username-display");
const totalCount = document.querySelector("#total-count");
const doneCount = document.querySelector("#done-count");
const perPageDisplay = document.querySelector("#per-page-display");
const paginationContainer = document.querySelector("#pagination");
const settingsBtn = document.querySelector("#settings-btn");
const logoutBtn = document.querySelector("#logout-btn");
const settingsModal = document.querySelector("#settings-modal");
const closeModal = document.querySelector("#close-modal");
const saveSettings = document.querySelector("#save-settings");
const itemsPerPageSelect = document.querySelector("#items-per-page");
const modalUsername = document.querySelector("#modal-username");

// State
let isEditing = false;
let currentPage = 1;
let itemsPerPage = parseInt(localStorage.getItem("itemsPerPage")) || 5;
let allTodos = [];

// API Configuration
const API_URL = "https://696e3d67d7bacd2dd7163424.mockapi.io/todo/todo";

// Initialize
init();

function init() {
  usernameDisplay.textContent = username;
  modalUsername.textContent = username;
  itemsPerPageSelect.value = itemsPerPage;
  perPageDisplay.textContent = itemsPerPage;
  loadTodos();
}

// Play sound
function playSound() {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(err => console.log("Sound play failed:", err));
  }
}

// Get current date and time
function getDateTime() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Format time for display
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} д. назад`;
  
  return dateStr;
}

// Auto resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

// Update statistics
function updateStats() {
  const total = allTodos.length;
  const done = allTodos.filter(t => t.done).length;
  
  totalCount.textContent = total;
  doneCount.textContent = done;
}

// Load todos
async function loadTodos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch todos");
    
    const allApiTodos = await response.json();
    allTodos = allApiTodos.filter(todo => todo.username === username);

    updateStats();
    renderPaginatedTodos();
    renderPagination();
    
  } catch (error) {
    console.error("Error loading todos:", error);
    showNotification("Ошибка загрузки данных", "error");
  }
}

// Render paginated todos
function renderPaginatedTodos() {
  if (allTodos.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state animate-fade-in">
        <i class="fas fa-inbox"></i>
        <p>Нет планов. Добавьте первый!</p>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const todosToShow = allTodos.slice(startIndex, endIndex);

  listContainer.innerHTML = todosToShow
    .map((item, index) => createTodoHTML(item, startIndex + index))
    .join("");

  // Auto-resize all textareas and add stagger animation
  listContainer.querySelectorAll(".list").forEach((item, index) => {
    item.style.animationDelay = `${index * 0.05}s`;
    const textarea = item.querySelector(".text2");
    if (textarea) {
      autoResizeTextarea(textarea);
    }
  });
}

// Create todo HTML
function createTodoHTML(item, index) {
  const completedClass = item.done ? 'completed' : '';
  return `
    <div class="list ${completedClass}" data-id="${item.id}" data-index="${index}">
      <input type="checkbox" class="isdone" ${item.done ? "checked" : ""} />
      <textarea class="text2" disabled>${item.text}</textarea>
      <div class="buttons">
        <button class="edit" title="Редактировать">
          <i class="fa-solid fa-pencil"></i>
        </button>
        <button class="delete" title="Удалить">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <span class="time">
        <i class="fas fa-clock"></i> ${formatTime(item.last_edited_time)}
      </span>
    </div>
  `;
}

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(allTodos.length / itemsPerPage);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = `
    <button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Show page numbers with ellipsis
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="page-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="page-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  paginationHTML += `
    <button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

// Handle pagination clicks
paginationContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".page-btn");
  if (!btn || btn.disabled) return;

  const page = btn.dataset.page;
  const totalPages = Math.ceil(allTodos.length / itemsPerPage);

  if (page === "prev") {
    currentPage = Math.max(1, currentPage - 1);
  } else if (page === "next") {
    currentPage = Math.min(totalPages, currentPage + 1);
  } else {
    currentPage = parseInt(page);
  }

  // Smooth scroll to top
  listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  renderPaginatedTodos();
  renderPagination();
  playSound();
});

// Create new todo
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) {
    showNotification("Пожалуйста, введите текст", "warning");
    input.focus();
    return;
  }

  playSound();
  
  const submitBtn = form.querySelector("button");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner loading"></i> Создание...';
  submitBtn.disabled = true;

  try {
    const newTodo = {
      username: username,
      text: text,
      done: false,
      last_edited_time: getDateTime(),
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTodo),
    });

    if (!response.ok) throw new Error("Failed to create todo");

    input.value = "";
    currentPage = 1; // Reset to first page
    await loadTodos();
    showNotification("План успешно создан!", "success");
    
  } catch (error) {
    console.error("Error creating todo:", error);
    showNotification("Ошибка создания плана", "error");
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Handle todo interactions
listContainer.addEventListener("click", async (e) => {
  const item = e.target.closest(".list");
  if (!item) return;

  const id = Number(item.dataset.id);

  // Delete todo
  if (e.target.closest(".delete")) {
    if (!confirm("Вы уверены, что хотите удалить этот план?")) return;
    
    playSound();
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete todo");

      item.style.animation = "slideOutRight 0.3s ease forwards";
      setTimeout(async () => {
        await loadTodos();
        
        // Adjust page if needed
        const totalPages = Math.ceil(allTodos.length / itemsPerPage);
        if (currentPage > totalPages && currentPage > 1) {
          currentPage = totalPages;
        }
        
        renderPaginatedTodos();
        renderPagination();
        showNotification("План удален", "success");
      }, 300);
      
    } catch (error) {
      console.error("Error deleting todo:", error);
      showNotification("Ошибка удаления плана", "error");
    }
  }

  // Edit todo
  else if (e.target.closest(".edit")) {
    playSound();
    
    const textarea = item.querySelector(".text2");
    const editBtn = item.querySelector(".edit");

    if (!isEditing) {
      // Start editing
      textarea.removeAttribute("disabled");
      textarea.focus();
      textarea.select();
      editBtn.classList.add("editing");
      editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      isEditing = true;
      
    } else {
      // Save changes
      editBtn.innerHTML = '<i class="fas fa-spinner loading"></i>';
      editBtn.disabled = true;

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textarea.value.trim(),
            last_edited_time: getDateTime(),
          }),
        });

        if (!response.ok) throw new Error("Failed to update todo");

        textarea.setAttribute("disabled", "true");
        editBtn.classList.remove("editing");
        editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
        isEditing = false;
        await loadTodos();
        showNotification("План обновлен", "success");
        
      } catch (error) {
        console.error("Error updating todo:", error);
        showNotification("Ошибка обновления плана", "error");
      } finally {
        editBtn.disabled = false;
      }
    }
  }

  // Toggle done status
  else if (e.target.classList.contains("isdone")) {
    playSound();
    
    const checkbox = e.target;
    const isDone = checkbox.checked;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          done: isDone,
          last_edited_time: getDateTime(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update todo");

      if (isDone) {
        item.classList.add("completed");
        item.style.animation = "completeAnimation 0.5s ease forwards";
      } else {
        item.classList.remove("completed");
        item.style.animation = "";
      }

      await loadTodos();
      
    } catch (error) {
      console.error("Error updating todo:", error);
      checkbox.checked = !isDone; // Revert checkbox
      showNotification("Ошибка обновления статуса", "error");
    }
  }
});

// Handle textarea auto-resize during editing
listContainer.addEventListener("input", (e) => {
  if (e.target.classList.contains("text2")) {
    autoResizeTextarea(e.target);
  }
});

// Settings modal
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("active");
  playSound();
});

closeModal.addEventListener("click", () => {
  settingsModal.classList.remove("active");
  playSound();
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("active");
  }
});

saveSettings.addEventListener("click", () => {
  const newItemsPerPage = parseInt(itemsPerPageSelect.value);
  
  if (newItemsPerPage !== itemsPerPage) {
    itemsPerPage = newItemsPerPage;
    localStorage.setItem("itemsPerPage", itemsPerPage);
    perPageDisplay.textContent = itemsPerPage;
    currentPage = 1; // Reset to first page
    renderPaginatedTodos();
    renderPagination();
    showNotification("Настройки сохранены!", "success");
  }
  
  settingsModal.classList.remove("active");
  playSound();
});

// Logout
logoutBtn.addEventListener("click", () => {
  if (confirm("Вы уверены, что хотите выйти?")) {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    window.location.href = "login.html";
  }
});

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 
                 type === 'error' ? 'linear-gradient(135deg, #f87171, #ef4444)' : 
                 'linear-gradient(135deg, #fbbf24, #f59e0b)'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
    font-weight: 500;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 
                       type === 'error' ? 'exclamation-circle' : 
                       'info-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideInRight 0.3s ease reverse";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Handle Enter key in input
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
