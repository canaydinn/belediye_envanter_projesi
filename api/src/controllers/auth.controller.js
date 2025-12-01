const knex = require('../config/knex');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await knex('users').where({ username }).first();

    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Şifre hatalı' });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // prod'da true + sameSite:'strict'
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    console.error('Login hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Çıkış yapıldı' });
};
