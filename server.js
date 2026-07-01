const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const compra = require('./models/Compra');

// Configuração
dotenv.config();

// Importar rotas
const authRoutes = require('./routes/auth');
const pokemonRoutes = require('./routes/pokemon');
const compraRoutes = require('./routes/compras');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// VIEW ENGINE - Handlebars
// ============================================
const hbs = exphbs.create({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    defaultLayout: 'main',
    helpers: {
        eq: function(a, b) { return a === b; },
        gt: function(a, b) { return a > b; },
        formatCurrency: function(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },
        formatDate: function(date) {
            return new Date(date).toLocaleDateString('pt-BR');
        },
        padString: function(str, len, char = '0') {
            str = String(str);
            while (str.length < len) {
                str = char + str;
            }
            return str;
        },
        multiply: function(a, b) {
            return a * b;
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'pokemarket_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Middleware para disponibilizar usuário nas views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cart 
        ? req.session.cart.reduce((acc, item) => acc + (item.quantidade || 0), 0) 
        : 0;
    next();
});

app.use(async (req, res, next) => {
    if (req.session && req.session.user) {
        // Busca a contagem diretamente do banco
        const cartItems = await compra.getCartItems(req.session.user.id);
        const cartCount = cartItems.reduce((acc, item) => acc + item.quantidade, 0);
        
        // Disponibiliza em todas as views
        res.locals.cartCount = cartCount;
    } else {
        res.locals.cartCount = 0;
    }
    next();
});
// ============================================
// ROTAS
// ============================================
app.use('/auth', authRoutes);
app.use('/pokemon', pokemonRoutes);
app.use('/compras', compraRoutes);
app.use('/users', userRoutes);

// Rota principal
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/pokemon');
    } else {
        res.redirect('/auth/login');
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`PokeMarket rodando em http://localhost:${PORT}`);
});

// No app.js
