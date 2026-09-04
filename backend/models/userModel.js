const db = require('../config/db');

const userModel = {
    async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
    async findByName(name) {
        const [rows] = await db.query('SELECT * FROM users WHERE name = ?', [name]);
        return rows[0];
    },
    async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    },
    async create(name, email, passwordHash) {
        const [result] = await db.query('INSERT INTO users(name, email, password_hash) VALUES (?,?,?)', [name, email, passwordHash]);
        return result.insertId;
    },
    async updateUser(id, name, passwordHash) {
        const [result] = await db.query('UPDATE users SET name = ?, password_hash = ? WHERE id = ?', [name, passwordHash, id]);
        return result;
    }
};

module.exports = userModel;