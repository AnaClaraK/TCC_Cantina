const menuHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu" style="background:none; border:none; color:white; font-size:24px; cursor:pointer; margin-right:15px;">☰</button>
        <span>SISTEMA CANTINA</span>
    </div>
    <div class="header-right">USUÁRIO LOGADO</div>
</header>

<aside class="custom-sidebar">
    <div class="user-info">
        <div class="user-photo"></div>
        <div class="user-name">Ana Banana</div>
    </div>
    <nav>
        <a href="index.html" class="nav-link">
            <img class="i_img" src="images/inicio.png"/> <span class="nav-text">Início</span>
        </a>
        <a href="pdv.html" class="nav-link">
            <img class="i_img" src="images/pdv.png"/> <span class="nav-text">PDV</span>
        </a>
        <a href="estoque.html" class="nav-link">
            <span class="nav-icon">'img'</span> <span class="nav-text">Estoque</span>
        </a>
        <a href="agendamento.html" class="nav-link">
            <span class="nav-icon">'img'</span> <span class="nav-text">Agendamentos</span>
        </a>
        <a href="pedidos.html" class="nav-link">
            <span class="nav-icon">'img'</span> <span class="nav-text">Pedidos</span>
        </a>
        <a href="compras.html" class="nav-link">
            <span class="nav-icon">'img'</span> <span class="nav-text">Compras</span>
        </a>
        <a href="cadastrop.html" class="nav-link">
            <span class="nav-icon">'img'</span> <span class="nav-text">Cadastro de Produtos</span>
        </a>
    </nav>
</aside>
`;

function carregarMenu() {
    document.body.insertAdjacentHTML('afterbegin', menuHTML);
    
    // IMPORTANTE: Não adicionamos 'sidebar-open' aqui.
    // Opcional: Adicionar 'sidebar-closed' explicitamente se preferir
    document.body.classList.add('sidebar-closed'); 

    const btn = document.getElementById('btn-menu');
    
    btn.addEventListener('click', () => {
        // Alterna entre aberto e fechado
        if (document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
            document.body.classList.add('sidebar-closed');
        } else {
            document.body.classList.remove('sidebar-closed');
            document.body.classList.add('sidebar-open');
        }
    });
}
document.addEventListener('DOMContentLoaded', carregarMenu);