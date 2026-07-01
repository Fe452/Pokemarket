const db = require('../database/db');
const bcrypt = require('bcryptjs');

class Cliente {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM cliente WHERE email = ?', [email]);
        return rows[0];
    }

    static async findByCpf(cpf) {
        const [rows] = await db.query('SELECT * FROM cliente WHERE cpf = ?', [cpf]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM cliente WHERE cliente_id = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.query(`
            SELECT c.*, 
                   GROUP_CONCAT(CONCAT(e.rua, ', ', e.numero, ' - ', e.cidade, '/', e.estado) SEPARATOR ' | ') AS enderecos
            FROM cliente c
            LEFT JOIN cliente_endereco ce ON c.cliente_id = ce.cliente_id
            LEFT JOIN endereco e ON ce.endereco_id = e.endereco_id
            GROUP BY c.cliente_id
            ORDER BY c.nome_cliente
        `);
        return rows;
    }

    static async create(data) {
        const { nome_cliente, email, cpf, senha, telefone } = data;
        const hashedPassword = await bcrypt.hash(senha, 10);

        const [result] = await db.query(
            'INSERT INTO cliente (nome_cliente, email, cpf, senha, telefone) VALUES (?, ?, ?, ?, ?)',
            [nome_cliente, email, cpf, hashedPassword, telefone]
        );

        return result.insertId;
    }

    static async update(id, data) {
        const { nome_cliente, email, telefone } = data;
        const [result] = await db.query(
            'UPDATE cliente SET nome_cliente = ?, email = ?, telefone = ? WHERE cliente_id = ?',
            [nome_cliente, email, telefone, id]
        );
        return result;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM cliente WHERE cliente_id = ?', [id]);
        return result;
    }

    static async addEndereco(clienteId, enderecoId) {
        const [result] = await db.query(
            'INSERT INTO cliente_endereco (cliente_id, endereco_id) VALUES (?, ?)',
            [clienteId, enderecoId]
        );
        return result;
    }

    static async getEnderecos(clienteId) {
        const [rows] = await db.query(`
            SELECT e.* 
            FROM endereco e
            INNER JOIN cliente_endereco ce ON e.endereco_id = ce.endereco_id
            WHERE ce.cliente_id = ?
        `, [clienteId]);
        return rows;
    }

    static async authenticate(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.senha);
        if (!isValid) return null;

        return user;
    }
    static async updatePassword(id, novaSenhaHashed) {
            const [result] = await db.query(
                'UPDATE cliente SET senha = ? WHERE cliente_id = ?',
                [novaSenhaHashed, id]
            );
            return result;
        }
    
    static async adicionarEnderecoCompleto(clienteId, dadosEndereco) {
        const { rua, bairro, numero, cidade, estado, cep } = dadosEndereco;
        const [resultEndereco] = await db.query(
            'INSERT INTO endereco (rua, bairro, numero, cidade, estado, cep) VALUES (?, ?, ?, ?, ?, ?)',
            [rua, bairro, numero, cidade, estado, cep]
        );
        const enderecoId = resultEndereco.insertId;

        await this.addEndereco(clienteId, enderecoId);
        
        return enderecoId;
    }

    static async removeEndereco(clienteId, enderecoId) {
        await db.query('DELETE FROM cliente_endereco WHERE cliente_id = ? AND endereco_id = ?', [clienteId, enderecoId]);
        await db.query('DELETE FROM endereco WHERE endereco_id = ?', [enderecoId]);
    }

}


module.exports = Cliente;