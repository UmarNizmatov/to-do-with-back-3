// Check if already logged in
const existingUsername = localStorage.getItem("username");
const existingUserId = localStorage.getItem("userId");
if (existingUsername && existingUserId) {
  window.location.href = "index.html";
}

// API Configuration
const API_URL = "https://6981e3a2c9a606f5d4485c68.mockapi.io/users";

// DOM Elements
const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const usernameError = document.querySelector("#username-error");
const passwordError = document.querySelector("#password-error");
const loginBtn = document.querySelector("#login-btn");
const registerBtn = document.querySelector("#register-btn");
const togglePasswordBtn = document.querySelector("#toggle-password");

let isRegistering = false;

// Toggle password visibility
togglePasswordBtn.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePasswordBtn.classList.toggle("active");
});

// Switch between login and register
registerBtn.addEventListener("click", () => {
  isRegistering = !isRegistering;
  
  if (isRegistering) {
    loginBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Зарегистрироваться</span>';
    registerBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Уже есть аккаунт?</span>';
    registerBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
    loginBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
  } else {
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Войти</span>';
    registerBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Регистрация</span>';
    loginBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
    registerBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
  }
  
  clearErrors();
});

// Form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!username) {
    showError("username", "Пожалуйста, введите ваше имя");
    usernameInput.focus();
    return;
  }

  if (username.length < 2) {
    showError("username", "Имя должно содержать минимум 2 символа");
    usernameInput.focus();
    return;
  }

  if (username.length > 20) {
    showError("username", "Имя должно содержать максимум 20 символов");
    usernameInput.focus();
    return;
  }

  if (!password) {
    showError("password", "Пожалуйста, введите пароль");
    passwordInput.focus();
    return;
  }

  if (password.length < 4) {
    showError("password", "Пароль должен содержать минимум 4 символа");
    passwordInput.focus();
    return;
  }

  // Disable buttons
  loginBtn.disabled = true;
  registerBtn.disabled = true;
  const originalText = loginBtn.innerHTML;
  loginBtn.innerHTML = '<i class="fas fa-spinner loading"></i> Загрузка...';

  try {
    if (isRegistering) {
      await handleRegistration(username, password);
    } else {
      await handleLogin(username, password);
    }
  } catch (error) {
    console.error("Authentication error:", error);
    showError("password", "Ошибка соединения с сервером");
  } finally {
    loginBtn.disabled = false;
    registerBtn.disabled = false;
    loginBtn.innerHTML = originalText;
  }
});

// Handle login
async function handleLogin(username, password) {
  try {
    // Fetch all users
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch users");
    
    const users = await response.json();
    
    // Find user by username and password
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      showError("password", "Неверное имя пользователя или пароль");
      return;
    }
    
    // Save user data
    localStorage.setItem("username", user.username);
    localStorage.setItem("userId", user.id);
    
    // Add animation before redirect
    const loginBox = document.querySelector(".login-box");
    loginBox.style.animation = "fadeOutScale 0.5s ease forwards";
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
    
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Handle registration
async function handleRegistration(username, password) {
  try {
    // Check if username already exists
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch users");
    
    const users = await response.json();
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
      showError("username", "Это имя пользователя уже занято");
      return;
    }
    
    // Create new user
    const newUser = {
      username: username,
      password: password,
      created_at: new Date().toISOString()
    };
    
    const createResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    
    if (!createResponse.ok) throw new Error("Failed to create user");
    
    const createdUser = await createResponse.json();
    
    // Save user data
    localStorage.setItem("username", createdUser.username);
    localStorage.setItem("userId", createdUser.id);
    
    // Add animation before redirect
    const loginBox = document.querySelector(".login-box");
    loginBox.style.animation = "fadeOutScale 0.5s ease forwards";
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
    
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Show error message
function showError(field, message) {
  const errorElement = field === "username" ? usernameError : passwordError;
  const inputElement = field === "username" ? usernameInput : passwordInput;
  
  errorElement.textContent = message;
  inputElement.style.borderColor = "#f87171";
  inputElement.style.animation = "shake 0.3s ease";
  
  setTimeout(() => {
    inputElement.style.animation = "";
  }, 300);
}

// Clear all errors
function clearErrors() {
  usernameError.textContent = "";
  passwordError.textContent = "";
  usernameInput.style.borderColor = "";
  passwordInput.style.borderColor = "";
}

// Clear error on input
usernameInput.addEventListener("input", () => {
  usernameError.textContent = "";
  usernameInput.style.borderColor = "";
});

passwordInput.addEventListener("input", () => {
  passwordError.textContent = "";
  passwordInput.style.borderColor = "";
});

// Focus input on load
usernameInput.focus();

// Add fadeout animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOutScale {
    to {
      opacity: 0;
      transform: scale(0.9) translateY(-30px);
    }
  }
`;
document.head.appendChild(style);
