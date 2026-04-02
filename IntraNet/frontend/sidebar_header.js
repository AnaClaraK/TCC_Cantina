// 1. Definição do Header
const headerHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu">☰</button>
        <span><img class="l_img" data-name="logo" src="images/logo_p.png"/></span>
    </div>
</header>
`;

// 2. Definição da Sidebar
const sidebarHTML = `
<aside class="custom-sidebar">
    <div class="user-info">
        <div class="user-photo"><img class="p_img" src="images/jimin.jpg"/></div>
        <div class="user-name">Ana Banana</div>
    </div>
    <nav>
        <a href="index.html" class="nav-link">
            <img class="i_img" data-name="inicio" src="images/inicio_p.png"/> 
            <span class="nav-text">Início</span>
        </a>
        <a href="pdv.html" class="nav-link">
            <img class="i_img" data-name="pdv" src="images/pdv_p.png"/> 
            <span class="nav-text">PDV</span>
        </a>
        <a href="estoque.html" class="nav-link">
            <img class="i_img" data-name="estoque" src="images/estoque_p.png"/> 
            <span class="nav-text">Estoque</span>
        </a>
        <a href="agendamento.html" class="nav-link">
            <img class="i_img" data-name="agendamento" src="images/agendamento_p.png"/> 
            <span class="nav-text">Agendamentos</span>
        </a>
        <a href="pedidos.html" class="nav-link">
            <img class="i_img" data-name="pedidos" src="images/pedidos_p.png"/> 
            <span class="nav-text">Pedidos</span>
        </a>
        <a href="compras.html" class="nav-link">
            <img class="i_img" data-name="compras" src="images/compras_p.png"/> 
            <span class="nav-text">Compras</span>
        </a>
        <a href="cadastrop.html" class="nav-link">
            <img class="i_img" data-name="cadastrop" src="images/cadastrop_p.png"/> 
            <span class="nav-text">Cadastro de <br> Produtos</span>
        </a>
    </nav>
</aside>
`;

function carregarMenu() {
    const body = document.body;

    // A. INSERE O HEADER (Sempre aparece)
    body.insertAdjacentHTML('afterbegin', headerHTML);

    // B. VERIFICA SE DEVE INSERIR A SIDEBAR
    if (!body.classList.contains('sem-sidebar')) {
        // Inserção da Sidebar
        body.insertAdjacentHTML('beforeend', sidebarHTML);
        
        // Garante que comece fechada se você não tiver a classe open
        if(!body.classList.contains('sidebar-open')) {
             body.classList.add('sidebar-closed');
        }

        // Lógica do Botão Menu para abrir/fechar
        const btn = document.getElementById('btn-menu');
        if (btn) {
            btn.addEventListener('click', () => {
                body.classList.toggle('sidebar-open');
                body.classList.toggle('sidebar-closed');
            });
        }
    } else {
        // Se NÃO tem sidebar, esconde o botão de hambúrguer
        const btn = document.getElementById('btn-menu');
        if (btn) btn.style.display = 'none';
    }

    // C. LÓGICA DAS CORES DOS ÍCONES (Sufixo _p ou _l)
    let sufixo = '_l'; 
    if (body.classList.contains('fundo-laranja')) {
        sufixo = '_p';
    }

    const imagens = document.querySelectorAll('.i_img, .l_img');
    imagens.forEach(img => {
        const nomeBase = img.getAttribute('data-name');
        if (nomeBase) {
            img.src = `images/${nomeBase}${sufixo}.png`;
        }
    });
}

document.addEventListener('DOMContentLoaded', carregarMenu);