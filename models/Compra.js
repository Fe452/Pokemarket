const db = require('../database/db');

class Compra {
    static async create(clienteId, items) {
        // Calcular total
        let total = 0;
        for (const item of items) {
            total += item.preco_unitario * item.quantidade;
        }

        // Inserir compra
        const [result] = await db.query(
            'INSERT INTO compra (cliente_id, preco) VALUES (?, ?)',
            [clienteId, total]
        );

        const compraId = result.insertId;

        // Inserir itens
        for (const item of items) {
            await db.query(
                'INSERT INTO item_compra (compra_id, pokemon_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                [compraId, item.pokemon_id, item.quantidade, item.preco_unitario]
            );
        }

        return compraId;
    }

    static async findByClienteId(clienteId) {
        const [rows] = await db.query(`
            SELECT c.nf_id, c.data_compra, c.preco AS total,
                   GROUP_CONCAT(CONCAT(ic.quantidade, 'x ', p.nome_pokemon) SEPARATOR ', ') AS itens
            FROM compra c
            INNER JOIN item_compra ic ON c.nf_id = ic.compra_id
            INNER JOIN pokemon p ON ic.pokemon_id = p.pokemon_id
            WHERE c.cliente_id = ?
            GROUP BY c.nf_id
            ORDER BY c.data_compra DESC
        `, [clienteId]);
        return rows;
    }

    static async findAll() {
        const [rows] = await db.query(`
            SELECT c.nf_id, c.data_compra, c.preco AS total,
                   cl.nome_cliente,
                   GROUP_CONCAT(CONCAT(ic.quantidade, 'x ', p.nome_pokemon) SEPARATOR ', ') AS itens
            FROM compra c
            INNER JOIN cliente cl ON c.cliente_id = cl.cliente_id
            INNER JOIN item_compra ic ON c.nf_id = ic.compra_id
            INNER JOIN pokemon p ON ic.pokemon_id = p.pokemon_id
            GROUP BY c.nf_id
            ORDER BY c.data_compra DESC
        `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(`
            SELECT c.*, cl.nome_cliente
            FROM compra c
            INNER JOIN cliente cl ON c.cliente_id = cl.cliente_id
            WHERE c.nf_id = ?
        `, [id]);
        return rows[0];
    }

    static async getItems(compraId) {
        const [rows] = await db.query(`
            SELECT ic.*, p.nome_pokemon, p.cor, p.genero, p.numero_pokedex
            FROM item_compra ic
            INNER JOIN pokemon p ON ic.pokemon_id = p.pokemon_id
            WHERE ic.compra_id = ?
        `, [compraId]);
        return rows;
    }

    static async saveItemsToCart(clienteId, items) {
        // Limpar carrinho atual
        await db.query('DELETE FROM item_carrinho WHERE cliente_id = ?', [clienteId]);
        // Inserir novos itens
        for (const item of items) {
            await db.query(
                'INSERT INTO item_carrinho (cliente_id, pokemon_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)',
                [clienteId, item.pokemon_id, item.quantidade]
            );
        }
    }

    static async getCartItems(clienteId) {
        const [rows] = await db.query(`
            SELECT ic.pokemon_id, ic.quantidade, p.nome_pokemon, 
                p.preco AS preco_unitario, p.numero_pokedex
            FROM item_carrinho ic
            INNER JOIN pokemon p ON ic.pokemon_id = p.pokemon_id
            WHERE ic.cliente_id = ?
        `, [clienteId]);
        return rows;
    }

    static async createCartItem(clienteId, pokemonId, quantidade) {
        await db.query(
            'INSERT INTO item_carrinho (cliente_id, pokemon_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)',
            [clienteId, pokemonId, quantidade]
        );
    }

    static async removeCartItem(clienteId, pokemonId) {
        await db.query(
            'DELETE FROM item_carrinho WHERE cliente_id = ? AND pokemon_id = ?',
            [clienteId, pokemonId]
        );
    }

    static async clearCart(clienteId) {
        await db.query('DELETE FROM item_carrinho WHERE cliente_id = ?', [clienteId]);
    }
}

module.exports = Compra;