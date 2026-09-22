// =====================================================
// 🔒 PROTEÇÃO DE PÁGINA E CONTROLE DE ACESSO
// =====================================================

(function () {
    const paginasPublicas = ["login.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
    const token = localStorage.getItem("token");

    // Se estiver em página pública e já logado, redireciona para a página inicial
    if (token && paginasPublicas.includes(pagina)) {
        window.location.href = "index.html";
        return;
    }

    // Se não tiver token e tentar acessar página privada
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
                    <p>Redirecionando para o login...</p>
                </div>
            `;
        });

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    }
})();


// =====================================================
// 🔑 DECODIFICAR JWT E VALIDAR EXPIRAÇÃO
// =====================================================

function parseJwt(token) {
    try {
        if (!token) return null;
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function tokenExpirado() {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") return true;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;

    // Margem de tolerância de 10 segundos
    const agora = (Date.now() / 1000) - 10;
    return payload.exp < agora;
}


// =====================================================
// 🚪 LOGOUT E ENCERRAMENTO DE SESSÃO
// =====================================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioFoto");
    localStorage.removeItem("usuarioEmail");
    window.location.href = "login.html";
}

function logoutForcado() {
    const paginasPublicas = ["login.html", "cadastrof.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase();

    // Só limpa e redireciona se NÃO estiver em uma página pública
    if (!paginasPublicas.includes(pagina)) {
        localStorage.clear();
        window.location.replace("login.html");
    }
}


// =====================================================
// ⏱️ MONITORAMENTO DE SESSÃO
// =====================================================

function checarSessao() {
    const paginasPublicas = ["login.html", "cadastrof.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase();

    if (paginasPublicas.includes(pagina)) return;

    if (tokenExpirado()) {
        logoutForcado();
    }
}

setInterval(checarSessao, 5000);

function interceptarEventos() {
    const paginasPublicas = ["login.html", "cadastrof.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase();

    if (!paginasPublicas.includes(pagina) && tokenExpirado()) {
        logoutForcado();
    }
}

["click", "keydown", "input"].forEach(evt => {
    document.addEventListener(evt, interceptarEventos, true);
});


// =====================================================
// 👁️ VISIBILIDADE DA PÁGINA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    const paginasPublicas = ["login.html", "cadastrof.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase();
    const token = localStorage.getItem("token");

    if ((token && token !== "undefined") || paginasPublicas.includes(pagina)) {
        if (document.body) {
            document.body.style.visibility = "visible";
        }
    }
});


// =====================================================
// 🌐 FETCH GLOBAL AUTENTICADO
// =====================================================

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    // Se não houver token válido, nem realiza a requisição se a rota for privada
    if (!token || token === "undefined") {
        logoutForcado();
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    try {
        const res = await fetch(url, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            console.warn("Sessão inválida ou expirada no servidor (401/403). Redirecionando...");
            logoutForcado();
            return null;
        }

        return res;
    } catch (erro) {
        console.error("Erro na requisição apiFetch:", erro);
        throw erro;
    }
}


// =====================================================
// 🛡️ PROTEÇÃO DE SAÍDA DO PDV
// =====================================================

function irParaGranoVita(event) {
    if (window.location.pathname.endsWith("/pdv.html")) {
        if (typeof window.pdvPossuiVendaEmAndamento === "function" && window.pdvPossuiVendaEmAndamento()) {
            event.preventDefault();
            window.pdvConfirmarSaida(() => {
                window.location.href = "index.html";
            });
            return;
        }
    }
}


// =====================================================
// 🎨 LAYOUT (HEADER & SIDEBAR)
// =====================================================

const headerHTML = `
<header class="custom-header">
    <div style="display:flex; align-items:center;">
        <button id="btn-menu" type="button" aria-label="Abrir menu">
            ☰
        </button>
        <span>
            <a href="index.html" onclick="irParaGranoVita(event)">
                <img class="l_img" data-name="logo" src="../backend/imagens/logo_p.png" alt="Logo" />
            </a>
        </span>
    </div>
</header>
`;

const ehPDV = window.location.pathname.split("/").pop().toLowerCase() === "pdv.html";

const sidebarHTML = `
<aside class="custom-sidebar" id="sidebar-principal">
    <a href="editarpf.html" style="text-decoration:none; color:inherit;">
        <div class="user-info">
            <div class="user-photo">
                <img id="sidebar-foto" class="p_img" src="" alt="Foto do usuário" />
            </div>
            <div id="sidebar-nome" class="user-name"></div>
        </div>
    </a>
    <nav>
        <a href="index.html" class="nav-link">
            <img class="i_img" data-name="inicio" src="../backend/imagens/inicio_p.png" alt="Início" />
            <span class="nav-text">Início</span>
        </a>
        <a href="pdv.html" class="nav-link">
            <img class="i_img" data-name="pdv" src="../backend/imagens/pdv_p.png" alt="PDV" />
            <span class="nav-text">PDV</span>
        </a>
        <a href="estoque.html" class="nav-link">
            <img class="i_img" data-name="estoque" src="../backend/imagens/estoque_p.png" alt="Estoque" />
            <span class="nav-text">Estoque</span>
        </a>
        <a href="agendamento.html" class="nav-link">
            <img class="i_img" data-name="agendamento" src="../backend/imagens/agendamento_p.png" alt="Agendamentos" />
            <span class="nav-text">Agendamentos</span>
        </a>
        <a href="pedidos.html" class="nav-link">
            <img class="i_img" data-name="pedidos" src="../backend/imagens/pedidos_p.png" alt="Pedidos" />
            <span class="nav-text">Pedidos</span>
        </a>
        <a href="conta_fiado.html" class="nav-link">
            <img class="i_img" data-name="contas" src="../backend/imagens/contas_p.png" alt="Contas" />
            <span class="nav-text">Contas</span>
        </a>
        <a href="editarprod.html" class="nav-link">
            <img class="i_img" data-name="editarprod" id="icon_edp" src="../backend/imagens/editarprod_p.png" alt="Editar Produtos" />
            <span class="nav-text">Editar Produtos</span>
        </a>
        <a href="reposicao.html" class="nav-link">
            <img class="i_img" data-name="reposicao" id="icon_comp" src="../backend/imagens/reposicao_p.png" alt="Reposição" />
            <span class="nav-text">Reposição</span>
        </a>
        <a href="cadastrop.html" class="nav-link">
            <img class="i_img" data-name="cadastrop" src="../backend/imagens/cadastrop_p.png" alt="Cadastro de Produtos" />
            <span class="nav-text">Cadastro de <br> Produtos</span>
        </a>
        <a href="cadastrof.html" class="nav-link">
            <img class="i_img" data-name="cadastrof" id="icon_cadp" src="../backend/imagens/cadastrof_p.png" alt="Cadastro de Funcionários" />
            <span class="nav-text">Cadastro de <br> Funcionários</span>
        </a>
    </nav>
</aside>
`;

function adicionarBotaoFechamentoPDV() {
    if (!ehPDV || document.getElementById("btn-fechamento-pdv-header")) return;

    const header = document.querySelector(".custom-header");
    if (!header) return;

    const botao = document.createElement("button");
    botao.id = "btn-fechamento-pdv-header";
    botao.type = "button";
    botao.title = "Fechamento diário";
    botao.setAttribute("aria-label", "Fechamento diário");
    botao.style.cssText = "background:none; border:none; padding:0; margin-left:20px; cursor:pointer; display:flex; align-items:center; justify-content:center;";

    const imagem = document.createElement("img");
    imagem.src = "../backend/imagens/fechamento_p.png";
    imagem.alt = "Fechamento diário";
    imagem.style.cssText = "width:38px; height:38px; object-fit:contain;";

    botao.appendChild(imagem);
    header.appendChild(botao);

    botao.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        let tentativas = 0;
        const tentarAbrir = () => {
            if (typeof window.abrirFechamentoDiario === "function") {
                window.abrirFechamentoDiario();
                return;
            }
            tentativas++;
            if (tentativas < 40) {
                setTimeout(tentarAbrir, 50);
            } else {
                console.warn("A função abrirFechamentoDiario ainda não está disponível.");
            }
        };
        tentarAbrir();
    });
}

function carregarMenu() {
    // Removido "cadastrof.html" para permitir o carregamento do Header e Sidebar nesta página
    const paginasPublicas = ["login.html", "rec_senha.html"];
    const paginaAtual = window.location.pathname.split("/").pop().toLowerCase();
    
    if (paginasPublicas.includes(paginaAtual)) return;

    const body = document.body;
    if (!body) return;

    if (!document.querySelector(".custom-header")) {
        body.insertAdjacentHTML("afterbegin", headerHTML);
    }

    if (!body.classList.contains("sem-sidebar") && !document.querySelector(".custom-sidebar")) {
        body.insertAdjacentHTML("beforeend", sidebarHTML);

        const nomeBanco = localStorage.getItem("usuarioNome");
        const fotoBanco = localStorage.getItem("usuarioFoto");

        const elNome = document.getElementById("sidebar-nome");
        const elFoto = document.getElementById("sidebar-foto");

        if (elNome) elNome.innerText = nomeBanco || "Convidado";

        if (elFoto) {
            if (fotoBanco && fotoBanco !== "null" && fotoBanco !== "undefined" && fotoBanco !== "") {
                elFoto.src = fotoBanco.startsWith("http") ? fotoBanco : "http://localhost:3000" + fotoBanco;
            } else {
                elFoto.src = "../backend/imagens/def_avt.jpg";
            }
        }

        body.classList.add("sidebar-closed");

        const btn = document.getElementById("btn-menu");
        if (btn) {
            btn.addEventListener("click", () => {
                body.classList.toggle("sidebar-open");
                body.classList.toggle("sidebar-closed");
            });
        }
    }

    adicionarBotaoFechamentoPDV();

    let sufixo = "_l";
    if (body.classList.contains("fundo-laranja") || body.classList.contains("fundo-marrom")) {
        sufixo = "_p";
    }

    const imagens = document.querySelectorAll(".i_img, .l_img");
    imagens.forEach(img => {
        const nomeBase = img.getAttribute("data-name");
        if (nomeBase) {
            img.src = `../backend/imagens/${nomeBase}${sufixo}.png`;
        }
    });

    const links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
        const href = link.getAttribute("href");
        if (href === paginaAtual) {
            link.classList.add("ativo");
        }
    });
}

document.addEventListener("DOMContentLoaded", carregarMenu);


// =====================================================
// 🔄 SINCRONIZAÇÃO DE PERFIL COM O BACKEND
// =====================================================
async function sincronizarPerfilUsuario() {
    const paginasPublicas = ["login.html", "cadastrof.html", "rec_senha.html"];
    const pagina = window.location.pathname.split("/").pop().toLowerCase();
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || paginasPublicas.includes(pagina)) return;

    try {
        // Faz a requisição normal usando o fetch nativo ou apiFetch
        const response = await fetch("http://localhost:3000/perfil/meus-dados", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // Se o backend recusar (401/403), loga o erro no console em vez de expulsar o usuário imediatamente
        if (response.status === 401 || response.status === 403) {
            console.error("Falha ao autenticar na rota /perfil/meus-dados. Verifique o JWT_SECRET do backend.");
            return;
        }

        if (!response.ok) return;

        const dados = await response.json();

        if (dados.nome) localStorage.setItem("usuarioNome", dados.nome);
        if (dados.foto) localStorage.setItem("usuarioFoto", dados.foto);

        const elNome = document.getElementById("sidebar-nome");
        const elFoto = document.getElementById("sidebar-foto");

        if (elNome) elNome.innerText = dados.nome || "Convidado";

        if (elFoto && dados.foto) {
            elFoto.src = dados.foto.startsWith("http") ? dados.foto : "http://localhost:3000" + dados.foto;
        }

    } catch (erro) {
        console.error("Erro ao sincronizar perfil:", erro);
    }
}
document.addEventListener("DOMContentLoaded", sincronizarPerfilUsuario);