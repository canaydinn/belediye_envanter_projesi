const API_BASE_URL =
  window.APP_CONFIG?.API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api' // Lokal
    : window.location.origin + '/api');

const selectElements = () => ({
  // Appearance form
  appearanceForm: document.getElementById('appearanceForm'),
  appearanceSaveButton: document.getElementById('appearanceSaveButton'),
  appearanceSuccess: document.getElementById('appearanceSuccess'),
  appearanceError: document.getElementById('appearanceError'),
  themeMode: document.getElementById('themeMode'),
  colorTheme: document.getElementById('colorTheme'),
  language: document.getElementById('language'),
  dateFormat: document.getElementById('dateFormat'),
  timeFormat: document.getElementById('timeFormat'),
  timezone: document.getElementById('timezone'),

  // Notification form
  notificationForm: document.getElementById('notificationForm'),
  notificationSaveButton: document.getElementById('notificationSaveButton'),
  notificationSuccess: document.getElementById('notificationSuccess'),
  notificationError: document.getElementById('notificationError'),

  // Security
  twoFactorEnabled: document.getElementById('twoFactorEnabled'),
  twoFactorInfo: document.getElementById('twoFactorInfo'),
  activeSessionsList: document.getElementById('activeSessionsList'),
  loginHistoryList: document.getElementById('loginHistoryList'),
  terminateAllSessionsButton: document.getElementById('terminateAllSessionsButton'),

  // Preferences form
  preferencesForm: document.getElementById('preferencesForm'),
  preferencesSaveButton: document.getElementById('preferencesSaveButton'),
  preferencesSuccess: document.getElementById('preferencesSuccess'),
  preferencesError: document.getElementById('preferencesError'),
});

const toggleAlert = (element, message, variant = 'success') => {
  if (!element) return;
  if (!message) {
    element.classList.add('d-none');
    element.textContent = '';
    return;
  }

  element.classList.remove('d-none');
  element.classList.toggle('alert-success', variant === 'success');
  element.classList.toggle('alert-danger', variant === 'danger');
  element.textContent = message;
};

const toggleButtonState = (button, isDisabled) => {
  if (!button) return;
  button.disabled = isDisabled;
  const loadingText = button.dataset.loadingText;
  if (!loadingText) return;
  if (isDisabled) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
};

const buildAuthorizedOptions = () => ({
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn('JSON parse hatası:', error);
    return {};
  }
};

// API Functions
const getSettings = async () => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'GET',
    ...buildAuthorizedOptions(),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Ayarlar alınamadı';
    throw new Error(message);
  }

  return data?.settings || {};
};

const updateSettings = async (category, payload) => {
  const response = await fetch(`${API_BASE_URL}/settings/${category}`, {
    method: 'PUT',
    ...buildAuthorizedOptions(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Ayarlar güncellenemedi';
    throw new Error(message);
  }

  return data;
};

// Form Handlers
const handleAppearanceSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();
  toggleAlert(elements.appearanceSuccess, '');
  toggleAlert(elements.appearanceError, '');

  const payload = {
    theme_mode: elements.themeMode?.value,
    color_theme: elements.colorTheme?.value,
    language: elements.language?.value,
    date_format: elements.dateFormat?.value,
    time_format: elements.timeFormat?.value,
    timezone: elements.timezone?.value,
  };

  toggleButtonState(elements.appearanceSaveButton, true);

  try {
    await updateSettings('appearance', payload);
    toggleAlert(elements.appearanceSuccess, 'Görünüm ayarları başarıyla kaydedildi.');
    // Apply theme immediately
    if (payload.theme_mode === 'dark') {
      document.documentElement.classList.add('dark-style');
    } else if (payload.theme_mode === 'light') {
      document.documentElement.classList.remove('dark-style');
    }
    if (payload.color_theme) {
      document.documentElement.setAttribute('data-theme', payload.color_theme);
    }
  } catch (error) {
    toggleAlert(elements.appearanceError, error.message, 'danger');
  } finally {
    toggleButtonState(elements.appearanceSaveButton, false);
  }
};

const handleNotificationSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();
  toggleAlert(elements.notificationSuccess, '');
  toggleAlert(elements.notificationError, '');

  const payload = {
    email_asset_create: document.getElementById('emailAssetCreate')?.checked,
    email_asset_movement: document.getElementById('emailAssetMovement')?.checked,
    email_system_updates: document.getElementById('emailSystemUpdates')?.checked,
    email_security_alerts: document.getElementById('emailSecurityAlerts')?.checked,
    in_app_asset_create: document.getElementById('inAppAssetCreate')?.checked,
    in_app_asset_movement: document.getElementById('inAppAssetMovement')?.checked,
    in_app_system_updates: document.getElementById('inAppSystemUpdates')?.checked,
    notification_frequency: document.getElementById('notificationFrequency')?.value,
  };

  toggleButtonState(elements.notificationSaveButton, true);

  try {
    await updateSettings('notifications', payload);
    toggleAlert(elements.notificationSuccess, 'Bildirim ayarları başarıyla kaydedildi.');
  } catch (error) {
    toggleAlert(elements.notificationError, error.message, 'danger');
  } finally {
    toggleButtonState(elements.notificationSaveButton, false);
  }
};

const handlePreferencesSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();
  toggleAlert(elements.preferencesSuccess, '');
  toggleAlert(elements.preferencesError, '');

  const payload = {
    default_list_view: document.getElementById('defaultListView')?.value,
    items_per_page: parseInt(document.getElementById('itemsPerPage')?.value),
    auto_save: document.getElementById('autoSave')?.checked,
    default_export_format: document.getElementById('defaultExportFormat')?.value,
    dashboard_widgets: {
      assets: document.getElementById('widgetAssets')?.checked,
      movements: document.getElementById('widgetMovements')?.checked,
      categories: document.getElementById('widgetCategories')?.checked,
      locations: document.getElementById('widgetLocations')?.checked,
      recent_activity: document.getElementById('widgetRecentActivity')?.checked,
    },
  };

  toggleButtonState(elements.preferencesSaveButton, true);

  try {
    await updateSettings('preferences', payload);
    toggleAlert(elements.preferencesSuccess, 'Tercihler başarıyla kaydedildi.');
  } catch (error) {
    toggleAlert(elements.preferencesError, error.message, 'danger');
  } finally {
    toggleButtonState(elements.preferencesSaveButton, false);
  }
};

const renderSettings = (settings) => {
  const elements = selectElements();

  // Appearance
  if (settings.appearance) {
    if (elements.themeMode) elements.themeMode.value = settings.appearance.theme_mode || 'light';
    if (elements.colorTheme) elements.colorTheme.value = settings.appearance.color_theme || 'theme-default';
    if (elements.language) elements.language.value = settings.appearance.language || 'tr';
    if (elements.dateFormat) elements.dateFormat.value = settings.appearance.date_format || 'DD/MM/YYYY';
    if (elements.timeFormat) elements.timeFormat.value = settings.appearance.time_format || '24';
    if (elements.timezone) elements.timezone.value = settings.appearance.timezone || 'Europe/Istanbul';
  }

  // Notifications
  if (settings.notifications) {
    const notif = settings.notifications;
    if (document.getElementById('emailAssetCreate')) document.getElementById('emailAssetCreate').checked = notif.email_asset_create ?? true;
    if (document.getElementById('emailAssetMovement')) document.getElementById('emailAssetMovement').checked = notif.email_asset_movement ?? true;
    if (document.getElementById('emailSystemUpdates')) document.getElementById('emailSystemUpdates').checked = notif.email_system_updates ?? false;
    if (document.getElementById('inAppAssetCreate')) document.getElementById('inAppAssetCreate').checked = notif.in_app_asset_create ?? true;
    if (document.getElementById('inAppAssetMovement')) document.getElementById('inAppAssetMovement').checked = notif.in_app_asset_movement ?? true;
    if (document.getElementById('inAppSystemUpdates')) document.getElementById('inAppSystemUpdates').checked = notif.in_app_system_updates ?? false;
    if (document.getElementById('notificationFrequency')) document.getElementById('notificationFrequency').value = notif.notification_frequency || 'instant';
  }

  // Preferences
  if (settings.preferences) {
    const pref = settings.preferences;
    if (document.getElementById('defaultListView')) document.getElementById('defaultListView').value = pref.default_list_view || 'table';
    if (document.getElementById('itemsPerPage')) document.getElementById('itemsPerPage').value = pref.items_per_page || 25;
    if (document.getElementById('autoSave')) document.getElementById('autoSave').checked = pref.auto_save ?? true;
    if (document.getElementById('defaultExportFormat')) document.getElementById('defaultExportFormat').value = pref.default_export_format || 'csv';
    if (pref.dashboard_widgets) {
      const widgets = pref.dashboard_widgets;
      if (document.getElementById('widgetAssets')) document.getElementById('widgetAssets').checked = widgets.assets ?? true;
      if (document.getElementById('widgetMovements')) document.getElementById('widgetMovements').checked = widgets.movements ?? true;
      if (document.getElementById('widgetCategories')) document.getElementById('widgetCategories').checked = widgets.categories ?? true;
      if (document.getElementById('widgetLocations')) document.getElementById('widgetLocations').checked = widgets.locations ?? true;
      if (document.getElementById('widgetRecentActivity')) document.getElementById('widgetRecentActivity').checked = widgets.recent_activity ?? false;
    }
  }

  // Security
  if (settings.security) {
    if (elements.twoFactorEnabled) {
      elements.twoFactorEnabled.checked = settings.security.two_factor_enabled ?? false;
      if (elements.twoFactorInfo) {
        elements.twoFactorInfo.classList.toggle('d-none', !settings.security.two_factor_enabled);
      }
    }
  }
};

