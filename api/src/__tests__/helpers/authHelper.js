/**
 * Auth Helper for Integration Tests
 * 
 * Test ortamında JWT token oluşturma ve auth header'ları hazırlama için helper fonksiyonlar
 */

const jwt = require('jsonwebtoken');
const ROLES = require('../../constants/roles');

// Auth middleware ile aynı secret key kullanılmalı
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * Test kullanıcısı için JWT token oluşturur
 * 
 * @param {Object} user - Kullanıcı bilgileri
 * @param {number} user.id - Kullanıcı ID
 * @param {number} user.role_id - Rol ID (default: USER)
 * @param {number} user.municipality_id - Belediye ID (opsiyonel)
 * @returns {string} JWT token
 */
const generateTestToken = (user = {}) => {
  const payload = {
    id: user.id || 1,
    role_id: user.role_id || ROLES.USER,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Test için auth header'ı oluşturur
 * 
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Object} { Authorization: 'Bearer <token>' }
 */
const getAuthHeader = (user = {}) => {
  const token = generateTestToken(user);
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Cookie formatında auth header'ı oluşturur
 * 
 * @param {Object} user - Kullanıcı bilgileri
 * @returns {Object} Cookie header objesi
 */
const getAuthCookie = (user = {}) => {
  const token = generateTestToken(user);
  return {
    Cookie: `token=${token}`,
  };
};

/**
 * Superadmin için token oluşturur
 */
const getSuperadminToken = () => {
  return generateTestToken({
    id: 1,
    role_id: ROLES.SUPERADMIN,
  });
};

/**
 * Municipality admin için token oluşturur
 */
const getMunicipalityAdminToken = (municipalityId = 1) => {
  return generateTestToken({
    id: 2,
    role_id: ROLES.MUNICIPALITY_ADMIN,
    municipality_id: municipalityId,
  });
};

/**
 * Normal user için token oluşturur
 */
const getUserToken = (municipalityId = 1) => {
  return generateTestToken({
    id: 3,
    role_id: ROLES.USER,
    municipality_id: municipalityId,
  });
};

module.exports = {
  generateTestToken,
  getAuthHeader,
  getAuthCookie,
  getSuperadminToken,
  getMunicipalityAdminToken,
  getUserToken,
};

