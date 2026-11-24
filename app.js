// Modern Rounded Task Manager & Board Logic - Enhanced Scale, Responsáveis Management & Smart Positioning

const STORAGE_KEY = 'monday_organizador_board_data_v5';

// 16 Vibrant Monday Palette Colors
const MONDAY_PALETTE = [
  "#00c875", // Green
  "#037f4c", // Dark green
  "#fdab3d", // Orange
  "#ffcb00", // Yellow
  "#e2445c", // Coral Red
  "#bb3341", // Dark Red
  "#5559df", // Indigo / Blue
  "#401b9c", // Dark Indigo
  "#0073ea", // Primary Blue
  "#579bfc", // Sky Blue
  "#00c3d9", // Cyan
  "#a25ddc", // Purple
  "#ff5ac4", // Pink
  "#784bd1", // Violet
  "#333333", // Dark Gray
  "#94a3b8"  // Slate Gray
];

// Initial Data
const INITIAL_DATA = {
  boardTitle: "Organização",
  currentView: "table",
  filterStatus: "ALL",
  searchQuery: "",
  calendarDate: "2026-11-01",
  
  // Dynamic Status Labels
  statusLabels: [
    { id: "status-done", label: "Feito", bg: "#00c875", text: "#ffffff", icon: "check" },
    { id: "status-working", label: "Em andamento", bg: "#fdab3d", text: "#ffffff", icon: "clock" },
    { id: "status-stuck", label: "Parado", bg: "#e2445c", text: "#ffffff", icon: "alert-circle" },
    { id: "status-review", label: "Em revisão", bg: "#5559df", text: "#ffffff", icon: "eye" },
    { id: "status-blank", label: "Não iniciado", bg: "#94a3b8", text: "#ffffff", icon: "minus" }
  ],

  // Dynamic Priority Labels
  priorityLabels: [
    { id: "prio-crit", label: "Crítica", bg: "#333333", text: "#ffffff" },
    { id: "prio-high", label: "Alta", bg: "#bb3341", text: "#ffffff" },
    { id: "prio-med", label: "Média", bg: "#5559df", text: "#ffffff" },
    { id: "prio-low", label: "Baixa", bg: "#579bfc", text: "#ffffff" },
    { id: "prio-none", label: "-", bg: "#94a3b8", text: "#ffffff" }
  ],

  members: [
    { id: "user-1", name: "Allan Nunes", initials: "AN", color: "#175e54" },
    { id: "user-2", name: "Caio Santos", initials: "CS", color: "#0073ea" },
    { id: "user-3", name: "Beneval Cadengue", initials: "BC", color: "#e2445c" },
    { id: "user-4", name: "Mariana Costa", initials: "MC", color: "#a25ddc" }
  ],

  groups: [
    {
      id: "group-1",
      name: "Tarefas pendentes",
      color: "#0073ea",
      collapsed: false,
      tasks: [
        {
          id: "task-1",
          title: "Tarefa 1",
          assigneeId: "user-1",
          status: "Em andamento",
          dueDate: "2026-11-22",
          priority: "Baixa",
          budget: 100,
          files: [{ id: "f-1", name: "especificacao.png", size: "240 KB" }],
          timeline: { start: "2026-11-22", end: "2026-11-23" },
          description: "Primeira etapa de planejamento e estruturação dos entregáveis.",
          subtasks: [
            { id: "st-1", title: "Levantamento de materiais", done: true },
            { id: "st-2", title: "Aprovação de orçamento", done: false }
          ]
        },
        {
          id: "task-2",
          title: "Tarefa 2",
          assigneeId: "user-2",
          status: "Feito",
          dueDate: "2026-11-23",
          priority: "Alta",
          budget: 1000,
          files: [],
          timeline: { start: "2026-11-24", end: "2026-11-25" },
          description: "Tarefa principal concluída e validada.",
          subtasks: [
            { id: "st-3", title: "Assinatura do termo", done: true }
          ]
        },
        {
          id: "task-3",
          title: "Tarefa 3",
          assigneeId: null,
          status: "Parado",
          dueDate: "2026-11-24",
          priority: "Média",
          budget: 500,
          files: [],
          timeline: { start: "2026-11-26", end: "2026-11-27" },
          description: "Aguardando envio das artes finais.",
          subtasks: []
        }
      ]
    },
    {
      id: "group-2",
      name: "Concluído",
      color: "#00c875",
      collapsed: false,
      tasks: []
    }
  ]
};

// Global State
let state = loadState();
let selectedTaskId = null;
let draggedTaskId = null;
let selectedModalColor = MONDAY_PALETTE[0];
let activeModalType = 'status'; // 'status' | 'priority'
let selectedNewModalLabelColor = MONDAY_PALETTE[2];
let openLabelColorPickerId = null;

// Members Modal State
let selectedNewMemberColor = MONDAY_PALETTE[4];
let openMemberColorPickerId = null;

// LocalStorage Persistence
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.statusLabels) parsed.statusLabels = INITIAL_DATA.statusLabels;
      if (!parsed.priorityLabels) parsed.priorityLabels = INITIAL_DATA.priorityLabels;
      if (!parsed.members) parsed.members = INITIAL_DATA.members;
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao carregar localStorage", e);
  }
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

// Firebase Cloud Integration Variables
let db = null;
let isFirebaseConnected = false;
let currentUser = null;

// ═══════════════════════════════════════════════════════
// FIREBASE AUTHENTICATION
// ═══════════════════════════════════════════════════════

let authMode = 'login'; // 'login' or 'register'

function switchAuthTab(mode) {
  authMode = mode;
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const nameField = document.getElementById('registerNameField');
  const submitText = document.getElementById('authSubmitText');
  const forgotBtn = document.getElementById('forgotPasswordBtn');

  document.getElementById('loginError')?.classList.add('hidden');
  document.getElementById('loginSuccessMsg')?.classList.add('hidden');

  if (mode === 'login') {
    tabLogin.className = 'flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition text-white bg-white/10';
    tabRegister.className = 'flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition text-gray-400 hover:text-gray-200';
    nameField?.classList.add('hidden');
    if (submitText) submitText.textContent = 'Entrar';
    if (forgotBtn) forgotBtn.style.display = '';
  } else {
    tabRegister.className = 'flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition text-white bg-white/10';
    tabLogin.className = 'flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition text-gray-400 hover:text-gray-200';
    nameField?.classList.remove('hidden');
    if (submitText) submitText.textContent = 'Criar Conta';
    if (forgotBtn) forgotBtn.style.display = 'none';
  }
  if (window.lucide) window.lucide.createIcons();
}

function showAuthError(msg) {
  const el = document.getElementById('loginError');
  const text = document.getElementById('loginErrorText');
  if (el && text) {
    text.textContent = msg;
    el.classList.remove('hidden');
  }
  document.getElementById('loginSuccessMsg')?.classList.add('hidden');
}

function showAuthSuccess(msg) {
  const el = document.getElementById('loginSuccessMsg');
  const text = document.getElementById('loginSuccessText');
  if (el && text) {
    text.textContent = msg;
    el.classList.remove('hidden');
  }
  document.getElementById('loginError')?.classList.add('hidden');
}

function getFirebaseAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está sendo usado por outra conta.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Ative o provedor "E-mail/senha" no Firebase Console > Authentication > Método de login.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
  };
  return messages[code] || 'Erro ao autenticar. Tente novamente.';
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('authEmail')?.value?.trim();
  const password = document.getElementById('authPassword')?.value;
  const name = document.getElementById('authName')?.value?.trim();
  const submitBtn = document.getElementById('authSubmitBtn');

  if (!email || !password) return;

  document.getElementById('loginError')?.classList.add('hidden');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const auth = firebase.auth();

    if (authMode === 'register') {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name && cred.user) {
        await cred.user.updateProfile({ displayName: name });
      }
      showAuthSuccess('Conta criada com sucesso! Entrando...');
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
    // onAuthStateChanged will handle the rest
  } catch (error) {
    showAuthError(getFirebaseAuthErrorMessage(error.code));
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('authEmail')?.value?.trim();
  if (!email) {
    showAuthError('Digite seu e-mail acima para redefinir a senha.');
    return;
  }
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    showAuthSuccess('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
  } catch (error) {
    showAuthError(getFirebaseAuthErrorMessage(error.code));
  }
}

function handleLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    firebase.auth().signOut();
  }
}

function showApp(user) {
  currentUser = user;
  document.getElementById('loginScreen')?.classList.add('hidden');
  const appContent = document.getElementById('appContent');
  if (appContent) {
    appContent.classList.remove('hidden');
    appContent.classList.add('flex', 'flex-col', 'h-screen');
  }

  // Update user badge
  const initials = getInitials(user.displayName || user.email);
  const displayEl = document.getElementById('userInitials');
  const nameEl = document.getElementById('userDisplayName');
  const emailEl = document.getElementById('userDisplayEmail');
  if (displayEl) displayEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];
  if (emailEl) emailEl.textContent = user.email;

  render();
  initFirebase();
  if (window.lucide) window.lucide.createIcons();
}

function hideApp() {
  currentUser = null;
  document.getElementById('loginScreen')?.classList.remove('hidden');
  const appContent = document.getElementById('appContent');
  if (appContent) {
    appContent.classList.add('hidden');
    appContent.classList.remove('flex', 'flex-col');
  }
  if (window.lucide) window.lucide.createIcons();
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getSavedFirebaseConfig() {
  try {
    const fromStorage = localStorage.getItem('firebase_saved_config');
    if (fromStorage) return JSON.parse(fromStorage);
  } catch (e) {}
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.apiKey !== "SUA_API_KEY") {
    return window.FIREBASE_CONFIG;
  }
  return null;
}

