const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');

// Tela de login
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/pokemon');
    }
    res.render('auth/login', {
        title: 'Login - PokeMarket',
        layout: 'main'
    });
});

// Tela de registro
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Registro - PokeMarket',
        layout: 'main'
    });
});

// Processar login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        const user = await Cliente.authenticate(email, senha);
        
        if (!user) {
            return res.render('auth/login', {
                title: 'Login - PokeMarket',
                error: 'Email ou senha inválidos',
                layout: 'main'
            });
        }

        req.session.user = {
            id: user.cliente_id,
            name: user.nome_cliente,
            email: user.email,
            role: user.cliente_id === 1 ? 'Administrador' : 'Cliente'
        };

        res.redirect('/pokemon');
    } catch (error) {
        console.error('Erro no login:', error);
        res.render('auth/login', {
            title: 'Login - PokeMarket',
            error: 'Erro ao fazer login',
            layout: 'main'
        });
    }
});

// Processar registro
router.post('/register', async (req, res) => {
    try {
        const { nome_cliente, email, cpf, senha, confirmar_senha, telefone } = req.body;

        if (senha !== confirmar_senha) {
            return res.render('auth/register', {
                title: 'Registro - PokeMarket',
                error: 'As senhas não coincidem',
                layout: 'main'
            });
        }

        const existingEmail = await Cliente.findByEmail(email);
        if (existingEmail) {
            return res.render('auth/register', {
                title: 'Registro - PokeMarket',
                error: 'Este email já está cadastrado',
                layout: 'main'
            });
        }

        const existingCpf = await Cliente.findByCpf(cpf);
        if (existingCpf) {
            return res.render('auth/register', {
                title: 'Registro - PokeMarket',
                error: 'Este CPF já está cadastrado',
                layout: 'main'
            });
        }

        await Cliente.create({ nome_cliente, email, cpf, senha, telefone });

        res.render('auth/login', {
            title: 'Login - PokeMarket',
            success: 'Conta criada com sucesso! Faça login.',
            layout: 'main'
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.render('auth/register', {
            title: 'Registro - PokeMarket',
            error: 'Erro ao criar conta',
            layout: 'main'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;