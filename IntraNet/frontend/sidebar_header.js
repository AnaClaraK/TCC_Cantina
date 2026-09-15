// 🔒 PROTEÇÃO DE PÁGINA

(function () {

    const paginasPublicas = ["login.html", "cadastrof.html"];

    const pagina =
        window.location.pathname.split("/").pop();

    const token =
        localStorage.getItem("token");

    if (
        !token &&
        !paginasPublicas.includes(pagina)
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

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

            }
        );

        setTimeout(
            () => {
                window.location.href =
                    "login.html";
            },
            2000
        );

        return;
    }

    // já logado → não volta pro login

    if (
        token &&
        pagina === "login.html"
    ) {

        window.location.href =
            "index.html";

    }

})();


// =====================================================
// JWT
// =====================================================

function parseJwt(token) {

    try {

        return JSON.parse(
            atob(token.split(".")[1])
        );

    } catch {

        return null;

    }

}


// =====================================================
// VERIFICAR EXPIRAÇÃO
// =====================================================

function tokenExpirado() {

    const token =
        localStorage.getItem("token");

    if (!token) {
        return true;
    }

    const payload =
        parseJwt(token);

    if (
        !payload ||
        !payload.exp
    ) {

        return true;

    }

    const agora =
        Date.now() / 1000;

    return payload.exp < agora;

}


// =====================================================
// LOGOUT FORÇADO
// =====================================================

function logoutForcado() {

    localStorage.removeItem("token");

    window.location.replace(
        "login.html"
    );

}


// =====================================================
// CHECAR SESSÃO
// =====================================================

function checarSessao() {

    if (tokenExpirado()) {

        logoutForcado();

    }

}


setInterval(
    checarSessao,
    5000
);


// =====================================================
// INTERCEPTAR EVENTOS
// =====================================================

function interceptarEventos() {

    if (tokenExpirado()) {

        logoutForcado();

    }

}


[
    "click",
    "keydown",
    "input"
].forEach(
    evt => {

        document.addEventListener(
            evt,
            interceptarEventos,
            true
        );

    }
);


// =====================================================
// 👁️ MOSTRAR TELA
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const paginasPublicas = [
            "login.html",
            "cadastrof.html"
        ];

        const pagina =
            window.location.pathname
                .split("/")
                .pop();

        const token =
            localStorage.getItem("token");

        if (
            token ||
            paginasPublicas.includes(pagina)
        ) {

            document.body.style.visibility =
                "visible";

        }

    }
);


// =====================================================
// 🚪 LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioFoto");
    localStorage.removeItem("usuarioEmail");

    window.location.href =
        "login.html";

}


// =====================================================
// 🌐 FETCH GLOBAL
// =====================================================

async function apiFetch(
    url,
    options = {}
) {

    const token =
        localStorage.getItem("token");

    const res =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...(options.headers || {}),

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

    if (
        res.status === 401 ||
        res.status === 403
    ) {

        logoutForcado();

    }

    return res;

}


// =====================================================
// VALIDAR SESSÃO
// =====================================================

function validarSessao() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        localStorage.clear();

        window.location.replace(
            "login.html"
        );

    }

}


validarSessao();


setInterval(
    validarSessao,
    3000
);


// =====================================================
// PROTEÇÃO DE SAÍDA DO PDV
// =====================================================

function irParaGranoVita(event) {

    // Só interfere quando estiver no PDV

    if (
        window.location.pathname
            .endsWith("/pdv.html")
    ) {

        if (
            typeof window.pdvPossuiVendaEmAndamento ===
                "function" &&
            window.pdvPossuiVendaEmAndamento()
        ) {

            event.preventDefault();

            window.pdvConfirmarSaida(
                () => {

                    window.location.href =
                        "index.html";

                }
            );

            return;

        }

    }

}


// =====================================================
// HEADER
// =====================================================

const headerHTML = `
<header class="custom-header">

    <div
        style="
            display:flex;
            align-items:center;
        "
    >

        <button
            id="btn-menu"
            type="button"
            aria-label="Abrir menu"
        >
            ☰
        </button>


        <span>

            <a
                href="index.html"
                onclick="irParaGranoVita(event)"
            >

                <img
                    class="l_img"
                    data-name="logo"
                    src="imagens/logo_p.png"
                    alt="Logo"
                />

            </a>

        </span>

    </div>

</header>
`;


// =====================================================
// SIDEBAR
// =====================================================

const ehPDV =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase() === "pdv.html";


