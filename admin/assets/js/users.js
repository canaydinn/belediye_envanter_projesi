const API_BASE_URL = 'http://localhost:4000/api';

const ROLE_LABELS = {
  1: 'Belediye Yöneticisi',
  2: 'Taşınır Kayıt',
  3: 'Taşınır Kontrol',
  4: 'Birim Sorumlusu',
  5: 'Kullanıcı',
};

const ROLE_BADGES = {
  1: 'badge bg-label-primary',
  2: 'badge bg-label-info',
  3: 'badge bg-label-warning',
  4: 'badge bg-label-info',
  5: 'badge bg-label-secondary',
};

const selectElements = () => ({
  alertContainer: document.getElementById('userPageAlertContainer'),
  totalUser: document.getElementById('total_user'),
  totalActiveUser: document.getElementById('total_active_user'),
  todayLogin: document.getElementById('today_total_login'),
  managerRoleCard: document.getElementById('manager_role_card'),
  adminRoleTotal: document.getElementById('admin_role_total'),
  managerRoleTotal: document.getElementById('manager_role_total'),
  userRoleTotal: document.getElementById('user_role_total'),
  recentLoginList: document.getElementById('recentLoginList'),
  filterName: document.getElementById('filterName'),
  filterEmail: document.getElementById('filterEmail'),
  filterDepartment: document.getElementById('filterDepartment'),
  filterRole: document.getElementById('filterRole'),
  filterStatus: document.getElementById('filterStatus'),
  applyFilters: document.getElementById('applyFilters'),
  resetFilters: document.getElementById('resetFilters'),
  pageSize: document.getElementById('pageSize'),
  tableBody: document.getElementById('userTableBody'),
  tableMeta: document.getElementById('userTableMeta'),
  tableFooter: document.getElementById('userTableFooter'),
});

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn('JSON parse hatası:', error);
    return {};
  }
};

