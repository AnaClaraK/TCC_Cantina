const headerHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu">☰</button>
        <span><img class="l_img" data-name="logo" src="images/logo_p.png"/></span>
    </div>
</header>
`;

const sidebarHTML = `
<aside class="custom-sidebar">
    <a href="editarpf.html" style="text-decoration: none; color: inherit;">
        <div class="user-info">
            <div class="user-photo">
                <img id="sidebar-foto" class="p_img" src=""/> 
            </div>
             <div id="sidebar-nome" class="user-name"></div>
        </div>
    </a>
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
        <a href="cadastrof.html" class="nav-link">
            <img class="i_img" data-name="cadastrof" src="images/cadastrof_p.png"/> 
            <span class="nav-text">Cadastro de <br> Funcionários</span>
        </a>
    </nav>
</aside>
`;

function carregarMenu() {
    const body = document.body;
    body.insertAdjacentHTML('afterbegin', headerHTML);

    if (!body.classList.contains('sem-sidebar')) {
        body.insertAdjacentHTML('beforeend', sidebarHTML);
        
        const nomeBanco = localStorage.getItem("usuarioNome");
        const fotoBanco = localStorage.getItem("usuarioFoto");
        const elNome = document.getElementById("sidebar-nome");
        const elFoto = document.getElementById("sidebar-foto");

        if (elNome) {
            elNome.innerText = nomeBanco || "Convidado";
        }

        if (elFoto) {
            if (fotoBanco && fotoBanco !== "null") {
                elFoto.src = "http://localhost:3000" + fotoBanco;
            } else {
                elFoto.src = "images/def_avt.jpg"; 
            }
        }

        if(!body.classList.contains('sidebar-open')) {
             body.classList.add('sidebar-closed');
        }

        const btn = document.getElementById('btn-menu');
        if (btn) {
            btn.addEventListener('click', () => {
                body.classList.toggle('sidebar-open');
                body.classList.toggle('sidebar-closed');
            });
        }
    }

    // Cores dos ícones
    let sufixo = '_l'; 
    if (body.classList.contains('fundo-laranja') || body.classList.contains('fundo-marrom')) {
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