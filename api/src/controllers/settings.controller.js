const knex = require('../config/knex');

/**
 * Kullanıcı ayarlarını getirir
 */
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    let settings = await knex('user_settings')
      .where('user_id', userId)
      .first();

    // Eğer ayarlar yoksa varsayılan ayarları oluştur
    if (!settings) {
      settings = await createDefaultSettings(userId);
    }

    // JSON alanlarını parse et
    const notificationPreferences = typeof settings.notification_preferences === 'string'
      ? JSON.parse(settings.notification_preferences)
      : settings.notification_preferences || {};

    const preferences = typeof settings.preferences === 'string'
      ? JSON.parse(settings.preferences)
      : settings.preferences || {};

    const securitySettings = typeof settings.security_settings === 'string'
      ? JSON.parse(settings.security_settings)
      : settings.security_settings || {};

    return res.json({
      settings: {
        appearance: {
          theme_mode: settings.theme_mode || 'light',
          color_theme: settings.color_theme || 'theme-default',
          language: settings.language || 'tr',
          date_format: settings.date_format || 'DD/MM/YYYY',
          time_format: settings.time_format || '24',
          timezone: settings.timezone || 'Europe/Istanbul',
        },
        notifications: notificationPreferences,
        preferences: preferences,
        security: securitySettings,
      },
    });
  } catch (error) {
    console.error('settings.getSettings hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Görünüm ayarlarını günceller
 */
exports.updateAppearance = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { theme_mode, color_theme, language, date_format, time_format, timezone } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    // Ayarlar tablosunda kayıt var mı kontrol et
    let settings = await knex('user_settings')
      .where('user_id', userId)
      .first();

    const updateData = {
      updated_at: knex.fn.now(),
    };

    if (theme_mode !== undefined) updateData.theme_mode = theme_mode;
    if (color_theme !== undefined) updateData.color_theme = color_theme;
    if (language !== undefined) updateData.language = language;
    if (date_format !== undefined) updateData.date_format = date_format;
    if (time_format !== undefined) updateData.time_format = time_format;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (settings) {
      await knex('user_settings')
        .where('user_id', userId)
        .update(updateData);
    } else {
      await createDefaultSettings(userId, updateData);
    }

    return res.json({
      message: 'Görünüm ayarları güncellendi',
    });
  } catch (error) {
    console.error('settings.updateAppearance hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Bildirim ayarlarını günceller
 */
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationPreferences = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    let settings = await knex('user_settings')
      .where('user_id', userId)
      .first();

    const currentPreferences = settings?.notification_preferences
      ? (typeof settings.notification_preferences === 'string'
          ? JSON.parse(settings.notification_preferences)
          : settings.notification_preferences)
      : {};

    const updatedPreferences = {
      ...currentPreferences,
      ...notificationPreferences,
    };

    const updateData = {
      notification_preferences: JSON.stringify(updatedPreferences),
      updated_at: knex.fn.now(),
    };

    if (settings) {
      await knex('user_settings')
        .where('user_id', userId)
        .update(updateData);
    } else {
      await createDefaultSettings(userId, updateData);
    }

    return res.json({
      message: 'Bildirim ayarları güncellendi',
    });
  } catch (error) {
    console.error('settings.updateNotifications hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Kişisel tercihleri günceller
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const preferences = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    let settings = await knex('user_settings')
      .where('user_id', userId)
      .first();

    const currentPreferences = settings?.preferences
      ? (typeof settings.preferences === 'string'
          ? JSON.parse(settings.preferences)
          : settings.preferences)
      : {};

    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    const updateData = {
      preferences: JSON.stringify(updatedPreferences),
      updated_at: knex.fn.now(),
    };

    if (settings) {
      await knex('user_settings')
        .where('user_id', userId)
        .update(updateData);
    } else {
      await createDefaultSettings(userId, updateData);
    }

    return res.json({
      message: 'Tercihler güncellendi',
    });
  } catch (error) {
    console.error('settings.updatePreferences hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Güvenlik ayarlarını günceller
 */
exports.updateSecurity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const securityData = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    let settings = await knex('user_settings')
      .where('user_id', userId)
      .first();

    const currentSecurity = settings?.security_settings
      ? (typeof settings.security_settings === 'string'
          ? JSON.parse(settings.security_settings)
          : settings.security_settings)
      : {};

    const updatedSecurity = {
      ...currentSecurity,
      ...securityData,
    };

    // terminate_all_sessions flag'ini kaldır (sadece işlem için kullanılıyor)
    delete updatedSecurity.terminate_all_sessions;

    const updateData = {
      security_settings: JSON.stringify(updatedSecurity),
      updated_at: knex.fn.now(),
    };

    if (settings) {
      await knex('user_settings')
        .where('user_id', userId)
        .update(updateData);
    } else {
      await createDefaultSettings(userId, updateData);
    }

    // Eğer tüm oturumları sonlandırma isteniyorsa
    if (securityData.terminate_all_sessions) {
      // TODO: Oturum yönetimi implementasyonu
      // Şimdilik sadece başarı mesajı döndürüyoruz
    }

    return res.json({
      message: 'Güvenlik ayarları güncellendi',
    });
  } catch (error) {
    console.error('settings.updateSecurity hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * Varsayılan ayarları oluşturur
 */
const createDefaultSettings = async (userId, additionalData = {}) => {
  const defaultSettings = {
    user_id: userId,
    theme_mode: 'light',
    color_theme: 'theme-default',
    language: 'tr',
    date_format: 'DD/MM/YYYY',
    time_format: '24',
    timezone: 'Europe/Istanbul',
    notification_preferences: JSON.stringify({
      email_asset_create: true,
      email_asset_movement: true,
      email_system_updates: false,
      email_security_alerts: true,
      in_app_asset_create: true,
      in_app_asset_movement: true,
      in_app_system_updates: false,
      notification_frequency: 'instant',
    }),
    preferences: JSON.stringify({
      default_list_view: 'table',
      items_per_page: 25,
      auto_save: true,
      default_export_format: 'csv',
      dashboard_widgets: {
        assets: true,
        movements: true,
        categories: true,
        locations: true,
        recent_activity: false,
      },
    }),
    security_settings: JSON.stringify({
      two_factor_enabled: false,
    }),
    ...additionalData,
  };

  const [id] = await knex('user_settings').insert(defaultSettings).returning('id');
  return await knex('user_settings').where('id', id).first();
};