const loadActiveSessions = async () => {
  const elements = selectElements();
  if (!elements.activeSessionsList) return;

  try {
    // TODO: Implement API endpoint for active sessions
    elements.activeSessionsList.innerHTML = `
      <div class="text-muted">
        <i class="ti ti-info-circle me-2"></i>
        Oturum yönetimi yakında eklenecek.
      </div>
    `;
  } catch (error) {
    elements.activeSessionsList.innerHTML = `
      <div class="text-danger">
        <i class="ti ti-alert-circle me-2"></i>
        Oturum bilgileri yüklenemedi.
      </div>
    `;
  }
};

const loadLoginHistory = async () => {
  const elements = selectElements();
  if (!elements.loginHistoryList) return;

  try {
    // TODO: Implement API endpoint for login history
    elements.loginHistoryList.innerHTML = `
      <div class="text-muted">
        <i class="ti ti-info-circle me-2"></i>
        Giriş geçmişi yakında eklenecek.
      </div>
    `;
  } catch (error) {
    elements.loginHistoryList.innerHTML = `
      <div class="text-danger">
        <i class="ti ti-alert-circle me-2"></i>
        Giriş geçmişi yüklenemedi.
      </div>
    `;
  }
};

let initialized = false;
const initPage = async () => {
  if (initialized) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
    return;
  }

  initialized = true;
  const elements = selectElements();

  // Form event listeners
  if (elements.appearanceForm) {
    elements.appearanceForm.addEventListener('submit', handleAppearanceSubmit);
  }

  if (elements.notificationForm) {
    elements.notificationForm.addEventListener('submit', handleNotificationSubmit);
  }

  if (elements.preferencesForm) {
    elements.preferencesForm.addEventListener('submit', handlePreferencesSubmit);
  }

  // Two factor toggle
  if (elements.twoFactorEnabled) {
    elements.twoFactorEnabled.addEventListener('change', async (e) => {
      try {
        await updateSettings('security', { two_factor_enabled: e.target.checked });
        if (elements.twoFactorInfo) {
          elements.twoFactorInfo.classList.toggle('d-none', !e.target.checked);
        }
        toggleAlert(elements.preferencesSuccess, 'Güvenlik ayarı güncellendi.', 'success');
      } catch (error) {
        e.target.checked = !e.target.checked;
        toggleAlert(elements.preferencesError, error.message, 'danger');
      }
    });
  }

  // Terminate all sessions
  if (elements.terminateAllSessionsButton) {
    elements.terminateAllSessionsButton.addEventListener('click', async () => {
      if (!confirm('Tüm oturumları sonlandırmak istediğinizden emin misiniz? Bu işlem sizi de çıkış yaptıracaktır.')) {
        return;
      }
      try {
        await updateSettings('security', { terminate_all_sessions: true });
        alert('Tüm oturumlar sonlandırıldı. Yönlendiriliyorsunuz...');
        window.location.href = '/admin/login.html';
      } catch (error) {
        toggleAlert(elements.preferencesError, error.message, 'danger');
      }
    });
  }

  // Load settings
  try {
    const settings = await getSettings();
    renderSettings(settings);
  } catch (error) {
    console.error('Settings load error:', error);
    // Use default settings if API fails
    renderSettings({});
  }

  // Load security data
  loadActiveSessions();
  loadLoginHistory();
};

initPage();