function initFirebase() {
  const cfg = getSavedFirebaseConfig();
  if (cfg && cfg.apiKey && cfg.apiKey !== "SUA_API_KEY" && window.firebase) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      db = firebase.firestore();
      updateCloudStatusUI(true);

      // Real-time listener: sync instantly across devices!
      db.collection("boards").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
          const cloudData = doc.data();
          if (cloudData && cloudData.groups) {
            state = cloudData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            render();
          }
        } else {
          db.collection("boards").doc("main").set(state);
        }
      }, (err) => {
        console.warn("Aviso Firestore:", err);
        updateCloudStatusUI(false);
      });
    } catch (e) {
      console.warn("Erro ao inicializar Firebase:", e);
      updateCloudStatusUI(false);
    }
  } else {
    updateCloudStatusUI(false);
  }
}

function updateCloudStatusUI(connected) {
  isFirebaseConnected = connected;
  const dot = document.getElementById("cloudStatusDot");
  const text = document.getElementById("cloudStatusText");
  const btn = document.getElementById("cloudStatusBtn");

  if (connected) {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm";
    if (text) text.textContent = "Nuvem Sincronizada";
    if (btn) btn.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";
  } else {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
    if (text) text.textContent = "Modo Local";
    if (btn) btn.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-sm bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100";
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (db && isFirebaseConnected) {
      db.collection("boards").doc("main").set(state).catch(e => console.warn("Erro ao salvar no Firestore:", e));
    }
  } catch (e) {
    console.error("Erro ao salvar", e);
  }
}

// Helpers
function getStatusConfig(statusName) {
  const found = state.statusLabels.find(s => s.label === statusName);
  if (found) return found;
  return { label: statusName || "Não iniciado", bg: "#94a3b8", text: "#ffffff", icon: "minus" };
}

