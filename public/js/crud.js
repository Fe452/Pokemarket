/**
 * POKEMARKET - MÓDULO DE CRUD (Gerenciamento de Pokémon)
 * 
 * Gerencia as operações de criação, edição e exclusão de Pokémon.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Modal de CRUD
    const modal = document.getElementById('crud-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const addBtn = document.getElementById('btn-open-add-modal');

    if (addBtn) {
        addBtn.addEventListener('click', function() {
            document.getElementById('modal-title').textContent = 'Adicionar Novo Lote à Venda';
            document.getElementById('edit-pk-id').value = '';
            document.getElementById('crud-form').reset();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }

    // Clique fora do modal para fechar
    modal?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });

    // Função para editar (disponível globalmente)
    window.openEditModal = function(id) {
        const row = document.querySelector(`[data-pokemon-id="${id}"]`);
        if (!row) return;

        const name = row.dataset.name;
        const type = row.dataset.type;
        const price = row.dataset.price;
        const stock = row.dataset.stock;
        const description = row.dataset.description;

        document.getElementById('modal-title').textContent = `Editar Valores de Mercado: ${name}`;
        document.getElementById('edit-pk-id').value = id;
        document.getElementById('form-name').value = name;
        document.getElementById('form-type').value = type;
        document.getElementById('form-price').value = price;
        document.getElementById('form-stock').value = stock;
        document.getElementById('form-description').value = description || '';

        modal.classList.remove('hidden');
    };

    // Função para excluir (disponível globalmente)
    window.deletePokemon = function(id) {
        if (confirm('Confirmar baixa e liquidação definitiva deste lote do inventário comercial?')) {
            fetch(`/pokemon/excluir/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Recarregar a página para atualizar a lista
                    window.location.reload();
                } else {
                    alert('Erro ao excluir Pokémon');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao excluir Pokémon');
            });
        }
    };
});