const sidebarHTML = `

<aside
    class="custom-sidebar"
    id="sidebar-principal"
>

    <a
        href="editarpf.html"
        style="
            text-decoration:none;
            color:inherit;
        "
    >

        <div class="user-info">

            <div class="user-photo">

                <img
                    id="sidebar-foto"
                    class="p_img"
                    src=""
                    alt="Foto do usuário"
                />

            </div>

            <div
                id="sidebar-nome"
                class="user-name"
            ></div>

        </div>

    </a>


    <nav>

        <a
            href="index.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="inicio"
                src="imagens/inicio_p.png"
                alt="Início"
            />

            <span class="nav-text">
                Início
            </span>

        </a>


        <a
            href="pdv.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="pdv"
                src="imagens/pdv_p.png"
                alt="PDV"
            />

            <span class="nav-text">
                PDV
            </span>

        </a>


        <a
            href="estoque.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="estoque"
                src="imagens/estoque_p.png"
                alt="Estoque"
            />

            <span class="nav-text">
                Estoque
            </span>

        </a>


        <a
            href="agendamento.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="agendamento"
                src="imagens/agendamento_p.png"
                alt="Agendamentos"
            />

            <span class="nav-text">
                Agendamentos
            </span>

        </a>


        <a
            href="pedidos.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="pedidos"
                src="imagens/pedidos_p.png"
                alt="Pedidos"
            />

            <span class="nav-text">
                Pedidos
            </span>

        </a>


        <a
            href="conta_fiado.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="contas"
                src="imagens/contas_p.png"
                alt="Contas"
            />

            <span class="nav-text">
                Contas
            </span>

        </a>


        <a
            href="editarprod.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="editarprod"
                id="icon_edp"
                src="imagens/editarprod_p.png"
                alt="Editar Produtos"
            />

            <span class="nav-text">
                Editar Produtos
            </span>

        </a>


        <a
            href="reposicao.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="reposicao"
                id="icon_comp"
                src="imagens/reposicao_p.png"
                alt="Reposição"
            />

            <span class="nav-text">
                Reposição
            </span>

        </a>


        <a
            href="cadastrop.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="cadastrop"
                src="imagens/cadastrop_p.png"
                alt="Cadastro de Produtos"
            />

            <span class="nav-text">

                Cadastro de <br>
                Produtos

            </span>

        </a>


        <a
            href="cadastrof.html"
            class="nav-link"
        >

            <img
                class="i_img"
                data-name="cadastrof"
                id="icon_cadp"
                src="imagens/cadastrof_p.png"
                alt="Cadastro de Funcionários"
            />

            <span class="nav-text">

                Cadastro de <br>
                Funcionários

            </span>

        </a>

    </nav>

</aside>

`;


// =====================================================
// BOTÃO DE FECHAMENTO NO HEADER DO PDV
// =====================================================

function adicionarBotaoFechamentoPDV() {

    // Só adiciona no PDV

    if (!ehPDV) {

        return;

    }


    // Evita duplicação

    if (
        document.getElementById(
            "btn-fechamento-pdv-header"
        )
    ) {

        return;

    }


    const header =
        document.querySelector(
            ".custom-header"
        );


    if (!header) {

        return;

    }


    const botao =
        document.createElement("button");


    botao.id =
        "btn-fechamento-pdv-header";


    botao.type =
        "button";


    botao.title =
        "Fechamento diário";


    botao.setAttribute(
        "aria-label",
        "Fechamento diário"
    );


    botao.style.background =
        "none";

    botao.style.border =
        "none";

    botao.style.padding =
        "0";

    botao.style.marginLeft =
        "20px";

    botao.style.cursor =
        "pointer";

    botao.style.display =
        "flex";

    botao.style.alignItems =
        "center";

    botao.style.justifyContent =
        "center";


    const imagem =
        document.createElement("img");


    imagem.src =
        "../backend/imagens/fechamento_p.png";


    imagem.alt =
        "Fechamento diário";


    imagem.style.width =
        "38px";

    imagem.style.height =
        "38px";

    imagem.style.objectFit =
        "contain";


    botao.appendChild(
        imagem
    );


    // Coloca o botão no header

    header.appendChild(
        botao
    );


    // =================================================
    // CLIQUE DO FECHAMENTO
    // =================================================

    botao.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();


            let tentativas = 0;

            const tentarAbrir =
                () => {

                    if (
                        typeof window.abrirFechamentoDiario ===
                        "function"
                    ) {

                        window.abrirFechamentoDiario();

                        return;

                    }


                    tentativas++;


                    if (
                        tentativas < 40
                    ) {

                        setTimeout(
                            tentarAbrir,
                            50
                        );

                    } else {

                        console.warn(
                            "A função abrirFechamentoDiario ainda não está disponível."
                        );

                    }

                };


            tentarAbrir();

        }
    );

}


// =====================================================
// CARREGAR MENU
// =====================================================

