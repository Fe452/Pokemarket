const express = require('express');
const router = express.Router();
const Pokemon = require('../models/Pokemon');
const db = require('../database/db');

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Listar Pokémon com filtros
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { search, type, sort } = req.query;
        let pokemons = [];
        let selectedType = type || 'Todos';

        if (search) {
            pokemons = await Pokemon.findByName(search);
        } else if (type && type !== 'Todos') {
            pokemons = await Pokemon.findByType(type);
        } else {
            pokemons = await Pokemon.findAll();
        }

        pokemons = pokemons.map(p => {
    return {
        ...p,
        // Transforma "Planta, Venenoso" em ['Planta', 'Venenoso']
        tipos_array: p.tipos ? p.tipos.split(', ') : [] 
    };
});
        // Buscar todos os tipos para o filtro
        const tipos = await Pokemon.getAllTypes();
        const tiposList = ['Todos', ...tipos.map(t => t.nome_tipo)];

        // Ordenação
        if (sort) {
    switch(sort) {
        case 'id-desc': // <-- ADICIONE ESTE CASO
            pokemons.sort((a, b) => b.pokemon_id - a.pokemon_id);
            break;
        case 'name-asc':
            pokemons.sort((a, b) => a.nome_pokemon.localeCompare(b.nome_pokemon));
            break;
        case 'name-desc':
            pokemons.sort((a, b) => b.nome_pokemon.localeCompare(a.nome_pokemon));
            break;
        case 'price-asc':
            pokemons.sort((a, b) => a.preco - b.preco);
            break;
        case 'price-desc':
            pokemons.sort((a, b) => b.preco - a.preco);
            break;
        default:
            pokemons.sort((a, b) => a.pokemon_id - b.pokemon_id);
    }
}

        // Calcular estoque total
        const totalStock = pokemons.reduce((acc, p) => acc + p.estoque, 0);

        res.render('pokemon/index', {
            title: 'Vitrine - PokeMarket',
            pokemons,
            tipos: tiposList,
            selectedType,
            searchQuery: search || '',
            sortBy: sort || 'id-asc',
            totalStock,
            user: req.session.user
        });
    } catch (error) {
        console.error('Erro ao listar Pokémon:', error);
        res.render('error', {
            title: 'Erro',
            message: 'Erro ao carregar Pokémon'
        });
    }
});

// Detalhes do Pokémon (AJAX)
router.get('/detalhes/:id', isAuthenticated, async (req, res) => {
    try {
        const pokemon = await Pokemon.findById(req.params.id);
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokémon não encontrado' });
        }

        // Buscar tipos separadamente
        const [tipos] = await db.query(`
            SELECT t.nome_tipo 
            FROM tipo t
            INNER JOIN pokemon_tipo pt ON t.tipo_id = pt.tipo_id
            WHERE pt.pokemon_id = ?
        `, [req.params.id]);

        pokemon.tipos_array = tipos.map(t => t.nome_tipo);

        res.json(pokemon);
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
});

// CRUD - Listar 
router.get('/gerenciar', isAuthenticated, async (req, res) => {
    try {
        const pokemons = await Pokemon.findAll();
        const tipos = await Pokemon.getAllTypes();

        res.render('pokemon/crud', {
            title: 'Gerenciar Pokémon - PokeMarket',
            pokemons,
            tipos,
            user: req.session.user
        });
    } catch (error) {
        console.error('Erro ao gerenciar Pokémon:', error);
        res.render('error', {
            title: 'Erro',
            message: 'Erro ao carregar página de gerenciamento'
        });
    }
});

// Criar Pokémon (POST)
router.post('/criar', isAuthenticated, async (req, res) => {
    try {
        const { nome_pokemon, cor, genero, preco, geracao, descricao, estoque, tipos } = req.body;
        
        const tiposArray = tipos ? (Array.isArray(tipos) ? tipos : [tipos]) : [];

        await Pokemon.create({
            nome_pokemon,
            cor,
            genero,
            preco: parseFloat(preco),
            geracao: parseInt(geracao),
            descricao,
            estoque: parseInt(estoque),
            tipos: tiposArray
        });

        res.redirect('/pokemon/gerenciar');
    } catch (error) {
        console.error('Erro ao criar Pokémon:', error);
        res.redirect('/pokemon/gerenciar?error=Erro ao criar Pokémon');
    }
});

// Editar Pokémon (POST)
router.post('/editar/:id', isAuthenticated, async (req, res) => {
    try {
        const { nome_pokemon, cor, genero, preco, geracao, descricao, estoque } = req.body;

        await Pokemon.update(req.params.id, {
            nome_pokemon,
            cor,
            genero,
            preco: parseFloat(preco),
            geracao: parseInt(geracao),
            descricao,
            estoque: parseInt(estoque)
        });

        res.redirect('/pokemon/gerenciar');
    } catch (error) {
        console.error('Erro ao editar Pokémon:', error);
        res.redirect('/pokemon/gerenciar?error=Erro ao editar Pokémon');
    }
});

// Excluir Pokémon (POST)
router.post('/excluir/:id', isAuthenticated, async (req, res) => {
    try {
        await Pokemon.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir Pokémon:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir Pokémon' });
    }
});

module.exports = router;