const headerHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu">☰</button>
        <span><a href="index.html"> <img class="l_img" data-name="logo" src="imagens/logo_p.png"/> </a> </span>
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
            <img class="i_img" data-name="inicio" src="imagens/inicio_p.png"/> 
            <span class="nav-text">Início</span>
        </a>
        <a href="pdv.html" class="nav-link">
            <img class="i_img" data-name="pdv" src="imagens/pdv_p.png"/> 
            <span class="nav-text">PDV</span>
        </a>
        <a href="estoque.html" class="nav-link">
            <img class="i_img" data-name="estoque" src="imagens/estoque_p.png"/> 
            <span class="nav-text">Estoque</span>
        </a>
        <a href="agendamento.html" class="nav-link">
            <img class="i_img" data-name="agendamento" src="imagens/agendamento_p.png"/> 
            <span class="nav-text">Agendamentos</span>
        </a>
        <a href="pedidos.html" class="nav-link">
            <img class="i_img" data-name="pedidos" src="imagens/pedidos_p.png"/> 
            <span class="nav-text">Pedidos</span>
        </a>
        <a href="reposicao.html" class="nav-link">
            <img class="i_img" data-name="compras" src="imagens/compras_p.png"/> 
            <span class="nav-text">Compras</span>
        </a>
        <a href="cadastrop.html" class="nav-link">
            <img class="i_img" data-name="cadastrop" src="imagens/cadastrop_p.png"/> 
            <span class="nav-text">Cadastro de <br> Produtos</span>
        </a>
        <a href="editarprod.html" class="nav-link">
            <img class="i_img" data-name="editarprod" src="imagens/editarprod_p.png"/> 
            <span class="nav-text">Editar Produtos</span>
        </a>
        <a href="cadastrof.html" class="nav-link">
            <img class="i_img" data-name="cadastrof" src="imagens/cadastrof_p.png"/> 
            <span class="nav-text">Cadastro de <br> Funcionários</span>
        </a>
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
                elFoto.src = "../backend/imagens/def_avt.jpg"; 
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
            img.src = `../backend/imagens/${nomeBase}${sufixo}.png`;
        }
        const links = document.querySelectorAll('.nav-link');
const paginaAtual = window.location.pathname.split("/").pop();

links.forEach(link => {
    const href = link.getAttribute('href');

    if(href === paginaAtual){
        link.classList.add('ativo');
    }
});
    });
}

document.addEventListener('DOMContentLoaded', carregarMenu);