function getPriorityConfig(priorityName) {
  const found = state.priorityLabels.find(p => p.label === priorityName);
  if (found) return found;
  return { label: priorityName || "-", bg: "#94a3b8", text: "#ffffff" };
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${monthNames[mIndex] || parts[1]} ${day}`;
}

function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return "—";
  return "$" + Number(num).toLocaleString('pt-BR');
}

// Global click dismiss for popups
document.addEventListener("click", (e) => {
  const portal = document.getElementById("dropdownPortal");
  if (portal && !e.target.closest(".popup-menu") && !e.target.closest("[data-popup-trigger]")) {
    portal.innerHTML = "";
    portal.classList.add("pointer-events-none");
  }
  
  const filterBtn = document.getElementById("filterDropdownBtn");
  const filterMenu = document.getElementById("filterDropdownMenu");
  if (filterBtn && filterMenu && !filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
    filterMenu.classList.add("hidden");
  }
});

// View Switching
function switchView(viewName) {
  state.currentView = viewName;
  saveState();
  
  document.querySelectorAll(".view-tab").forEach(tab => tab.classList.remove("active"));
  if (viewName === "table") document.getElementById("viewTabTable")?.classList.add("active");
  if (viewName === "kanban") document.getElementById("viewTabKanban")?.classList.add("active");
  if (viewName === "calendar") document.getElementById("viewTabCalendar")?.classList.add("active");

  // Update Mobile Bottom Nav Tabs
  const mobileTabs = {
    table: document.getElementById("bottomTabTable"),
    kanban: document.getElementById("bottomTabKanban"),
    calendar: document.getElementById("bottomTabCalendar")
  };
  Object.entries(mobileTabs).forEach(([key, btn]) => {
    if (!btn) return;
    if (key === viewName) {
      btn.classList.add("active", "text-[#0073ea]");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("active", "text-[#0073ea]");
      btn.classList.add("text-gray-400");
    }
  });

  closeMobileSidebar();
  render();
}

function findTask(taskId) {
  for (const group of state.groups) {
    const task = group.tasks.find(t => t.id === taskId);
    if (task) return { task, group };
  }
  return { task: null, group: null };
}

// -------------------------------------------------------------
// MAIN RENDER FUNCTION
// -------------------------------------------------------------
function render() {
  const container = document.getElementById("viewContainer");
  if (!container) return;

  renderSidebarGroups();

  if (state.currentView === "table") {
    container.innerHTML = renderTableView();
  } else if (state.currentView === "kanban") {
    container.innerHTML = renderKanbanView();
  } else if (state.currentView === "calendar") {
    container.innerHTML = renderCalendarView();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSidebarGroups() {
  const sidebar = document.getElementById("sidebarGroupsList");
  if (!sidebar) return;

  sidebar.innerHTML = state.groups.map(g => `
    <div class="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer transition group"
      onclick="scrollToGroup('${g.id}')">
      <div class="flex items-center space-x-2.5 truncate">
        <span class="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${g.color};"></span>
        <span class="truncate">${g.name}</span>
      </div>
      <span class="text-xs text-gray-400 group-hover:text-gray-600 font-semibold">${g.tasks.length}</span>
    </div>
  `).join('');
}

function scrollToGroup(groupId) {
  if (state.currentView !== "table") {
    switchView("table");
  }
  setTimeout(() => {
    const el = document.querySelector(`[data-group-id="${groupId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

// -------------------------------------------------------------
// TABLE VIEW RENDERER (ENHANCED SCALE & READABILITY)
// -------------------------------------------------------------
function renderTableView() {
  let html = `<div class="space-y-6 pb-24">`;

  state.groups.forEach(group => {
    const isCollapsed = group.collapsed;
    const tasksCount = group.tasks.length;
    const countLabel = tasksCount === 0 ? "Sem tarefas" : `${tasksCount} tarefa${tasksCount > 1 ? 's' : ''}`;

    const filteredTasks = group.tasks.filter(task => {
      const matchSearch = !state.searchQuery || 
        task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        task.status.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchStatus = state.filterStatus === "ALL" || task.status === state.filterStatus;
      return matchSearch && matchStatus;
    });

    html += `
      <div class="group-container bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" data-group-id="${group.id}">
        <!-- Group Header Card -->
        <div class="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100">
          <div class="flex items-center space-x-3">
            <button onclick="toggleGroupCollapse('${group.id}')" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
              <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-4 h-4"></i>
            </button>
            
            <div class="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition shadow-sm border border-black/10" 
              style="background-color: ${group.color};" 
              data-popup-trigger
              onclick="openGroupColorPicker(event, '${group.id}')" 
              title="Mudar cor do grupo"></div>

            <span id="group-title-${group.id}" 
              class="text-base font-extrabold cursor-pointer hover:bg-gray-100 px-2.5 py-1 rounded-xl transition" 
              style="color: ${group.color};" 
              onclick="makeGroupTitleEditable('${group.id}')" 
              title="Clique para editar o nome">${group.name}</span>

            <span class="text-xs text-gray-400 font-semibold">(${countLabel})</span>
          </div>

          <div class="flex items-center space-x-2">
            <button onclick="quickAddTask('${group.id}', 'Nova Tarefa')" class="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-[#0073ea] bg-blue-50 hover:bg-blue-100 rounded-xl transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Adicionar Tarefa</span>
            </button>

            <button onclick="duplicateGroup('${group.id}')" class="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition" title="Duplicar grupo">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>

            <button onclick="deleteGroup('${group.id}')" class="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition" title="Excluir grupo">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        ${isCollapsed ? '' : `
          <!-- Table with Large Rounded Elements -->
          <div class="overflow-x-auto">
            <table class="monday-table">
              <thead>
                <tr class="bg-gray-50/60">
                  <th class="w-12 monday-cell-header text-center" style="border-left: 4px solid ${group.color};">
                    <input type="checkbox" class="rounded-md border-gray-300 text-[#0073ea] focus:ring-0 cursor-pointer">
                  </th>
                  <th class="monday-cell-header text-left pl-5 min-w-[220px]">Tarefa / Pedido</th>
                  <th class="w-36 monday-cell-header">Responsável</th>
                  <th class="w-40 monday-cell-header">Status</th>
                  <th class="w-36 monday-cell-header">Prazo</th>
                  <th class="w-36 monday-cell-header">Prioridade</th>
                  <th class="w-32 monday-cell-header">Orçamento</th>
                  <th class="w-40 monday-cell-header">Cronograma</th>
                  <th class="w-36 monday-cell-header text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTasks.map(task => renderTableRow(task, group)).join('')}

                <!-- Quick Add Task Row -->
                <tr class="monday-row bg-white hover:bg-gray-50/70">
                  <td class="monday-cell" style="border-left: 4px solid ${group.color};"></td>
                  <td class="monday-cell text-left pl-5" colspan="8">
                    <input type="text" placeholder="+ Adicionar nova tarefa neste grupo (pressione Enter)" 
                      class="w-full text-xs py-2 bg-transparent border-none focus:outline-none text-gray-700 placeholder-gray-400 font-semibold"
                      onkeydown="if(event.key==='Enter') { quickAddTask('${group.id}', this.value); this.value=''; }">
                  </td>
                </tr>

                <!-- Group Summary Footer Row -->
                ${renderTableSummaryRow(group, filteredTasks)}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  });

  // Action Button at the bottom of the board
  html += `
    <div class="pt-4 flex items-center justify-between">
      <button onclick="openCreateGroupModal()" class="flex items-center space-x-2 px-5 py-3 text-sm font-bold text-white bg-[#0073ea] hover:bg-[#0060b9] rounded-2xl shadow-sm transition">
        <i data-lucide="folder-plus" class="w-5 h-5"></i>
        <span>+ Adicionar Novo Grupo de Tarefas</span>
      </button>

      <div class="text-xs text-gray-400 font-semibold">
        ${state.groups.length} grupo(s) cadastrado(s)
      </div>
    </div>
  </div>`;

  return html;
}

// Render individual row
function renderTableRow(task, group) {
  const statusCfg = getStatusConfig(task.status);
  const priorityCfg = getPriorityConfig(task.priority);
  const member = state.members.find(m => m.id === task.assigneeId);
  
  let timelineLabel = "—";
  if (task.timeline && task.timeline.start) {
    const s = formatDateDisplay(task.timeline.start);
    const e = task.timeline.end ? formatDateDisplay(task.timeline.end) : "...";
    timelineLabel = `${s} - ${e}`;
  }

  return `
    <tr class="monday-row bg-white" data-task-id="${task.id}">
      <td class="monday-cell text-center" style="border-left: 4px solid ${group.color};">
        <input type="checkbox" class="rounded-md border-gray-300 text-[#0073ea] focus:ring-0 cursor-pointer">
      </td>

      <td class="monday-cell text-left px-5">
        <div class="flex items-center justify-between">
          <span id="task-title-${task.id}" 
            class="text-sm font-bold text-gray-900 truncate cursor-pointer hover:text-[#0073ea] py-1 block flex-1" 
            onclick="makeTaskTitleEditable('${task.id}')" 
            title="Clique para editar">${task.title}</span>
          <button class="cell-chat-btn opacity-0 hover:opacity-100 text-gray-400 hover:text-[#0073ea] p-1.5 rounded-xl transition" 
            onclick="openTaskDrawer('${task.id}')" title="Abrir detalhes">
            <i data-lucide="message-square" class="w-4 h-4"></i>
          </button>
        </div>
      </td>

      <td class="monday-cell" data-popup-trigger onclick="openAssigneePicker(event, '${task.id}')">
        <div class="flex items-center justify-center cursor-pointer w-full h-full">
          ${member ? `
            <div class="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-100">
              <div class="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0" style="background-color: ${member.color};">
                ${member.initials}
              </div>
              <span class="text-xs font-bold text-gray-800 truncate max-w-[90px]">${member.name.split(" ")[0]}</span>
            </div>
          ` : `
            <div class="w-8 h-8 rounded-full border border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-gray-500">
              <i data-lucide="user" class="w-4 h-4"></i>
            </div>
          `}
        </div>
      </td>

      <!-- Rounded Status Pill (Larger) -->
      <td class="monday-cell" data-popup-trigger onclick="openStatusPicker(event, '${task.id}')">
        <div class="rounded-status-pill mx-auto" style="background-color: ${statusCfg.bg}; color: ${statusCfg.text};" title="${statusCfg.label}">
          <span class="truncate">${statusCfg.label}</span>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-90 flex-shrink-0"></i>
        </div>
      </td>

      <!-- Rounded Date Pill -->
      <td class="monday-cell" data-popup-trigger onclick="openDatePicker(event, '${task.id}')">
        <div class="rounded-date-pill mx-auto">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-gray-400"></i>
          <span>${formatDateDisplay(task.dueDate)}</span>
        </div>
      </td>

      <!-- Rounded Priority Pill (Larger) -->
      <td class="monday-cell" data-popup-trigger onclick="openPriorityPicker(event, '${task.id}')">
        <div class="rounded-priority-pill mx-auto" style="background-color: ${priorityCfg.bg}; color: ${priorityCfg.text};" title="${priorityCfg.label}">
          <span class="truncate">${priorityCfg.label}</span>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-90 flex-shrink-0"></i>
        </div>
      </td>

      <!-- Budget (Larger Font) -->
      <td class="monday-cell" id="task-budget-cell-${task.id}" onclick="makeTaskBudgetEditable('${task.id}')">
        <div class="text-sm font-bold text-gray-900 cursor-pointer hover:bg-gray-100 py-1 px-3 rounded-xl inline-block">
          ${formatCurrency(task.budget)}
        </div>
      </td>

      <!-- Timeline Pill -->
      <td class="monday-cell" data-popup-trigger onclick="openTimelinePicker(event, '${task.id}')">
        <div class="rounded-timeline-pill mx-auto" style="background-color: ${statusCfg.bg};">
          <span class="truncate px-2">${timelineLabel}</span>
        </div>
      </td>

      <!-- Actions (Editar, Excluir Buttons) -->
      <td class="monday-cell text-center">
        <div class="flex items-center justify-center space-x-1.5">
          <button class="action-btn-pill" onclick="openTaskDrawer('${task.id}')" title="Editar detalhes">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-gray-500"></i>
            <span>Editar</span>
          </button>
          <button class="action-btn-pill danger" onclick="deleteTask('${task.id}')" title="Excluir tarefa">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Excluir</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderTableSummaryRow(group, tasks) {
  const totalTasks = tasks.length;
  const statusCounts = {};
  let totalBudget = 0;

  tasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    totalBudget += (Number(t.budget) || 0);
  });

  return `
    <tr class="bg-gray-50/70 text-xs font-semibold text-gray-500 border-t-2 border-gray-200">
      <td class="monday-cell" style="border-left: 4px solid ${group.color};"></td>
      <td class="monday-cell text-left pl-5 font-bold text-gray-600">Total / Resumo</td>
      <td class="monday-cell"></td>

      <td class="monday-cell p-2">
        ${totalTasks > 0 ? `
          <div class="flex h-4 rounded-full overflow-hidden shadow-inner bg-gray-200">
            ${state.statusLabels.map(s => {
              const count = statusCounts[s.label] || 0;
              if (count === 0) return '';
              const pct = (count / totalTasks) * 100;
              return `<div class="summary-bar-segment" style="width: ${pct}%; background-color: ${s.bg};" title="${s.label}: ${count} (${Math.round(pct)}%)"></div>`;
            }).join('')}
          </div>
        ` : `<div class="h-2.5 bg-gray-200 rounded-full mx-2"></div>`}
      </td>

      <td class="monday-cell"></td>

      <td class="monday-cell p-2">
        ${totalTasks > 0 ? `
          <div class="flex h-4 rounded-full overflow-hidden shadow-inner bg-gray-200">
            ${state.priorityLabels.map(p => {
              const count = tasks.filter(t => t.priority === p.label).length;
              if (count === 0) return '';
              const pct = (count / totalTasks) * 100;
              return `<div class="summary-bar-segment" style="width: ${pct}%; background-color: ${p.bg};" title="${p.label}: ${count}"></div>`;
            }).join('')}
          </div>
        ` : '-'}
      </td>

      <td class="monday-cell font-black text-sm text-gray-900">
        <div>${totalBudget > 0 ? formatCurrency(totalBudget) : '$0'}</div>
      </td>

      <td class="monday-cell"></td>
      <td class="monday-cell"></td>
    </tr>
  `;
}

// -------------------------------------------------------------
// KANBAN VIEW RENDERER
// -------------------------------------------------------------
function renderKanbanView() {
  const allTasks = [];
  state.groups.forEach(g => {
    g.tasks.forEach(t => allTasks.push({ task: t, group: g }));
  });

  return `
    <div class="flex space-x-5 overflow-x-auto pb-6 h-full items-start">
      ${state.statusLabels.map(sLabel => {
        const colTasks = allTasks.filter(item => {
          const matchSearch = !state.searchQuery || item.task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
          return item.task.status === sLabel.label && matchSearch;
        });

        return `
          <div class="kanban-column flex-1 flex flex-col p-4 shadow-sm" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${sLabel.label}')">
            <!-- Column Header -->
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
              <div class="flex items-center space-x-2.5">
                <span class="w-4 h-4 rounded-full shadow-sm" style="background-color: ${sLabel.bg};"></span>
                <h3 class="text-sm font-extrabold text-gray-800 truncate max-w-[160px]">${sLabel.label}</h3>
                <span class="text-xs bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">${colTasks.length}</span>
              </div>
              <button onclick="quickAddTaskToStatus('${sLabel.label}')" class="text-gray-400 hover:text-[#0073ea] p-1.5 rounded-xl hover:bg-gray-200 transition" title="Adicionar tarefa neste status">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Cards Drop Zone -->
            <div class="kanban-drop-zone space-y-3 flex-1 min-h-[300px]">
              ${colTasks.map(item => renderKanbanCard(item.task, item.group)).join('')}
            </div>

            <!-- Add Card Button -->
            <button onclick="quickAddTaskToStatus('${sLabel.label}')" class="mt-3.5 w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:text-[#0073ea] hover:border-[#0073ea] bg-white transition flex items-center justify-center space-x-2 shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Adicionar tarefa</span>
            </button>
          </div>
        `;
      }).join('')}

      <!-- Add New Status Column in Kanban -->
      <div class="min-w-[240px] flex-shrink-0">
        <button onclick="openManageLabelsModal('status')" class="w-full py-5 px-4 border-2 border-dashed border-gray-300 rounded-2xl text-xs font-extrabold text-gray-600 hover:border-[#0073ea] hover:text-[#0073ea] bg-white/80 transition flex items-center justify-center space-x-2 shadow-sm">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Gerenciar Colunas de Status</span>
        </button>
      </div>
    </div>
  `;
}

function renderKanbanCard(task, group) {
  const member = state.members.find(m => m.id === task.assigneeId);
  const priorityCfg = getPriorityConfig(task.priority);

  return `
    <div class="kanban-card p-4" draggable="true" ondragstart="handleDragStart(event, '${task.id}')" ondragend="handleDragEnd(event)">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white truncate max-w-[190px] shadow-sm" style="background-color: ${group.color};">
          ${group.name}
        </span>
        <button onclick="openTaskDrawer('${task.id}')" class="text-gray-400 hover:text-[#0073ea] p-1 rounded-lg">
          <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <div class="text-sm font-bold text-gray-900 mb-3 cursor-pointer hover:text-[#0073ea]" onclick="openTaskDrawer('${task.id}')">
        ${task.title}
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
        <div class="flex items-center space-x-2">
          ${member ? `
            <div class="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style="background-color: ${member.color};" title="${member.name}">
              ${member.initials}
            </div>
          ` : `
            <span class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 text-xs"><i data-lucide="user" class="w-3.5 h-3.5"></i></span>
          `}
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white" style="background-color: ${priorityCfg.bg};">
            ${priorityCfg.label}
          </span>
        </div>

        <div class="text-gray-700 text-xs font-bold">
          ${formatCurrency(task.budget)}
        </div>
      </div>
    </div>
  `;
}

// Kanban Drag and Drop
function handleDragStart(e, taskId) {
  draggedTaskId = taskId;
  e.dataTransfer.setData("text/plain", taskId);
  e.target.classList.add("dragging");
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  document.querySelectorAll(".kanban-drop-zone").forEach(z => z.classList.remove("drag-over"));
}

function handleDragOver(e) {
  e.preventDefault();
  const zone = e.currentTarget.querySelector(".kanban-drop-zone");
  if (zone) zone.classList.add("drag-over");
}

function handleDrop(e, newStatus) {
  e.preventDefault();
  document.querySelectorAll(".kanban-drop-zone").forEach(z => z.classList.remove("drag-over"));
  if (!draggedTaskId) return;

  const { task } = findTask(draggedTaskId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveState();
    render();
  }
  draggedTaskId = null;
}

// -------------------------------------------------------------
// CALENDAR VIEW RENDERER
// -------------------------------------------------------------
function renderCalendarView() {
  const calDate = new Date(state.calendarDate);
  const currentMonth = calDate.getMonth();
  const currentYear = calDate.getFullYear();
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const tasksByDate = {};
  state.groups.forEach(g => {
    g.tasks.forEach(t => {
      if (t.dueDate) {
        tasksByDate[t.dueDate] = tasksByDate[t.dueDate] || [];
        tasksByDate[t.dueDate].push({ task: t, group: g });
      }
    });
  });

  let html = `
    <div class="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col" style="height: calc(100vh - 180px);">
      <div class="flex items-center justify-between pb-3 border-b border-gray-100 mb-2 flex-shrink-0">
        <div class="flex items-center space-x-3">
          <h2 class="text-base sm:text-lg font-black text-gray-900">${monthNames[currentMonth]} ${currentYear}</h2>
          <button onclick="changeCalendarMonth(0)" class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700 font-bold transition">Hoje</button>
        </div>
        <div class="flex items-center space-x-1.5">
          <button onclick="changeCalendarMonth(-1)" class="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <button onclick="changeCalendarMonth(1)" class="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 text-center py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 flex-shrink-0">
        ${weekDays.map(d => `<div>${d}</div>`).join('')}
      </div>

      <div class="calendar-grid flex-1 min-h-0">
  `;

  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    html += `<div class="calendar-cell other-month"><span class="text-xs text-gray-400 font-semibold">${dayNum}</span></div>`;
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
    const dayTasks = tasksByDate[dateKey] || [];

    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;

    html += `
      <div class="calendar-cell ${isToday ? 'is-today' : ''}" onclick="quickAddTaskOnDate('${dateKey}')">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold ${isToday ? 'bg-[#0073ea] text-white px-2.5 py-0.5 rounded-full shadow-sm' : 'text-gray-700'}">${day}</span>
          ${dayTasks.length > 0 ? `<span class="text-[11px] text-gray-400 font-bold">${dayTasks.length}</span>` : ''}
        </div>
        <div class="flex-1 overflow-y-auto mt-1 space-y-1">
          ${dayTasks.map(item => {
            const sCfg = getStatusConfig(item.task.status);
            return `
              <div class="calendar-task-pill" style="background-color: ${sCfg.bg};" 
                onclick="event.stopPropagation(); openTaskDrawer('${item.task.id}')" title="${item.task.title}">
                ${item.task.title}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

function changeCalendarMonth(offset) {
  const current = new Date(state.calendarDate);
  if (offset === 0) {
    state.calendarDate = new Date().toISOString().split("T")[0];
  } else {
    current.setMonth(current.getMonth() + offset);
    state.calendarDate = current.toISOString().split("T")[0];
  }
  saveState();
  render();
}

// -------------------------------------------------------------
// SMART POSITIONED QUICK SELECTION DROPDOWNS
// -------------------------------------------------------------

function showPortalPopup(e, contentHtml, expectedHeight = 250) {
  const portal = document.getElementById("dropdownPortal");
  if (!portal) return;

  const rect = e.currentTarget.getBoundingClientRect();
  
  let top = rect.bottom + 6;
  if (top + expectedHeight > window.innerHeight) {
    top = Math.max(10, rect.top - expectedHeight - 6);
  }

  let left = rect.left;
  if (left + 260 > window.innerWidth) {
    left = Math.max(10, window.innerWidth - 270);
  }

  portal.classList.remove("pointer-events-none");
  portal.innerHTML = `
    <div class="popup-menu" style="top: ${top}px; left: ${left}px;">
      ${contentHtml}
    </div>
  `;
}

// Status Quick Selector Dropdown
function openStatusPicker(e, taskId) {
  e.stopPropagation();
  const { task } = findTask(taskId);

  let html = `<div class="p-3 space-y-1.5" style="width: 250px;">`;
  html += `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Selecionar Status</div>`;

  state.statusLabels.forEach(s => {
    html += `
      <button class="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold text-white hover:brightness-105 transition shadow-sm"
        style="background-color: ${s.bg};"
        onclick="setStatus('${taskId}', '${s.label}')">
        <div class="flex items-center space-x-2 truncate">
          <i data-lucide="${s.icon || 'check'}" class="w-4 h-4"></i>
          <span class="truncate">${s.label}</span>
        </div>
        ${task && task.status === s.label ? '<i data-lucide="check" class="w-4 h-4 flex-shrink-0"></i>' : ''}
      </button>
    `;
  });

  html += `
    <div class="pt-2 border-t border-gray-100">
      <button onclick="openManageLabelsModal('status')" 
        class="w-full flex items-center justify-center space-x-1.5 py-2 text-xs text-gray-700 hover:text-[#0073ea] hover:bg-blue-50 rounded-xl transition font-bold">
        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
        <span>Editar rótulos / Criar novo</span>
      </button>
    </div>
  `;
  html += `</div>`;

  const expectedHeight = (state.statusLabels.length * 36) + 70;
  showPortalPopup(e, html, expectedHeight);
  if (window.lucide) window.lucide.createIcons();
}

function setStatus(taskId, newStatus) {
  const { task } = findTask(taskId);
  if (task) {
    task.status = newStatus;
    saveState();
    render();
    if (selectedTaskId === taskId) updateDrawerContent(task);
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// Priority Quick Selector Dropdown
function openPriorityPicker(e, taskId) {
  e.stopPropagation();
  const { task } = findTask(taskId);

  let html = `<div class="p-3 space-y-1.5" style="width: 250px;">`;
  html += `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Selecionar Prioridade</div>`;

  state.priorityLabels.forEach(p => {
    html += `
      <button class="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold text-white hover:brightness-105 transition shadow-sm"
        style="background-color: ${p.bg};"
        onclick="setPriority('${taskId}', '${p.label}')">
        <span class="truncate">${p.label}</span>
        ${task && task.priority === p.label ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
      </button>
    `;
  });

  html += `
    <div class="pt-2 border-t border-gray-100">
      <button onclick="openManageLabelsModal('priority')" 
        class="w-full flex items-center justify-center space-x-1.5 py-2 text-xs text-gray-700 hover:text-[#0073ea] hover:bg-blue-50 rounded-xl transition font-bold">
        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
        <span>Editar prioridades</span>
      </button>
    </div>
  `;
  html += `</div>`;

  const expectedHeight = (state.priorityLabels.length * 36) + 70;
  showPortalPopup(e, html, expectedHeight);
  if (window.lucide) window.lucide.createIcons();
}

function setPriority(taskId, newPriority) {
  const { task } = findTask(taskId);
  if (task) {
    task.priority = newPriority;
    saveState();
    render();
    if (selectedTaskId === taskId) updateDrawerContent(task);
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// Assignee Quick Selector Dropdown
function openAssigneePicker(e, taskId) {
  e.stopPropagation();
  const { task } = findTask(taskId);
  if (!task) return;

  let html = `
    <div class="p-3 space-y-1.5" style="width: 260px;">
      <div class="flex items-center justify-between px-2 mb-1">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atribuir Responsável</span>
        <button onclick="openManageMembersModal()" class="text-[11px] font-bold text-[#0073ea] hover:underline" title="Editar responsáveis">
          Editar equipe
        </button>
      </div>

      <button class="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center space-x-2.5 text-xs text-gray-500 font-semibold"
        onclick="setAssignee('${taskId}', null)">
        <div class="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center"><i data-lucide="x" class="w-3 h-3"></i></div>
        <span>Nenhum responsável</span>
      </button>

      ${state.members.map(m => `
        <div class="flex items-center justify-between p-1 rounded-xl hover:bg-gray-100 group">
          <button class="flex-1 text-left px-2 py-1.5 flex items-center space-x-2.5 text-xs text-gray-800 font-bold truncate"
            onclick="setAssignee('${taskId}', '${m.id}')">
            <div class="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0 shadow-sm" style="background-color: ${m.color};">
              ${m.initials}
            </div>
            <span class="truncate">${m.name}</span>
          </button>
          ${task.assigneeId === m.id ? '<i data-lucide="check" class="w-4 h-4 text-[#0073ea] mr-2"></i>' : ''}
        </div>
      `).join('')}

      <div class="pt-2 border-t border-gray-100 flex flex-col space-y-1">
        <button class="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-xs text-[#0073ea] font-extrabold flex items-center space-x-2"
          onclick="openManageMembersModal()">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>+ Convidar / Editar membros</span>
        </button>
      </div>
    </div>
  `;

  const expectedHeight = (state.members.length * 40) + 110;
  showPortalPopup(e, html, expectedHeight);
  if (window.lucide) window.lucide.createIcons();
}

function setAssignee(taskId, memberId) {
  const { task } = findTask(taskId);
  if (task) {
    task.assigneeId = memberId;
    saveState();
    render();
    if (selectedTaskId === taskId) updateDrawerContent(task);
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// -------------------------------------------------------------
// DEDICATED MEMBERS MANAGEMENT MODAL
// -------------------------------------------------------------

function openManageMembersModal() {
  openMemberColorPickerId = null;

  // Close portal
  const portal = document.getElementById("dropdownPortal");
  if (portal) {
    portal.innerHTML = "";
    portal.classList.add("pointer-events-none");
  }

  const modal = document.getElementById("membersModal");
  if (!modal) return;

  selectedNewMemberColor = MONDAY_PALETTE[Math.floor(Math.random() * MONDAY_PALETTE.length)];
  updateNewMemberModalColorPreview();
  renderMembersModalContent();

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeManageMembersModal() {
  document.getElementById("membersModal")?.classList.add("hidden");
  openMemberColorPickerId = null;
  saveState();
  render();
}

function updateNewMemberModalColorPreview() {
  const prev = document.getElementById("modalNewMemberColorPreview");
  if (prev) {
    prev.style.backgroundColor = selectedNewMemberColor;
  }
  const pal = document.getElementById("modalNewMemberColorPalette");
  if (pal) {
    pal.innerHTML = MONDAY_PALETTE.map(c => `
      <div class="color-swatch ${selectedNewMemberColor === c ? 'active' : ''}" 
        style="background-color: ${c};" 
        onclick="selectNewMemberColor('${c}')"></div>
    `).join('');
  }
}

function selectNewMemberColor(color) {
  selectedNewMemberColor = color;
  updateNewMemberModalColorPreview();
}

function updateNewMemberAvatarPreview(name) {
  const prev = document.getElementById("modalNewMemberColorPreview");
  if (!prev) return;
  if (!name || !name.trim()) {
    prev.textContent = "?";
    return;
  }
  const initials = name.trim().split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
  prev.textContent = initials;
}

function renderMembersModalContent() {
  const container = document.getElementById("membersModalList");
  if (!container) return;

  container.innerHTML = state.members.map(m => `
    <div class="bg-gray-50 border border-gray-200 rounded-2xl p-3">
      <div class="flex items-center space-x-3">
        <!-- Avatar with color change trigger -->
        <div class="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:scale-110 transition flex-shrink-0 shadow-sm border border-black/10" 
          style="background-color: ${m.color};" 
          onclick="toggleMemberInlineColorPicker('${m.id}')"
          title="Clique para alterar a cor do avatar">
          ${m.initials}
        </div>

        <!-- Member Name Input -->
        <input type="text" value="${m.name}" 
          class="flex-1 text-sm font-bold px-3 py-1.5 border border-gray-300 rounded-xl focus:border-[#0073ea] focus:outline-none bg-white"
          onchange="renameMember('${m.id}', this.value)"
          placeholder="Nome do responsável...">

        <!-- Delete button -->
        <button onclick="deleteMember('${m.id}')" class="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition" title="Remover responsável">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Inline Color Palette for member -->
      ${openMemberColorPickerId === m.id ? `
        <div class="mt-3 pt-2.5 border-t border-gray-200">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Escolha a cor do avatar:</span>
          <div class="grid grid-cols-8 gap-2">
            ${MONDAY_PALETTE.map(c => `
              <div class="color-swatch ${m.color === c ? 'active' : ''}" 
                style="background-color: ${c};" 
                onclick="setMemberColor('${m.id}', '${c}')"></div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function toggleMemberInlineColorPicker(memberId) {
  openMemberColorPickerId = openMemberColorPickerId === memberId ? null : memberId;
  renderMembersModalContent();
}

function setMemberColor(memberId, color) {
  const m = state.members.find(x => x.id === memberId);
  if (m) {
    m.color = color;
    saveState();
    renderMembersModalContent();
  }
}

function renameMember(memberId, newName) {
  if (!newName || !newName.trim()) return;
  const m = state.members.find(x => x.id === memberId);
  if (!m) return;

  m.name = newName.trim();
  m.initials = m.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
  saveState();
  renderMembersModalContent();
}

function deleteMember(memberId) {
  if (state.members.length <= 1) {
    alert("Deve haver pelo menos um membro cadastrado.");
    return;
  }
  if (!confirm("Remover este responsável da equipe? Tarefas atribuídas a ele ficarão sem responsável.")) return;

  state.members = state.members.filter(x => x.id !== memberId);
  
  // Unassign in tasks
  state.groups.forEach(g => {
    g.tasks.forEach(t => {
      if (t.assigneeId === memberId) t.assigneeId = null;
    });
  });

  saveState();
  renderMembersModalContent();
}

function confirmAddNewMemberFromModal() {
  const input = document.getElementById("modalNewMemberNameInput");
  const name = input?.value?.trim();
  if (!name) return;

  const initials = name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
  const newMember = {
    id: "user-" + Date.now(),
    name: name,
    initials: initials,
    color: selectedNewMemberColor
  };

  state.members.push(newMember);
  input.value = "";
  document.getElementById("modalNewMemberColorPreview").textContent = "?";
  selectedNewMemberColor = MONDAY_PALETTE[Math.floor(Math.random() * MONDAY_PALETTE.length)];
  updateNewMemberModalColorPreview();
  saveState();
  renderMembersModalContent();
}

// -------------------------------------------------------------
// DEDICATED LABELS MODAL (STATUS & PRIORIDADES)
// -------------------------------------------------------------

function openManageLabelsModal(type = 'status') {
  activeModalType = type;
  openLabelColorPickerId = null;

  const portal = document.getElementById("dropdownPortal");
  if (portal) {
    portal.innerHTML = "";
    portal.classList.add("pointer-events-none");
  }

  const modal = document.getElementById("labelsModal");
  const titleEl = document.getElementById("labelsModalTitle");
  if (!modal || !titleEl) return;

  titleEl.textContent = type === 'status' ? "Gerenciar Etiquetas de Status" : "Gerenciar Etiquetas de Prioridade";

  selectedNewModalLabelColor = MONDAY_PALETTE[Math.floor(Math.random() * MONDAY_PALETTE.length)];
  updateNewModalColorPreview();
  renderLabelsModalContent();

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeManageLabelsModal() {
  document.getElementById("labelsModal")?.classList.add("hidden");
  openLabelColorPickerId = null;
  saveState();
  render();
}

function updateNewModalColorPreview() {
  const prev = document.getElementById("modalNewColorPreview");
  if (prev) {
    prev.style.backgroundColor = selectedNewModalLabelColor;
  }
  const pal = document.getElementById("modalNewColorPalette");
  if (pal) {
    pal.innerHTML = MONDAY_PALETTE.map(c => `
      <div class="color-swatch ${selectedNewModalLabelColor === c ? 'active' : ''}" 
        style="background-color: ${c};" 
        onclick="selectNewModalColor('${c}')"></div>
    `).join('');
  }
}

function selectNewModalColor(color) {
  selectedNewModalLabelColor = color;
  updateNewModalColorPreview();
}

function renderLabelsModalContent() {
  const container = document.getElementById("labelsModalList");
  if (!container) return;

  const list = activeModalType === 'status' ? state.statusLabels : state.priorityLabels;

  container.innerHTML = list.map(item => `
    <div class="bg-gray-50 border border-gray-200 rounded-2xl p-3">
      <div class="flex items-center space-x-3">
        <div class="w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition flex-shrink-0 shadow-sm border border-black/10" 
          style="background-color: ${item.bg};" 
          onclick="toggleLabelInlineColorPicker('${item.id}')"
          title="Clique para mudar a cor desta etiqueta"></div>

        <input type="text" value="${item.label}" 
          class="flex-1 text-sm font-bold px-3 py-1.5 border border-gray-300 rounded-xl focus:border-[#0073ea] focus:outline-none bg-white"
          onchange="renameModalLabel('${item.id}', this.value)">

        <button onclick="deleteModalLabel('${item.id}')" class="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition" title="Excluir etiqueta">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>

      ${openLabelColorPickerId === item.id ? `
        <div class="mt-3 pt-2.5 border-t border-gray-200">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Escolha a cor:</span>
          <div class="grid grid-cols-8 gap-2">
            ${MONDAY_PALETTE.map(c => `
              <div class="color-swatch ${item.bg === c ? 'active' : ''}" 
                style="background-color: ${c};" 
                onclick="setModalItemColor('${item.id}', '${c}')"></div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function toggleLabelInlineColorPicker(labelId) {
  openLabelColorPickerId = openLabelColorPickerId === labelId ? null : labelId;
  renderLabelsModalContent();
}

function setModalItemColor(labelId, color) {
  const list = activeModalType === 'status' ? state.statusLabels : state.priorityLabels;
  const item = list.find(x => x.id === labelId);
  if (item) {
    item.bg = color;
    saveState();
    renderLabelsModalContent();
  }
}

function renameModalLabel(labelId, newName) {
  if (!newName || !newName.trim()) return;
  const list = activeModalType === 'status' ? state.statusLabels : state.priorityLabels;
  const item = list.find(x => x.id === labelId);
  if (!item) return;

  const oldName = item.label;
  item.label = newName.trim();

  state.groups.forEach(g => {
    g.tasks.forEach(t => {
      if (activeModalType === 'status' && t.status === oldName) t.status = item.label;
      if (activeModalType === 'priority' && t.priority === oldName) t.priority = item.label;
    });
  });

  saveState();
}

function deleteModalLabel(labelId) {
  const list = activeModalType === 'status' ? state.statusLabels : state.priorityLabels;
  if (list.length <= 1) {
    alert("Deve haver pelo menos uma etiqueta.");
    return;
  }
  const toDelete = list.find(x => x.id === labelId);
  if (!toDelete) return;

  if (activeModalType === 'status') {
    state.statusLabels = state.statusLabels.filter(x => x.id !== labelId);
    const fallback = state.statusLabels[0].label;
    state.groups.forEach(g => g.tasks.forEach(t => { if (t.status === toDelete.label) t.status = fallback; }));
  } else {
    state.priorityLabels = state.priorityLabels.filter(x => x.id !== labelId);
    const fallback = state.priorityLabels[0].label;
    state.groups.forEach(g => g.tasks.forEach(t => { if (t.priority === toDelete.label) t.priority = fallback; }));
  }

  saveState();
  renderLabelsModalContent();
}

function confirmAddNewLabelFromModal() {
  const input = document.getElementById("modalNewNameInput");
  const name = input?.value?.trim();
  if (!name) return;

  const newItem = {
    id: (activeModalType === 'status' ? "status-" : "prio-") + Date.now(),
    label: name,
    bg: selectedNewModalLabelColor,
    text: "#ffffff",
    icon: "circle"
  };

  if (activeModalType === 'status') {
    state.statusLabels.push(newItem);
  } else {
    state.priorityLabels.push(newItem);
  }

  input.value = "";
  selectedNewModalLabelColor = MONDAY_PALETTE[Math.floor(Math.random() * MONDAY_PALETTE.length)];
  updateNewModalColorPreview();
  saveState();
  renderLabelsModalContent();
}

// -------------------------------------------------------------
// DYNAMIC GROUP CREATOR MODAL
// -------------------------------------------------------------

function openCreateGroupModal() {
  const modal = document.getElementById("createGroupModal");
  if (!modal) return;

  const paletteContainer = document.getElementById("modalColorPalette");
  if (paletteContainer) {
    paletteContainer.innerHTML = MONDAY_PALETTE.map(c => `
      <div class="color-swatch ${selectedModalColor === c ? 'active' : ''}" 
        style="background-color: ${c};" 
        onclick="selectModalGroupColor('${c}')"></div>
    `).join('');
  }

  const input = document.getElementById("newGroupNameInput");
  if (input) {
    input.value = "Novo Grupo " + (state.groups.length + 1);
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  }

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeCreateGroupModal() {
  document.getElementById("createGroupModal")?.classList.add("hidden");
}

function selectModalGroupColor(color) {
  selectedModalColor = color;
  openCreateGroupModal();
}

function confirmCreateGroup() {
  const input = document.getElementById("newGroupNameInput");
  const name = input?.value?.trim() || ("Novo Grupo " + (state.groups.length + 1));

  const newGroup = {
    id: "group-" + Date.now(),
    name: name,
    color: selectedModalColor,
    collapsed: false,
    tasks: []
  };

  state.groups.push(newGroup);
  saveState();
  closeCreateGroupModal();
  render();

  scrollToGroup(newGroup.id);
}

function duplicateGroup(groupId) {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  const duplicatedTasks = group.tasks.map(t => ({
    ...JSON.parse(JSON.stringify(t)),
    id: "task-" + Math.random().toString(36).substr(2, 9),
    title: t.title + " (Cópia)"
  }));

  const newGroup = {
    id: "group-" + Date.now(),
    name: group.name + " (Cópia)",
    color: group.color,
    collapsed: false,
    tasks: duplicatedTasks
  };

  state.groups.push(newGroup);
  saveState();
  render();
}

function deleteGroup(groupId) {
  if (state.groups.length <= 1) {
    alert("O quadro deve conter pelo menos um grupo de tarefas.");
    return;
  }
  if (!confirm("Tem certeza que deseja excluir este grupo e todas as suas tarefas?")) return;

  state.groups = state.groups.filter(g => g.id !== groupId);
  saveState();
  render();
}

function toggleGroupCollapse(groupId) {
  const group = state.groups.find(g => g.id === groupId);
  if (group) {
    group.collapsed = !group.collapsed;
    saveState();
    render();
  }
}

function openGroupColorPicker(e, groupId) {
  e.stopPropagation();
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  let html = `
    <div class="p-3" style="width: 200px;">
      <div class="text-[11px] font-bold text-gray-500 mb-2 uppercase">Cor do Grupo</div>
      <div class="grid grid-cols-4 gap-2">
        ${MONDAY_PALETTE.map(c => `
          <div class="color-swatch ${group.color === c ? 'active' : ''}" 
            style="background-color: ${c};" 
            onclick="setGroupColor('${groupId}', '${c}')"></div>
        `).join('')}
      </div>
    </div>
  `;

  showPortalPopup(e, html, 140);
}

function setGroupColor(groupId, color) {
  const group = state.groups.find(g => g.id === groupId);
  if (group) {
    group.color = color;
    saveState();
    render();
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// -------------------------------------------------------------
// SMOOTH NATIVE INLINE EDITING
// -------------------------------------------------------------

function makeTaskTitleEditable(taskId) {
  const titleSpan = document.getElementById(`task-title-${taskId}`);
  if (!titleSpan) return;

  const currentTitle = titleSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentTitle;
  input.className = "cell-inline-input font-bold";

  const save = () => {
    const newVal = input.value.trim() || currentTitle;
    const { task } = findTask(taskId);
    if (task) {
      task.title = newVal;
      saveState();
    }
    render();
  };

  input.onblur = save;
  input.onkeydown = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") render();
  };

  titleSpan.replaceWith(input);
  input.focus();
  input.select();
}

function makeGroupTitleEditable(groupId) {
  const titleSpan = document.getElementById(`group-title-${groupId}`);
  if (!titleSpan) return;

  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  const currentTitle = group.name;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentTitle;
  input.className = "text-base font-extrabold px-2.5 py-1 border-2 border-[#0073ea] rounded-xl outline-none";
  input.style.color = group.color;

  const save = () => {
    const newVal = input.value.trim() || currentTitle;
    group.name = newVal;
    saveState();
    render();
  };

  input.onblur = save;
  input.onkeydown = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") render();
  };

  titleSpan.replaceWith(input);
  input.focus();
  input.select();
}

function makeTaskBudgetEditable(taskId) {
  const cell = document.getElementById(`task-budget-cell-${taskId}`);
  if (!cell) return;

  const { task } = findTask(taskId);
  if (!task) return;

  const input = document.createElement("input");
  input.type = "number";
  input.value = task.budget || 0;
  input.className = "cell-inline-input text-center font-bold";

  const save = () => {
    task.budget = parseFloat(input.value) || 0;
    saveState();
    render();
  };

  input.onblur = save;
  input.onkeydown = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") render();
  };

  cell.innerHTML = "";
  cell.appendChild(input);
  input.focus();
  input.select();
}

// -------------------------------------------------------------
// GENERAL QUICK ADD HELPERS
// -------------------------------------------------------------

function quickAddTask(groupId, title) {
  if (!title || !title.trim()) return;
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  const defaultStatus = state.statusLabels[0]?.label || "Não iniciado";
  const defaultPriority = state.priorityLabels[2]?.label || "Média";

  const newTask = {
    id: "task-" + Date.now(),
    title: title.trim(),
    assigneeId: null,
    status: defaultStatus,
    dueDate: new Date().toISOString().split("T")[0],
    priority: defaultPriority,
    budget: 0,
    files: [],
    timeline: { start: new Date().toISOString().split("T")[0], end: "" },
    description: "",
    subtasks: []
  };

  group.tasks.push(newTask);
  saveState();
  render();
}

function quickAddTaskToStatus(status) {
  const title = prompt("Nome da nova tarefa:");
  if (!title || !title.trim()) return;
  
  const targetGroup = state.groups[0];
  if (!targetGroup) return;

  const defaultPriority = state.priorityLabels[2]?.label || "Média";

  const newTask = {
    id: "task-" + Date.now(),
    title: title.trim(),
    assigneeId: null,
    status: status,
    dueDate: new Date().toISOString().split("T")[0],
    priority: defaultPriority,
    budget: 0,
    files: [],
    timeline: { start: new Date().toISOString().split("T")[0], end: "" },
    description: "",
    subtasks: []
  };

  targetGroup.tasks.push(newTask);
  saveState();
  render();
}

function quickAddTaskOnDate(dateKey) {
  const title = prompt(`Nova tarefa para o dia ${formatDateDisplay(dateKey)}:`);
  if (!title || !title.trim()) return;
  
  const targetGroup = state.groups[0];
  if (!targetGroup) return;

  const defaultStatus = state.statusLabels[0]?.label || "Não iniciado";
  const defaultPriority = state.priorityLabels[2]?.label || "Média";

  const newTask = {
    id: "task-" + Date.now(),
    title: title.trim(),
    assigneeId: null,
    status: defaultStatus,
    dueDate: dateKey,
    priority: defaultPriority,
    budget: 0,
    files: [],
    timeline: { start: dateKey, end: "" },
    description: "",
    subtasks: []
  };

  targetGroup.tasks.push(newTask);
  saveState();
  render();
}

function deleteTask(taskId) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
  for (const group of state.groups) {
    const idx = group.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      group.tasks.splice(idx, 1);
      break;
    }
  }
  if (selectedTaskId === taskId) {
    closeTaskDrawer();
  }
  saveState();
  render();
}

// Date Picker
function openDatePicker(e, taskId) {
  e.stopPropagation();
  const { task } = findTask(taskId);
  if (!task) return;

  const today = new Date().toISOString().split("T")[0];
  const currentDate = task.dueDate || today;

  let html = `
    <div class="p-3.5 text-xs" style="width: 220px;">
      <label class="block font-bold text-gray-700 mb-2">Escolher Data de Prazo</label>
      <input type="date" value="${currentDate}" class="w-full p-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0073ea]"
        onchange="setTaskDate('${taskId}', this.value)">
    </div>
  `;

  showPortalPopup(e, html, 110);
}

function setTaskDate(taskId, newDate) {
  const { task } = findTask(taskId);
  if (task) {
    task.dueDate = newDate;
    saveState();
    render();
    if (selectedTaskId === taskId) updateDrawerContent(task);
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// Timeline Picker
function openTimelinePicker(e, taskId) {
  e.stopPropagation();
  const { task } = findTask(taskId);
  if (!task) return;

  const start = task.timeline?.start || "";
  const end = task.timeline?.end || "";

  let html = `
    <div class="p-3.5 text-xs space-y-2.5" style="width: 240px;">
      <div class="font-extrabold text-gray-800">Definir Cronograma</div>
      <div>
        <label class="block text-[11px] text-gray-500 mb-1">Início:</label>
        <input type="date" id="timelineStartInput" value="${start}" class="w-full p-2 border rounded-xl text-xs">
      </div>
      <div>
        <label class="block text-[11px] text-gray-500 mb-1">Fim:</label>
        <input type="date" id="timelineEndInput" value="${end}" class="w-full p-2 border rounded-xl text-xs">
      </div>
      <button onclick="saveTimeline('${taskId}')" class="w-full bg-[#0073ea] hover:bg-[#0060b9] text-white py-2 rounded-xl font-bold mt-1 shadow-sm">Salvar Cronograma</button>
    </div>
  `;

  showPortalPopup(e, html, 200);
}

function saveTimeline(taskId) {
  const s = document.getElementById("timelineStartInput")?.value;
  const e = document.getElementById("timelineEndInput")?.value;
  const { task } = findTask(taskId);
  if (task) {
    task.timeline = { start: s, end: e };
    saveState();
    render();
    if (selectedTaskId === taskId) updateDrawerContent(task);
  }
  document.getElementById("dropdownPortal").innerHTML = "";
  document.getElementById("dropdownPortal").classList.add("pointer-events-none");
}

// -------------------------------------------------------------
// DETAIL DRAWER
// -------------------------------------------------------------

function openTaskDrawer(taskId) {
  selectedTaskId = taskId;
  const { task } = findTask(taskId);
  if (!task) return;

  const drawer = document.getElementById("taskDrawer");
  if (!drawer) return;

  updateDrawerContent(task);
  drawer.classList.remove("translate-x-full");
}

function closeTaskDrawer() {
  const drawer = document.getElementById("taskDrawer");
  if (drawer) drawer.classList.add("translate-x-full");
  selectedTaskId = null;
}

function updateDrawerContent(task) {
  const member = state.members.find(m => m.id === task.assigneeId);
  const statusCfg = getStatusConfig(task.status);
  const priorityCfg = getPriorityConfig(task.priority);

  const titleEl = document.getElementById("drawerTaskTitle");
  if (titleEl) {
    titleEl.textContent = task.title;
    titleEl.onclick = () => {
      const n = prompt("Editar nome da tarefa:", task.title);
      if (n !== null && n.trim()) {
        task.title = n.trim();
        saveState();
        render();
        updateDrawerContent(task);
      }
    };
  }

  document.getElementById("drawerStatusSlot").innerHTML = `
    <span class="rounded-status-pill text-white cursor-pointer" 
      style="background-color: ${statusCfg.bg};" data-popup-trigger onclick="openStatusPicker(event, '${task.id}')">
      <span>${statusCfg.label}</span>
      <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-80"></i>
    </span>
  `;

  document.getElementById("drawerPrioritySlot").innerHTML = `
    <span class="rounded-priority-pill text-white cursor-pointer" 
      style="background-color: ${priorityCfg.bg};" data-popup-trigger onclick="openPriorityPicker(event, '${task.id}')">
      <span>${priorityCfg.label}</span>
      <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-80"></i>
    </span>
  `;

  document.getElementById("drawerAssigneeSlot").innerHTML = `
    <div class="flex items-center space-x-2 cursor-pointer" data-popup-trigger onclick="openAssigneePicker(event, '${task.id}')">
      ${member ? `
        <div class="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style="background-color: ${member.color};">
          ${member.initials}
        </div>
        <span class="font-bold text-gray-800">${member.name}</span>
      ` : `
        <span class="text-gray-400 hover:text-gray-600 flex items-center space-x-1 font-semibold">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>Atribuir pessoa</span>
        </span>
      `}
    </div>
  `;

  document.getElementById("drawerDueDateSlot").innerHTML = `
    <div class="rounded-date-pill inline-flex" data-popup-trigger onclick="openDatePicker(event, '${task.id}')">
      <i data-lucide="calendar" class="w-3.5 h-3.5 text-gray-400"></i>
      <span>${formatDateDisplay(task.dueDate)}</span>
    </div>
  `;

  document.getElementById("drawerBudgetSlot").innerHTML = `
    <span class="text-gray-900 font-bold cursor-pointer hover:text-[#0073ea]" onclick="makeTaskBudgetEditable('${task.id}')">
      ${formatCurrency(task.budget)}
    </span>
  `;

  let timelineLabel = "—";
  if (task.timeline && task.timeline.start) {
    timelineLabel = `${formatDateDisplay(task.timeline.start)} - ${task.timeline.end ? formatDateDisplay(task.timeline.end) : '...'}`;
  }
  document.getElementById("drawerTimelineSlot").innerHTML = `
    <div class="rounded-timeline-pill inline-flex" style="background-color: ${statusCfg.bg};" data-popup-trigger onclick="openTimelinePicker(event, '${task.id}')">
      <span>${timelineLabel}</span>
    </div>
  `;

  const descEl = document.getElementById("drawerDescription");
  if (descEl) {
    descEl.value = task.description || "";
    descEl.onblur = () => {
      task.description = descEl.value;
      saveState();
    };
  }

  renderDrawerSubtasks(task);
  renderDrawerFiles(task);

  const delBtn = document.getElementById("drawerDeleteTaskBtn");
  if (delBtn) delBtn.onclick = () => deleteTask(task.id);

  if (window.lucide) window.lucide.createIcons();
}

function renderDrawerSubtasks(task) {
  const container = document.getElementById("subtasksList");
  const counter = document.getElementById("subtasksCounter");
  if (!container || !counter) return;

  const total = task.subtasks ? task.subtasks.length : 0;
  const doneCount = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
  counter.textContent = `${doneCount}/${total}`;

  container.innerHTML = (task.subtasks || []).map(st => `
    <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 bg-white border border-gray-200">
      <label class="flex items-center space-x-2.5 cursor-pointer flex-1">
        <input type="checkbox" ${st.done ? 'checked' : ''} class="rounded-md border-gray-300 text-[#0073ea] focus:ring-0"
          onchange="toggleSubtask('${task.id}', '${st.id}')">
        <span class="${st.done ? 'line-through text-gray-400 font-normal' : 'text-gray-800 font-semibold'}">${st.title}</span>
      </label>
      <button onclick="deleteSubtask('${task.id}', '${st.id}')" class="text-gray-400 hover:text-red-500 p-1 rounded-lg">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function toggleSubtask(taskId, subtaskId) {
  const { task } = findTask(taskId);
  if (!task || !task.subtasks) return;
  const st = task.subtasks.find(s => s.id === subtaskId);
  if (st) {
    st.done = !st.done;
    saveState();
    renderDrawerSubtasks(task);
  }
}

function deleteSubtask(taskId, subtaskId) {
  const { task } = findTask(taskId);
  if (!task || !task.subtasks) return;
  task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
  saveState();
  renderDrawerSubtasks(task);
}

function addSubtask(taskId) {
  const input = document.getElementById("newSubtaskInput");
  if (!input || !input.value.trim()) return;
  const { task } = findTask(taskId);
  if (!task) return;

  task.subtasks = task.subtasks || [];
  task.subtasks.push({
    id: "st-" + Date.now(),
    title: input.value.trim(),
    done: false
  });
  input.value = "";
  saveState();
  renderDrawerSubtasks(task);
}

function renderDrawerFiles(task) {
  const container = document.getElementById("drawerFilesList");
  if (!container) return;

  container.innerHTML = (task.files || []).map(f => `
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs">
      <div class="flex items-center space-x-2 text-[#0073ea]">
        <i data-lucide="file" class="w-4 h-4"></i>
        <span class="font-bold">${f.name}</span>
        <span class="text-gray-400 text-[10px]">(${f.size || '120 KB'})</span>
      </div>
      <button onclick="removeTaskFile('${task.id}', '${f.id}')" class="text-gray-400 hover:text-red-500 p-1 rounded-lg">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openTaskFilesModal(taskId) {
  openTaskDrawer(taskId);
}

function removeTaskFile(taskId, fileId) {
  const { task } = findTask(taskId);
  if (!task || !task.files) return;
  task.files = task.files.filter(f => f.id !== fileId);
  saveState();
  render();
  renderDrawerFiles(task);
}

// -------------------------------------------------------------
// FIREBASE CLOUD MODAL CONTROLS
// -------------------------------------------------------------

function openCloudConfigModal() {
  const cfg = getSavedFirebaseConfig();
  const apiKeyInput = document.getElementById("firebaseApiKeyInput");
  const projInput = document.getElementById("firebaseProjectIdInput");
  const appIdInput = document.getElementById("firebaseAppIdInput");

  if (cfg) {
    if (apiKeyInput && cfg.apiKey && cfg.apiKey !== "SUA_API_KEY") apiKeyInput.value = cfg.apiKey;
    if (projInput && cfg.projectId && cfg.projectId !== "SEU_PROJECT_ID") projInput.value = cfg.projectId;
    if (appIdInput && cfg.appId && cfg.appId !== "SEU_APP_ID") appIdInput.value = cfg.appId;
  }
  document.getElementById("cloudConfigModal")?.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeCloudConfigModal() {
  document.getElementById("cloudConfigModal")?.classList.add("hidden");
}

function saveAndConnectFirebase() {
  const apiKey = document.getElementById("firebaseApiKeyInput")?.value?.trim();
  const projectId = document.getElementById("firebaseProjectIdInput")?.value?.trim();
  const appId = document.getElementById("firebaseAppIdInput")?.value?.trim();

  if (!apiKey || !projectId) {
    alert("Por favor, preencha pelo menos a API Key e o Project ID do Firebase.");
    return;
  }

  const newCfg = {
    apiKey: apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: "1234567890",
    appId: appId || "1:123456:web:custom"
  };

  localStorage.setItem('firebase_saved_config', JSON.stringify(newCfg));
  closeCloudConfigModal();
  initFirebase();
  alert("Conectando ao Firebase Firestore... Suas tarefas serão sincronizadas em tempo real!");
}

function disconnectFirebase() {
  localStorage.removeItem('firebase_saved_config');
  db = null;
  updateCloudStatusUI(false);
  closeCloudConfigModal();
  alert("Desconectado da nuvem. O aplicativo continuará funcionando no modo local.");
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Firebase app first
  const cfg = getSavedFirebaseConfig();
  if (cfg && cfg.apiKey && cfg.apiKey !== "SUA_API_KEY" && window.firebase) {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }

    // Firebase Auth state observer - controls login/app visibility
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        showApp(user);
      } else {
        hideApp();
      }
    });
  } else {
    // No Firebase config: show app without auth (local only)
    document.getElementById('loginScreen')?.classList.add('hidden');
    const appContent = document.getElementById('appContent');
    if (appContent) {
      appContent.classList.remove('hidden');
      appContent.classList.add('flex', 'flex-col', 'h-screen');
    }
    render();
  }

  if (window.lucide) window.lucide.createIcons();

  // Board Title Inline Edit
  const boardTitleEl = document.getElementById("boardTitle");
  if (boardTitleEl) {
    boardTitleEl.addEventListener("click", () => {
      const currentTitle = state.boardTitle;
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentTitle;
      input.className = "text-2xl font-black px-2.5 py-1 border-2 border-[#0073ea] rounded-xl outline-none text-gray-900";

      const save = () => {
        state.boardTitle = input.value.trim() || currentTitle;
        saveState();
        boardTitleEl.innerHTML = `<span>${state.boardTitle}</span><i data-lucide="pencil" class="w-4 h-4 text-gray-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      };

      input.onblur = save;
      input.onkeydown = (e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") boardTitleEl.innerHTML = `<span>${state.boardTitle}</span><i data-lucide="pencil" class="w-4 h-4 text-gray-400"></i>`;
      };

      boardTitleEl.replaceWith(input);
      input.focus();
      input.select();
    });
  }

  // Main Create Task button
  document.getElementById("mainCreateTaskBtn")?.addEventListener("click", () => {
    if (state.groups.length > 0) {
      quickAddTask(state.groups[0].id, "Nova Tarefa");
    }
  });

  // Search input
  document.getElementById("globalSearchInput")?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    render();
  });

  // Filter dropdown toggle
  document.getElementById("filterDropdownBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("filterDropdownMenu");
    if (!menu) return;

    menu.innerHTML = `
      <div class="px-4 py-2 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Filtrar por Status</div>
      <button class="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-800 font-bold rounded-xl ${state.filterStatus === 'ALL' ? 'text-[#0073ea] bg-blue-50' : ''}" onclick="applyStatusFilter('ALL')">Todos os Status</button>
      ${state.statusLabels.map(s => `
        <button class="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-800 flex items-center space-x-2.5 rounded-xl ${state.filterStatus === s.label ? 'font-bold text-[#0073ea] bg-blue-50' : ''}" onclick="applyStatusFilter('${s.label}')">
          <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${s.bg};"></span>
          <span>${s.label}</span>
        </button>
      `).join('')}
    `;

    menu.classList.toggle("hidden");
  });

  // Drawer events
  document.getElementById("closeDrawerBtn")?.addEventListener("click", closeTaskDrawer);
  document.getElementById("addSubtaskBtn")?.addEventListener("click", () => {
    if (selectedTaskId) addSubtask(selectedTaskId);
  });
  document.getElementById("newSubtaskInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedTaskId) addSubtask(selectedTaskId);
  });
  document.getElementById("drawerUploadFileBtn")?.addEventListener("click", () => {
    if (!selectedTaskId) return;
    const fileName = prompt("Nome do arquivo (ex: layout.png, contrato.pdf):");
    if (fileName && fileName.trim()) {
      const { task } = findTask(selectedTaskId);
      if (task) {
        task.files = task.files || [];
        task.files.push({ id: "f-" + Date.now(), name: fileName.trim(), size: "380 KB" });
        saveState();
        render();
        renderDrawerFiles(task);
      }
    }
  });

  // Toggle all groups collapse
  document.getElementById("toggleAllGroupsBtn")?.addEventListener("click", () => {
    const allCollapsed = state.groups.every(g => g.collapsed);
    state.groups.forEach(g => g.collapsed = !allCollapsed);
    saveState();
    render();
  });
});

function applyStatusFilter(status) {
  state.filterStatus = status;
  const labelEl = document.getElementById("activeFilterLabel");
  if (labelEl) {
    labelEl.textContent = status === "ALL" ? "Filtrar por Status" : `Status: ${status}`;
  }
  document.getElementById("filterDropdownMenu")?.classList.add("hidden");
  render();
}

// -------------------------------------------------------------
// BACKUP EXPORT & IMPORT (OFFLINE & BETWEEN COMPUTERS)
// -------------------------------------------------------------

function exportDataBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup_organizador_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function triggerImportBackup() {
  document.getElementById("backupFileInput")?.click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.groups && imported.statusLabels) {
        state = imported;
        saveState();
        render();
        alert("Backup importado com sucesso! Todas as suas tarefas foram carregadas.");
      } else {
        alert("O arquivo selecionado não é um backup válido do Organizador.");
      }
    } catch (err) {
      alert("Erro ao ler o arquivo de backup.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// -------------------------------------------------------------
// MOBILE SIDEBAR, QUICK ACTIONS & PWA SERVICE WORKER
// -------------------------------------------------------------

function toggleMobileSidebar() {
  const sidebar = document.getElementById("workspaceSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar) return;

  const isClosed = sidebar.classList.contains("-translate-x-full");
  if (isClosed) {
    sidebar.classList.remove("-translate-x-full");
    backdrop?.classList.remove("hidden");
  } else {
    sidebar.classList.add("-translate-x-full");
    backdrop?.classList.add("hidden");
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("workspaceSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  sidebar?.classList.add("-translate-x-full");
  backdrop?.classList.add("hidden");
}

function mobileQuickAddTask() {
  closeMobileSidebar();
  if (state.groups.length > 0) {
    quickAddTask(state.groups[0].id, "Nova Tarefa");
  }
}

// PWA Install Prompt & Service Worker Registration
let deferredPwaPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  if (!localStorage.getItem("pwa_banner_dismissed")) {
    document.getElementById("pwaInstallBanner")?.classList.remove("hidden");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("pwaInstallBtn")?.addEventListener("click", async () => {
    if (!deferredPwaPrompt) return;
    deferredPwaPrompt.prompt();
    await deferredPwaPrompt.userChoice;
    deferredPwaPrompt = null;
    document.getElementById("pwaInstallBanner")?.classList.add("hidden");
  });

  document.getElementById("pwaDismissBtn")?.addEventListener("click", () => {
    localStorage.setItem("pwa_banner_dismissed", "1");
    document.getElementById("pwaInstallBanner")?.classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("SW registration warning:", err);
    });
  }
});


