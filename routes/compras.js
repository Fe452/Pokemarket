const express = require('express');
const router = express.Router();
const Compra = require('../models/Compra');
const Pokemon = require('../models/Pokemon');

//const db = require('../database/db');

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Carrinho de compras
router.get('/carrinho', isAuthenticated, async (req, res) => {
    let cart = await Compra.getCartItems(req.session.user.id) || req.session.cart || [];
    let total = 0;
    let totalItems = 0;

    cart.forEach(item => {
        total += Number(item.preco_unitario) * item.quantidade;
        totalItems += item.quantidade;
    });

    res.render('compras/carrinho', {
        title: 'Carrinho - PokeMarket',
        cart,
        total,
        totalItems,
        user: req.session.user
    });

});

router.post('/carrinho/adicionar', isAuthenticated, async (req, res) => {
    try {
        const { pokemon_id, quantidade } = req.body;
        const pokemon = await Pokemon.findById(pokemon_id);
        const userId = req.session.user.id;

        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon não encontrado' });
        }

        if (pokemon.estoque < parseInt(quantidade)) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        // Insere ou atualiza no banco de dados
        await Compra.createCartItem(userId, pokemon_id, parseInt(quantidade));

        // Atualiza a sessão para manter sincronizado se necessário
        if (!req.session.cart) req.session.cart = [];
        const existingItem = req.session.cart.find(item => item.pokemon_id === parseInt(pokemon_id));
        if (existingItem) {
            existingItem.quantidade += parseInt(quantidade);
        } else {
            req.session.cart.push({
                pokemon_id: parseInt(pokemon_id),
                quantidade: parseInt(quantidade),
                preco_unitario: pokemon.preco,
                nome_pokemon: pokemon.nome_pokemon
            });
        }

        // BUSCA A CONTAGEM REAL DIRETO DO BANCO PARA RESPONDER AO AJAX
        const cartItems = await Compra.getCartItems(userId);
        const realCartCount = cartItems.reduce((acc, item) => acc + item.quantidade, 0);

        res.json({ success: true, cartCount: realCartCount });
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
    }
});
// Adicionar ao carrinho
/*router.post('/carrinho/adicionar', isAuthenticated, async (req, res) => {
    try {
        const { pokemon_id, quantidade } = req.body;
        const pokemon = await Pokemon.findById(pokemon_id);
        const userId = req.session.user.id;

        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon não encontrado' });
        }

        if (pokemon.estoque < parseInt(quantidade)) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const existingItem = req.session.cart.find(item => item.pokemon_id === parseInt(pokemon_id));

        if (existingItem) {
            existingItem.quantidade += parseInt(quantidade);
        } else {
            await Compra.createCartItem(userId, pokemon_id, parseInt(quantidade), pokemon.preco);
            req.session.cart.push({
                pokemon_id: parseInt(pokemon_id),
                quantidade: parseInt(quantidade),
                preco_unitario: pokemon.preco,
                nome_pokemon: pokemon.nome_pokemon
            });
        }

        res.json({ success: true, cartCount: req.session.cart.reduce((acc, item) => acc + item.quantidade, 0) });
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
    }
});*/

// Remover do carrinho
router.post('/carrinho/remover', isAuthenticated, async (req, res) => {
    try {
        const { pokemon_id } = req.body; // Recebe o ID do Pokémon enviado pelo form
        const cliente_id = req.session.user.id;

        // Executa a deleção no banco de dados
        await Compra.removeCartItem(cliente_id, pokemon_id);

        res.redirect('/compras/carrinho');
    } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
        res.redirect('/compras/carrinho?error=Erro ao remover item');
    }
});


// Finalizar compra
/*router.post('/finalizar', isAuthenticated, async (req, res) => {
    try {
        const cart = req.session.cart || [];
        
        if (cart.length === 0) {
            return res.redirect('/compras/carrinho?error=Carrinho vazio');
        }

        const items = cart.map(item => ({
            pokemon_id: item.pokemon_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario
        }));

        // Verificar estoque antes de finalizar
        for (const item of items) {
            const pokemon = await Pokemon.findById(item.pokemon_id);
            if (!pokemon || pokemon.estoque < item.quantidade) {
                return res.redirect('/compras/carrinho?error=Estoque insuficiente para ' + pokemon.nome_pokemon);
            }
        }

        const compraId = await Compra.create(req.session.user.id, items);

        // Limpar carrinho
        req.session.cart = [];
        await Compra.clearCart(req.session.user.id);

        res.redirect(`/compras/sucesso/${compraId}`);
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        res.redirect('/compras/carrinho?error=Erro ao finalizar compra');
    }
});*/

// Finalizar compra
router.post('/finalizar', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // 1. Busca os itens DIRETO DO BANCO DE DADOS, ignorando a sessão
        const cart = await Compra.getCartItems(userId);
        
        if (!cart || cart.length === 0) {
            return res.redirect('/compras/carrinho?error=Carrinho vazio');
        }

        // 2. Formata os itens para o modelo esperado pela função de criar compra
        const items = cart.map(item => ({
            pokemon_id: item.pokemon_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            nome_pokemon: item.nome_pokemon
        }));

        // 3. Verificar estoque no banco antes de finalizar
        for (const item of items) {
            const pokemon = await Pokemon.findById(item.pokemon_id);
            if (!pokemon || pokemon.estoque < item.quantidade) {
                return res.redirect('/compras/carrinho?error=Estoque insuficiente para ' + item.nome_pokemon);
            }
        }

        // 4. Cria o registro na tabela 'compra' e insere na 'item_compra'
        const compraId = await Compra.create(userId, items);

        // 5. Limpar carrinho
        req.session.cart = []; // Limpa a memória por precaução
        await Compra.clearCart(userId); // Exclui os itens da tabela item_carrinho

        // Obs: O estoque do Pokémon será abatido automaticamente pelo 
        // TRIGGER 'trg_atualiza_estoque_apos_venda' que você já configurou no SQL!

        res.redirect(`/compras/sucesso/${compraId}`);
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        res.redirect('/compras/carrinho?error=Erro ao finalizar compra');
    }
});

