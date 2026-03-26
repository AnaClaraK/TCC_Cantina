const menuHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu">☰</button>
        <span><img class="l_img" data-name="logo" src="images/logo_p.png"/></span>
    </div>
</header>

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
            <span class="nav-text">Cadastro</span>
        </a>
    </nav>
</aside>
`;

function carregarMenu() {
    // 1. Insere o HTML do menu
    document.body.insertAdjacentHTML('afterbegin', menuHTML);
    
    // 2. IDENTIFICAÇÃO DA TELA
    // Se o body tem 'fundo-laranja', queremos ícones PRETOS (_p)
    // Se o body tem 'fundo-escuro' (ou qualquer outro), queremos ícones LARANJAS (_l)
    let sufixo = '_l'; // Padrão: Laranja (para fundo escuro)

    if (document.body.classList.contains('fundo-laranja')) {
        sufixo = '_p'; // Se o fundo é laranja, o ícone DEVE ser preto
    }

    // 3. TROCA REAL DAS IMAGENS
    const imagens = document.querySelectorAll('.i_img, .l_img');
    
    imagens.forEach(img => {
        // Pegamos o nome base que definimos no 'data-name'
        const nomeBase = img.getAttribute('data-name');
        
        if (nomeBase) {
            // Monta o caminho do zero: images/ + nome + _p ou _l + .png
            img.src = `images/${nomeBase}${sufixo}.png`;
        }
    });

    // 4. Lógica do Botão Menu
    const btn = document.getElementById('btn-menu');
    if (btn) {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }
}
document.addEventListener('DOMContentLoaded', carregarMenu);