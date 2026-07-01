const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const Cliente = require('../models/Cliente');

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

/* Rota simples para gerenciar usuários (apenas para administradores)
router.get('/gerenciar', isAuthenticated, (req, res) => {
    // Verificar se é administrador
    if (req.session.user.role !== 'Administrador') {
        return res.status(403).render('error', {
            title: 'Acesso Negado',
            message: 'Você não tem permissão para acessar esta página'
        });
    }
    
    res.render('users/gerenciar', {
        title: 'Gerenciar Usuários - PokeMarket',
        user: req.session.user
    });
});*/

router.get('/configuracoes', isAuthenticated, async (req, res) => {
    try {
        const clienteId = req.session.user.id;
        const enderecos = await Cliente.getEnderecos(clienteId);

        res.render('users/config_user', {
            title: 'Configurações - PokeMarket',
            user: req.session.user,
            enderecos: enderecos,
            pode_excluir: enderecos.length > 1,
            activePage: 'configuracoes'
        });
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        res.status(500).send("Erro interno no servidor");
    }
});

router.post('/configuracoes/atualizar', isAuthenticated, async (req, res) => {
    try {
        const clienteId = req.session.user.id;
        const { nome, email, telefone, nova_senha, confirmar_senha } = req.body;
        const dadosAtualizados = { nome_cliente: nome, email, telefone };

        if (nova_senha && nova_senha.trim() !== '') {
            if (nova_senha !== confirmar_senha) {
                return res.redirect('/users/configuracoes?error=As senhas não coincidem');
            }
            dadosAtualizados.senha = await bcrypt.hash(nova_senha, 10);
        }

        await Cliente.update(clienteId, dadosAtualizados);

        req.session.user.nome_cliente = nome;
        req.session.user.email = email;
        req.session.user.telefone = telefone;

        res.redirect('/users/configuracoes?success=Perfil atualizado com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.redirect('/users/configuracoes?error=Erro ao atualizar perfil');
    }
});

router.post('/enderecos/adicionar', isAuthenticated, async (req, res) => {
    try {
        const clienteId = req.session.user.id;
        await Cliente.adicionarEnderecoCompleto(clienteId, req.body);
        
        res.redirect('/users/configuracoes?success=Endereço adicionado com sucesso');
    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.redirect('/users/configuracoes?error=Erro ao adicionar endereço');
    }
});

router.post('/enderecos/excluir/:id', isAuthenticated, async (req, res) => {
    try {
        const clienteId = req.session.user.id;
        const enderecoId = req.params.id;

        const enderecosAtuais = await Cliente.getEnderecos(clienteId);
        
        if (enderecosAtuais.length <= 1) {
            return res.redirect('/users/configuracoes?error=Você não pode deletar seu único endereço.');
        }

        await Cliente.removeEndereco(clienteId, enderecoId);
        
        res.redirect('/users/configuracoes?success=Endereço removido com sucesso');
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        res.redirect('/users/configuracoes?error=Erro ao excluir endereço');
    }
});

module.exports = router;