/*router.get('/carrinho', isAuthenticated, async (req, res) => {
    try {
        const cliente_id = req.session.user.id;

        // Busca os itens do carrinho no banco de dados
        const [cart] = await Compra.getCartItems(cliente_id); ;

        let total = 0;
        let totalItems = 0;

        // O array retornado do banco de dados substitui o req.session.cart
        cart.forEach(item => {
            total += Number(item.preco_unitario) * item.quantidade;
            totalItems += item.quantidade;
            // Se precisar da imagem como no seu código original:
            item.imagem = item.nome_pokemon.toLowerCase(); 
        });

        res.render('compras/carrinho', {
            title: 'Carrinho - PokeMarket',
            cart,
            total,
            totalItems,
            user: req.session.user
        });
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        res.status(500).send("Erro interno no servidor");
    }
});

router.post('/carrinho/adicionar', isAuthenticated, async (req, res) => {
    try {
        const { pokemon_id, quantidade } = req.body;
        const cliente_id = req.session.user.id;

        // 1. Verifica se o Pokémon existe e tem estoque
        const [pokemon] = await db.query('SELECT estoque FROM pokemon WHERE pokemon_id = ?', [pokemon_id]);

        if (pokemon.length === 0) {
            return res.status(404).json({ error: 'Pokémon não encontrado' });
        }
        if (pokemon[0].estoque < parseInt(quantidade)) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        // 2. Insere ou atualiza o item no banco de dados (Tabela item_carrinho)
        await db.query('INSERT INTO item_carrinho (cliente_id, pokemon_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)', [cliente_id, pokemon_id, parseInt(quantidade)]);

        // 3. Pega a quantidade total do carrinho para atualizar o ícone no frontend
        const [totalRows] = await db.query('SELECT SUM(quantidade) as total FROM item_carrinho WHERE cliente_id = ?', [cliente_id]);

        res.json({ success: true, cartCount: totalRows[0].total || 0 });
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
    }
});
router.post('/finalizar', isAuthenticated, async (req, res) => {
    try {
        const cliente_id = req.session.user.id;

        // 1. Pega tudo que está no carrinho do cliente
        const [cart] = await db.query('SELECT ic.pokemon_id, ic.quantidade, p.preco FROM item_carrinho ic JOIN pokemon p ON ic.pokemon_id = p.pokemon_idWHERE ic.cliente_id = ?', [cliente_id]);

        if (cart.length === 0) {
            return res.redirect('/compras/carrinho?error=Carrinho vazio');
        }

        // 2. Calcula o valor total da compra
        let valorTotal = cart.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);

        // 3. Insere o registro na tabela "compra" (Gera o nf_id)
        const [novaCompra] = await db.query(
            'INSERT INTO compra (cliente_id, preco) VALUES (?, ?)', 
            [cliente_id, valorTotal]
        );
        const nf_id = novaCompra.insertId; // Pega o ID gerado pelo AUTO_INCREMENT

        // 4. Passa os itens do carrinho para a tabela "item_compra" e abate o estoque
        for (const item of cart) {
            await db.query(
                'INSERT INTO item_compra (compra_id, pokemon_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                [nf_id, item.pokemon_id, item.quantidade, item.preco]
            );

            // Abate o estoque do Pokémon!
            await db.query('UPDATE pokemon SET estoque = estoque - ? WHERE pokemon_id = ?', [item.quantidade, item.pokemon_id]);
        }

        // 5. Limpa a tabela do carrinho para este usuário (Delete)
        await db.query('DELETE FROM item_carrinho WHERE cliente_id = ?', [cliente_id]);

        res.redirect(`/compras/sucesso/${nf_id}`);
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        res.redirect('/compras/carrinho?error=Erro ao finalizar compra');
    }
});*/

// Sucesso na compra
router.get('/sucesso/:id', isAuthenticated, async (req, res) => {
    try {
        const compra = await Compra.findById(req.params.id);
        const items = await Compra.getItems(req.params.id);

        res.render('compras/sucesso', {
            title: 'Compra Confirmada - PokeMarket',
            compra,
            items,
            user: req.session.user
        });
    } catch (error) {
        console.error('Erro ao buscar compra:', error);
        res.redirect('/pokemon');
    }
});

// Histórico de compras
router.get('/historico', isAuthenticated, async (req, res) => {
    try {
        let compras;
        
        if (req.session.user.role === 'Administrador') {
            compras = await Compra.findAll();
        } else {
            compras = await Compra.findByClienteId(req.session.user.id);
        }

        res.render('compras/historico', {
            title: 'Histórico de Compras - PokeMarket',
            compras,
            isAdmin: req.session.user.role === 'Administrador',
            user: req.session.user
        });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.render('error', {
            title: 'Erro',
            message: 'Erro ao carregar histórico'
        });
    }
});

module.exports = router;