function carregarMenu() {

    // IMPORTANTE:
    // Esta função só é chamada após DOMContentLoaded.
    // Assim document.body já existe.

    const body =
        document.body;


    if (!body) {

        return;

    }


    // =================================================
    // HEADER
    // =================================================

    if (
        !document.querySelector(
            ".custom-header"
        )
    ) {

        body.insertAdjacentHTML(
            "afterbegin",
            headerHTML
        );

    }


    // =================================================
    // SIDEBAR
    // =================================================

    if (
        !body.classList.contains(
            "sem-sidebar"
        )
    ) {

        if (
            !document.querySelector(
                ".custom-sidebar"
            )
        ) {

            body.insertAdjacentHTML(
                "beforeend",
                sidebarHTML
            );

        }


        const nomeBanco =
            localStorage.getItem(
                "usuarioNome"
            );


        const fotoBanco =
            localStorage.getItem(
                "usuarioFoto"
            );


        const elNome =
            document.getElementById(
                "sidebar-nome"
            );


        const elFoto =
            document.getElementById(
                "sidebar-foto"
            );


        if (elNome) {

            elNome.innerText =
                nomeBanco ||
                "Convidado";

        }


        if (elFoto) {

            if (
                fotoBanco &&
                fotoBanco !== "null"
            ) {

                elFoto.src =
                    "http://localhost:3000" +
                    fotoBanco;

            } else {

                elFoto.src =
                    "../backend/imagens/def_avt.jpg";

            }

        }


        // Garante que o sidebar exista

        body.classList.add(
            "sidebar-closed"
        );


        const btn =
            document.getElementById(
                "btn-menu"
            );


        if (btn) {

            btn.addEventListener(
                "click",
                () => {

                    body.classList.toggle(
                        "sidebar-open"
                    );

                    body.classList.toggle(
                        "sidebar-closed"
                    );

                }
            );

        }


        // =================================================
        // FECHAMENTO — SOMENTE NO PDV
        // =================================================

        const btnFechamento =
            document.getElementById(
                "nav-fechamento-pdv"
            );


        if (btnFechamento) {

            btnFechamento.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    let tentativas = 0;


                    const tentarAbrir =
                        () => {

                            if (
                                typeof window.abrirFechamentoDiario ===
                                "function"
                            ) {

                                window.abrirFechamentoDiario();

                                return;

                            }


                            tentativas++;


                            if (
                                tentativas < 40
                            ) {

                                setTimeout(
                                    tentarAbrir,
                                    50
                                );

                            } else {

                                console.warn(
                                    "A função abrirFechamentoDiario ainda não está disponível."
                                );

                            }

                        };


                    tentarAbrir();

                }
            );

        }

    }


    // =================================================
    // FECHAMENTO NO HEADER DO PDV
    // =================================================

    adicionarBotaoFechamentoPDV();


    // =================================================
    // CORES DOS ÍCONES
    // =================================================

    let sufixo =
        "_l";


    if (
        body.classList.contains(
            "fundo-laranja"
        ) ||
        body.classList.contains(
            "fundo-marrom"
        )
    ) {

        sufixo =
            "_p";

    }


    const imagens =
        document.querySelectorAll(
            ".i_img, .l_img"
        );


    imagens.forEach(
        img => {

            const nomeBase =
                img.getAttribute(
                    "data-name"
                );


            if (nomeBase) {

                img.src =
                    `../backend/imagens/${nomeBase}${sufixo}.png`;

            }

        }
    );


    // =================================================
    // MARCAR PÁGINA ATUAL
    // =================================================

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    const paginaAtual =
        window.location.pathname
            .split("/")
            .pop();


    links.forEach(
        link => {

            const href =
                link.getAttribute(
                    "href"
                );


            if (
                href === paginaAtual
            ) {

                link.classList.add(
                    "ativo"
                );

            }

        }
    );

}


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(texto) {

    return String(
        texto || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


// =====================================================
// CARREGAR MENU APÓS O DOM EXISTIR
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    carregarMenu
);


// =====================================================
// 🔄 SINCRONIZAR DADOS DO USUÁRIO COM O BANCO
// =====================================================

async function sincronizarPerfilUsuario() {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        return;

    }


    try {

        const response =
            await fetch(
                "http://localhost:3000/perfil/meus-dados",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            return;

        }


        const dados =
            await response.json();


        if (dados.nome) {

            localStorage.setItem(
                "usuarioNome",
                dados.nome
            );

        }


        if (dados.foto) {

            localStorage.setItem(
                "usuarioFoto",
                dados.foto
            );

        }


        const elNome =
            document.getElementById(
                "sidebar-nome"
            );


        const elFoto =
            document.getElementById(
                "sidebar-foto"
            );


        if (elNome) {

            elNome.innerText =
                dados.nome ||
                "Convidado";

        }


        if (
            elFoto &&
            dados.foto
        ) {

            elFoto.src =
                "http://localhost:3000" +
                dados.foto;

        }


    } catch (erro) {

        console.error(
            "Erro ao sincronizar perfil:",
            erro
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    sincronizarPerfilUsuario
);