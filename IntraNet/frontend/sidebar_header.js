// 🔒 PROTEÇÃO DE PÁGINA
(function () {
    const paginasPublicas = ["login.html", "cadastrof.html"];
    const pagina = window.location.pathname.split("/").pop();
    const token = localStorage.getItem("token");

    if (!token && !paginasPublicas.includes(pagina)) {

        document.addEventListener("DOMContentLoaded", () => {
            document.body.innerHTML = `
                <div style="
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    height:100vh;
                    background:#242628;
                    color:#efac4a;
                    flex-direction:column;
                    font-family:Arial;
                ">
                    <h2>Acesso restrito</h2>
                    <p>Você não tem permissão para acessar esta página.</p>
                    <p>Redirecionando...</p>
                </div>
            `;
        });

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

        return;
    }

    // já logado → não volta pro login
    if (token && pagina === "login.html") {
        window.location.href = "index.html";
    }
})();

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

function tokenExpirado() {
    const token = localStorage.getItem("token");
    if (!token) return true;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;

    const agora = Date.now() / 1000;
    return payload.exp < agora;
}

function logoutForcado() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

function checarSessao() {
    if (tokenExpirado()) {
        logoutForcado();
    }
}
setInterval(checarSessao, 5000);

function interceptarEventos() {
    if (tokenExpirado()) logoutForcado();
}

["click", "keydown", "input"].forEach(evt => {
    document.addEventListener(evt, interceptarEventos, true);
});


// 👁️ MOSTRAR TELA (evita piscada)
document.addEventListener("DOMContentLoaded", () => {
    const paginasPublicas = ["login.html", "cadastrof.html"];
    const pagina = window.location.pathname.split("/").pop();
    const token = localStorage.getItem("token");

    if (token || paginasPublicas.includes(pagina)) {
        document.body.style.visibility = "visible";
    }
});


// 🚪 LOGOUT
function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioFoto");
    localStorage.removeItem("usuarioEmail");

    window.location.href = "login.html";
}


// 🌐 FETCH GLOBAL
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        }
    });

    if (res.status === 401 || res.status === 403) {
        logoutForcado();
    }

    return res;
}

function validarSessao() {
    const token = localStorage.getItem("token");

    if (!token) {
        localStorage.clear();
        window.location.replace("login.html");
    }
}

validarSessao();
setInterval(validarSessao, 3000);

// CORRIGIDO: Modificado caminho do logo estático para a rota global do Express /imagens/
const headerHTML = `
<header class="custom-header">
    <div style="display: flex; align-items: center;">
        <button id="btn-menu">☰</button>
        <span><a href="index.html"> <img class="l_img" data-name="logo" src="/imagens/logo_p.png"/> </a> </span>
    </div>
</header>
`;

// CORRIGIDO: Removido o prefixo 'imagens/' fixo nas tags para deixar a lógica do JS estruturar o caminho correto do servidor
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
            <img class="i_img" data-name="inicio" src=""/> 
            <span class="nav-text">Início</span>
        </a>
        <a href="pdv.html" class="nav-link">
            <img class="i_img" data-name="pdv" src=""/> 
            <span class="nav-text">PDV</span>
        </a>
        <a href="estoque.html" class="nav-link">
            <img class="i_img" data-name="estoque" src=""/> 
            <span class="nav-text">Estoque</span>
        </a>
        <a href="agendamento.html" class="nav-link">
            <img class="i_img" data-name="agendamento" src=""/> 
            <span class="nav-text">Agendamentos</span>
        </a>
        <a href="pedidos.html" class="nav-link">
            <img class="i_img" data-name="pedidos" src=""/> 
            <span class="nav-text">Pedidos</span>
        </a>
        <a href="conta_fiado.html" class="nav-link">
            <img class="i_img" data-name="contas" src=""/> 
            <span class="nav-text">Contas</span>
        </a>
        <a href="editarprod.html" class="nav-link">
            <img class="i_img" data-name="editarprod" id="icon_edp" src=""/> 
            <span class="nav-text">Editar Produtos</span>
        </a>
        <a href="reposicao.html" class="nav-link">
            <img class="i_img" data-name="reposicao" id="icon_comp" src=""/> 
            <span class="nav-text">Reposição</span>
        </a>
        <a href="cadastrop.html" class="nav-link">
            <img class="i_img" data-name="cadastrop" src=""/> 
            <span class="nav-text">Cadastro de <br> Produtos</span>
        </a>
        <a href="cadastrof.html" class="nav-link">
            <img class="i_img" data-name="cadastrof" id="icon_cadp" src=""/> 
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
                // CORRIGIDO: Se a rota já vem com '/imagens/', garante o mapeamento direto no servidor local
                elFoto.src = fotoBanco.startsWith("http") ? fotoBanco : "http://localhost:3000" + fotoBanco;
            } else {
                // CORRIGIDO: Imagem default buscando da rota estática pública do servidor
                elFoto.src = "/imagens/def_avt.jpg"; 
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

    // CORRIGIDO: Injeta a rota de servidor pública virtual /imagens/ dinamicamente para os ícones funcionarem
    const imagens = document.querySelectorAll('.i_img, .l_img');
    imagens.forEach(img => {
        const nomeBase = img.getAttribute('data-name');
        if (nomeBase) {
            img.src = `/imagens/${nomeBase}${sufixo}.png`;
        }
    });

    const links = document.querySelectorAll('.nav-link');
    const paginaAtual = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const href = link.getAttribute('href');
        if(href === paginaAtual){
            link.classList.add('ativo');
        }
    });
}

document.addEventListener('DOMContentLoaded', carregarMenu);