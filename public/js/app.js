/**
 * POKEMARKET - APP PRINCIPAL
 * 
 * Este arquivo gerencia a interface do usuário, comunicação com o backend
 * via AJAX e renderização dinâmica de componentes.
 */

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let selectedPokemon = null;
let currentQuantity = 1;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function padString(str, len, char = '0') {
    str = String(str);
    while (str.length < len) {
        str = char + str;
    }
    return str;
}

// ============================================
// DETALHES DO POKÉMON (Sidebar)
// ============================================
window.showDetails = async function(id) {
    try {
        const response = await fetch(`/pokemon/detalhes/${id}`);
        const pokemon = await response.json();

        if (!pokemon || pokemon.error) {
            console.error('Erro ao buscar detalhes:', pokemon?.error);
            return;
        }

        selectedPokemon = pokemon;
        currentQuantity = 1;

        const sidebar = document.getElementById('details-sidebar');
        const tipos = pokemon.tipos_array || [];

        sidebar.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-end justify-between border-b border-indigo-900/60 pb-3">
                    <div>
                        <h3 class="font-black text-xl tracking-wide uppercase text-white">${pokemon.nome_pokemon}</h3>
                        <span class="font-mono text-indigo-400 text-xs font-bold">#${padString(pokemon.pokemon_id, 3)}</span>
                    </div>
                    <button id="close-details-btn" class="text-indigo-300 font-bold p-1 text-sm hover:text-white transition">✕</button>
                </div>
                <div class="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex justify-center items-center h-48 shadow-inner relative overflow-hidden backdrop-blur-sm">
                    <div class="absolute w-28 h-28 bg-purple-600/10 rounded-full blur-xl pointer-events-none"></div>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.numero_pokedex}.png"
                         onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.numero_pokedex}.png'"
                         class="w-36 h-36 object-contain pokemon-bounce z-10">
                </div>
                <div class="space-y-3.5 text-xs">
                    <div class="flex justify-between items-center bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-950">
                        <span class="text-indigo-300 font-semibold flex items-center gap-1.5"> TIPO</span>
                        <div>
                ${tipos.length > 0 ? tipos.map(tipo => `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold type-${tipo}">${tipo}</span>`).join(' ') : '-'}
            </div>
                    </div>
                    <div class="flex justify-between items-center bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-950">
                        <span class="text-indigo-300 font-semibold flex items-center gap-1.5"> GÊNERO</span>
                        <span class="font-bold text-slate-400">${pokemon.genero || '-'}</span>
                    </div>
                    <div class="flex justify-between items-center bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-950">
                        <span class="text-indigo-300 font-semibold flex items-center gap-1.5"> PREÇO</span>
                        <span class="font-black text-yellow-400 text-sm">R$ ${Number(pokemon.preco).toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-950">
                        <span class="text-indigo-300 font-semibold flex items-center gap-1.5"> GERAÇÃO</span>
                        <span class="font-bold text-slate-400">${pokemon.geracao || '-'}</span>
                    </div>
                    <div class="bg-indigo-950/50 border border-indigo-900/60 rounded-xl p-3.5 mt-2 space-y-1">
                        <span class="text-indigo-300 font-bold uppercase tracking-wider text-[10px] block"> Descrição</span>
                        <p class="text-indigo-100/80 text-[11px] leading-relaxed font-medium font-sans">${pokemon.descricao || 'Sem descrição disponível'}</p>
                    </div>
                </div>
            </div>
            <div class="mt-4 pt-3 border-t border-indigo-900/50 space-y-3">
                <div class="flex justify-between items-center text-xs px-1">
                    <span class="text-indigo-300 font-medium uppercase tracking-wider text-[10px]">📦 Disponível em Stock</span>
                    <span id="det-stock" class="font-black text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">${pokemon.estoque} un</span>
                </div>
                <div class="flex gap-2">
                    <div class="flex items-center bg-indigo-950 border border-indigo-800 rounded-xl overflow-hidden h-10">
                        <button id="qty-minus" class="px-3 text-indigo-300 hover:bg-indigo-900 font-bold transition text-xs">-</button>
                        <input id="qty-input" type="text" value="1" class="w-6 bg-transparent text-center font-bold text-xs text-white focus:outline-none" readonly>
                        <button id="qty-plus" class="px-3 text-indigo-300 hover:bg-indigo-900 font-bold transition text-xs">+</button>
                    </div>
                    <button id="add-to-cart-btn" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `;

        sidebar.classList.remove('hidden');

        // Eventos do sidebar
        document.getElementById('close-details-btn').addEventListener('click', () => {
            sidebar.classList.add('hidden');
        });

        document.getElementById('qty-plus').addEventListener('click', () => {
            if (currentQuantity < pokemon.estoque) {
                currentQuantity++;
                document.getElementById('qty-input').value = currentQuantity;
            }
        });

        document.getElementById('qty-minus').addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                document.getElementById('qty-input').value = currentQuantity;
            }
        });

        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            addToCart(pokemon.pokemon_id, currentQuantity);
        });

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
    }
};

// ============================================
// CARRINHO (Integração com backend)
// ============================================
async function addToCart(pokemonId, quantidade) {
    try {
        const response = await fetch('/compras/carrinho/adicionar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pokemon_id: pokemonId, quantidade })
        });

        const data = await response.json();

        if (data.success) {
            // Atualizar badge do carrinho
            document.getElementById('cart-badge').textContent = data.cartCount;
            
            // Feedback visual
            const btn = document.getElementById('add-to-cart-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Adicionado!';
            btn.classList.add('bg-emerald-600');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-emerald-600');
            }, 2000);
        } else {
            alert(data.error || 'Erro ao adicionar ao carrinho');
        }
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        alert('Erro ao adicionar ao carrinho');
    }
}