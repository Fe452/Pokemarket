/**
 * POKEMARKET - MÓDULO DE AUTENTICAÇÃO
 * 
 * Gerencia validações de formulário e feedback visual na tela de login/registro.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Validação de senha no registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const senha = document.getElementById('reg-password').value;
            const confirmar = document.getElementById('reg-password-confirm').value;

            if (senha !== confirmar) {
                e.preventDefault();
                document.getElementById('register-error').textContent = '⚠️ As senhas não coincidem!';
                document.getElementById('register-error').classList.remove('hidden');
            }
        });
    }
});