const showAlert = (message, variant = 'danger') => {
  const { alertContainer } = selectElements();
  if (!alertContainer || !message) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${variant} alert-dismissible fade show`;
  alert.setAttribute('role', 'alert');
  alert.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'alert');
  closeButton.setAttribute('aria-label', 'Kapat');

  alert.appendChild(closeButton);
  alertContainer.replaceChildren(alert);
};

const fetchJson = async (path, errorMessage) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || errorMessage || 'İstek başarısız');
  }

  return data;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('tr-TR');
};

const createRoleBadge = (roleId) => {
  const span = document.createElement('span');
  span.className = ROLE_BADGES[roleId] || 'badge bg-label-secondary';
  span.textContent = ROLE_LABELS[roleId] || 'Bilinmiyor';
  return span;
};

const createStatusBadge = (isActive) => {
  const span = document.createElement('span');
  span.className = isActive ? 'badge badge-light-success' : 'badge badge-light-secondary';
  span.textContent = isActive ? 'Aktif' : 'Pasif';
  return span;
};

const renderStats = (stats) => {
  const {
    totalUser,
    totalActiveUser,
    todayLogin,
    managerRoleCard,
    adminRoleTotal,
    managerRoleTotal,
    userRoleTotal,
  } = selectElements();

  const totals = stats?.totals || {};
  const roles = stats?.roles || {};

  if (totalUser) totalUser.textContent = totals.users ?? '-';
  if (totalActiveUser) totalActiveUser.textContent = totals.activeUsers ?? '-';
  if (todayLogin) todayLogin.textContent = totals.todayLogins ?? '-';
  if (managerRoleCard) managerRoleCard.textContent = roles.manager ?? '-';
  if (adminRoleTotal) adminRoleTotal.textContent = roles.admin ?? '-';
  if (managerRoleTotal) managerRoleTotal.textContent = roles.manager ?? '-';
  if (userRoleTotal) userRoleTotal.textContent = roles.user ?? '-';
};

const renderDepartments = (departments) => {
  const { filterDepartment } = selectElements();
  if (!filterDepartment) return;

  filterDepartment.replaceChildren();
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Tümü';
  filterDepartment.appendChild(defaultOption);

  departments
    .filter((dept) => Boolean(dept?.id && dept?.name))
    .forEach((dept) => {
      const option = document.createElement('option');
      option.value = String(dept.id);
      option.textContent = dept.name;
      filterDepartment.appendChild(option);
    });
};

const renderRecentLogins = (logins) => {
  const { recentLoginList } = selectElements();
  if (!recentLoginList) return;

  recentLoginList.replaceChildren();

  const items = Array.isArray(logins)
    ? logins.filter((item) => item && item.full_name && item.last_login_at)
    : [];

  if (items.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'text-muted';
    emptyItem.textContent = 'Bugün giriş yapan kullanıcı bulunamadı.';
    recentLoginList.appendChild(emptyItem);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = index === items.length - 1 ? '' : 'mb-2';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'fw-semibold';
    nameDiv.textContent = item.full_name;

    const details = document.createElement('small');
    details.className = 'text-muted';
    const departmentLabel = item.department_name ? ` - ${item.department_name}` : '';
    details.textContent = `${formatDateTime(item.last_login_at)}${departmentLabel}`;

    li.appendChild(nameDiv);
    li.appendChild(details);
    recentLoginList.appendChild(li);
  });
};

const buildActionCell = (userId) => {
  const td = document.createElement('td');
  td.className = 'text-end';

  const idSuffix = userId ? encodeURIComponent(String(userId)) : '';

  const viewBtn = document.createElement('a');
  viewBtn.className = 'btn btn-sm btn-icon btn-text-secondary';
  viewBtn.href = idSuffix ? `municipality-user-detail.html?id=${idSuffix}` : '#';
  viewBtn.setAttribute('aria-label', 'Detay');
  const viewIcon = document.createElement('i');
  viewIcon.className = 'ti ti-eye';
  viewBtn.appendChild(viewIcon);

  const editBtn = document.createElement('a');
  editBtn.className = 'btn btn-sm btn-icon btn-text-secondary';
  editBtn.href = idSuffix ? `municipality-user-edit.html?id=${idSuffix}` : '#';
  editBtn.setAttribute('aria-label', 'Düzenle');
  const editIcon = document.createElement('i');
  editIcon.className = 'ti ti-edit';
  editBtn.appendChild(editIcon);

  const resetBtn = document.createElement('a');
  resetBtn.className = 'btn btn-sm btn-icon btn-text-secondary';
  resetBtn.href = idSuffix ? `municipality-user-reset-password.html?id=${idSuffix}` : '#';
  resetBtn.setAttribute('aria-label', 'Şifre Sıfırla');
  const resetIcon = document.createElement('i');
  resetIcon.className = 'ti ti-key';
  resetBtn.appendChild(resetIcon);

  const toggleBtn = document.createElement('a');
  toggleBtn.className = 'btn btn-sm btn-icon btn-text-secondary';
  toggleBtn.href = idSuffix ? `municipality-user-toggle-status.html?id=${idSuffix}` : '#';
  toggleBtn.setAttribute('aria-label', 'Durum Değiştir');
  const toggleIcon = document.createElement('i');
  toggleIcon.className = 'ti ti-toggle-right';
  toggleBtn.appendChild(toggleIcon);

  td.appendChild(viewBtn);
  td.appendChild(editBtn);
  td.appendChild(resetBtn);
  td.appendChild(toggleBtn);
  return td;
};

const renderUsers = (users) => {
  const { tableBody, tableMeta, tableFooter, pageSize } = selectElements();
  if (!tableBody) return;

  tableBody.replaceChildren();

  const size = Number(pageSize?.value || 25);
  const visible = users.slice(0, size);

  if (visible.length === 0) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.className = 'text-center text-muted';
    cell.textContent = 'Kayıt bulunamadı.';
    emptyRow.appendChild(cell);
    tableBody.appendChild(emptyRow);
  } else {
    visible.forEach((user) => {
      const row = document.createElement('tr');

      const fullNameCell = document.createElement('td');
      fullNameCell.textContent = user.full_name || '-';

      const emailCell = document.createElement('td');
      emailCell.textContent = user.email || '-';

      const departmentCell = document.createElement('td');
      departmentCell.textContent = user.department_name || '-';

      const roleCell = document.createElement('td');
      roleCell.appendChild(createRoleBadge(user.role_id));

      const statusCell = document.createElement('td');
      statusCell.appendChild(createStatusBadge(Boolean(user.is_active)));

      const lastLoginCell = document.createElement('td');
      lastLoginCell.textContent = formatDateTime(user.last_login_at);

      const createdCell = document.createElement('td');
      createdCell.textContent = formatDate(user.created_at);

      row.appendChild(fullNameCell);
      row.appendChild(emailCell);
      row.appendChild(departmentCell);
      row.appendChild(roleCell);
      row.appendChild(statusCell);
      row.appendChild(lastLoginCell);
      row.appendChild(createdCell);
      row.appendChild(buildActionCell(user.id));

      tableBody.appendChild(row);
    });
  }

  const metaText = `Gösterilen: ${visible.length} / ${users.length}`;
  if (tableMeta) tableMeta.textContent = metaText;
  if (tableFooter) tableFooter.textContent = metaText;
};

let allUsers = [];

const applyFilters = () => {
  const {
    filterName,
    filterEmail,
    filterDepartment,
    filterRole,
    filterStatus,
  } = selectElements();

  const nameQuery = (filterName?.value || '').toLowerCase();
  const emailQuery = (filterEmail?.value || '').toLowerCase();
  const departmentQuery = filterDepartment?.value || '';
  const roleQuery = filterRole?.value || '';
  const statusQuery = filterStatus?.value || '';

  const filtered = allUsers.filter((user) => {
    const matchesName = !nameQuery || (user.full_name || '').toLowerCase().includes(nameQuery);
    const matchesEmail = !emailQuery || (user.email || '').toLowerCase().includes(emailQuery);
    const matchesDepartment = !departmentQuery || String(user.department_id || user.department_name || '') === departmentQuery;
    const matchesRole = !roleQuery || String(user.role_id) === roleQuery;
    const statusValue = user.is_active ? 'active' : 'inactive';
    const matchesStatus = !statusQuery || statusQuery === statusValue;
    return matchesName && matchesEmail && matchesDepartment && matchesRole && matchesStatus;
  });

  renderUsers(filtered);
};

const attachEventListeners = () => {
  const { applyFilters: filterBtn, resetFilters, pageSize } = selectElements();

  if (filterBtn) filterBtn.addEventListener('click', applyFilters);
  if (resetFilters)
    resetFilters.addEventListener('click', () => {
      setTimeout(applyFilters, 0);
    });
  if (pageSize) pageSize.addEventListener('change', applyFilters);

  const { filterName, filterEmail, filterDepartment, filterRole, filterStatus } = selectElements();
  [filterName, filterEmail, filterDepartment, filterRole, filterStatus].forEach((element) => {
    if (!element) return;
    const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
    element.addEventListener(eventName, applyFilters);
  });
};

const loadPageData = async () => {
  try {
    const [stats, users, departments, recentLogins] = await Promise.all([
      fetchJson('/users/stats', 'Kullanıcı istatistikleri alınamadı'),
      fetchJson('/users/detailed', 'Kullanıcı listesi alınamadı'),
      fetchJson('/departments', 'Birimler alınamadı'),
      fetchJson('/users/today-logins?limit=5', 'Son giriş yapanlar alınamadı'),
    ]);

    renderStats(stats);
    renderDepartments(departments);
    renderRecentLogins(recentLogins);
    allUsers = Array.isArray(users) ? users : [];
    applyFilters();
  } catch (error) {
    console.error(error);
    showAlert(error.message || 'Veriler yüklenemedi');
  }
};

let initialized = false;
const initPage = () => {
  if (initialized) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
    return;
  }

  initialized = true;
  attachEventListeners();
  loadPageData();
};

initPage();

