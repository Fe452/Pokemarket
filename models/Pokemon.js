const db = require('../database/db');

class Pokemon {
    static async findAll() {
        const [rows] = await db.query(`
            SELECT p.*, GROUP_CONCAT(t.nome_tipo SEPARATOR ', ') AS tipos
            FROM pokemon p
            LEFT JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
            LEFT JOIN tipo t ON pt.tipo_id = t.tipo_id
            GROUP BY p.pokemon_id
            ORDER BY p.pokemon_id
        `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(`
            SELECT p.*, GROUP_CONCAT(t.nome_tipo SEPARATOR ', ') AS tipos
            FROM pokemon p
            LEFT JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
            LEFT JOIN tipo t ON pt.tipo_id = t.tipo_id
            WHERE p.pokemon_id = ?
            GROUP BY p.pokemon_id
        `, [id]);
        return rows[0];
    }

    static async findByName(name) {
        const [rows] = await db.query(`
            SELECT p.*, GROUP_CONCAT(t.nome_tipo SEPARATOR ', ') AS tipos
            FROM pokemon p
            LEFT JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
            LEFT JOIN tipo t ON pt.tipo_id = t.tipo_id
            WHERE p.nome_pokemon LIKE ?
            GROUP BY p.pokemon_id
        `, [`%${name}%`]);
        return rows;
    }

    static async findByType(type) {
        const [rows] = await db.query(`
            SELECT p.*, GROUP_CONCAT(t.nome_tipo SEPARATOR ', ') AS tipos
            FROM pokemon p
            INNER JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
            INNER JOIN tipo t ON pt.tipo_id = t.tipo_id
            WHERE t.nome_tipo = ?
            GROUP BY p.pokemon_id
        `, [type]);
        return rows;
    }

    static async create(data) {
        const { nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex, tipos } = data;
        
        const [result] = await db.query(`
            INSERT INTO pokemon (nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex]);

        const pokemonId = result.insertId;

        // Inserir tipos
        if (tipos && tipos.length > 0) {
            for (const tipoNome of tipos) {
                const [tipoRows] = await db.query('SELECT tipo_id FROM tipo WHERE nome_tipo = ?', [tipoNome]);
                if (tipoRows.length > 0) {
                    await db.query('INSERT INTO pokemon_tipo (pokemon_id, tipo_id) VALUES (?, ?)', [pokemonId, tipoRows[0].tipo_id]);
                }
            }
        }

        return pokemonId;
    }

    static async update(id, data) {
        const { nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex } = data;
        
        const [result] = await db.query(`
            UPDATE pokemon 
            SET nome_pokemon = ?, cor = ?, genero = ?, preco = ?, geracao = ?, descricao = ?, estoque = ?, numero_pokedex = ?
            WHERE pokemon_id = ?
        `, [nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex, id]);

        return result;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM pokemon WHERE pokemon_id = ?', [id]);
        return result;
    }

    static async updateStock(id, quantity) {
        const [result] = await db.query(`
            UPDATE pokemon 
            SET estoque = estoque - ? 
            WHERE pokemon_id = ? AND estoque >= ?
        `, [quantity, id, quantity]);
        return result;
    }

    static async findLowStock(threshold = 5) {
        const [rows] = await db.query(`
            SELECT p.*, GROUP_CONCAT(t.nome_tipo SEPARATOR ', ') AS tipos
            FROM pokemon p
            LEFT JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
            LEFT JOIN tipo t ON pt.tipo_id = t.tipo_id
            WHERE p.estoque <= ?
            GROUP BY p.pokemon_id
        `, [threshold]);
        return rows;
    }

    static async getAllTypes() {
        const [rows] = await db.query('SELECT * FROM tipo ORDER BY nome_tipo');
        return rows;
    }
}

module.exports = Pokemon;