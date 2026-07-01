/**
 * POKEMARKET - MÓDULO DE CARRINHO
 * 
 * Gerencia a exibição e manipulação do carrinho de compras.
 */

// Função para remover item do carrinho (usada no frontend)
window.removeFromCart = function(index) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/compras/carrinho/remover';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'index';
    input.value = index;
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
};

// Quantidade no carrinho - atualização dinâmica
document.addEventListener('DOMContentLoaded', function() {
    const qtyInputs = document.querySelectorAll('.cart-qty-input');
    qtyInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Atualizar subtotal
            const row = this.closest('.cart-item');
            const price = parseFloat(row.dataset.price);
            const qty = parseInt(this.value);
            const subtotal = price * qty;
            
            row.querySelector('.cart-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
            
            // Recalcular total geral
            updateCartTotal();
        });
    });
});

function updateCartTotal() {
    const subtotals = document.querySelectorAll('.cart-subtotal');
    let total = 0;
    subtotals.forEach(el => {
        total += parseFloat(el.textContent.replace('R$ ', '').replace(',', '.'));
    });
    document.getElementById('cart-total').textContent = `R$ ${total.toFixed(2)}`;
}