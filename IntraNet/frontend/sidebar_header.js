// 🔒 PROTEÇÃO DE PÁGINA

(function () {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const token =
        localStorage.getItem("token");

    if (
        !token &&
        !paginasPublicas.includes(pagina) &&
        pagina !== ""
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

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 2000);

        return;
    }

    if (
        token &&
        pagina === "login.html"
    ) {

        window.location.href =
            "index.html";

    }

})();



function parseJwt(token) {

    try {

        return JSON.parse(
            atob(
                token.split(".")[1]
            )
        );

    } catch {

        return null;

    }

}



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



function logoutForcado() {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    localStorage.removeItem(
        "token"
    );

    if (!paginasPublicas.includes(pagina)) {
        window.location.replace(
            "login.html"
        );
    }

}



function checarSessao() {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (paginasPublicas.includes(pagina)) {
        return;
    }

    if (tokenExpirado()) {

        logoutForcado();

    }

}



setInterval(
    checarSessao,
    5000
);



function interceptarEventos() {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (paginasPublicas.includes(pagina)) {
        return;
    }

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



// 👁️ MOSTRAR TELA

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const paginasPublicas = [
            "login.html"
        ];

        const pagina =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

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



// 🚪 LOGOUT

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "usuarioNome"
    );

    localStorage.removeItem(
        "usuarioFoto"
    );

    localStorage.removeItem(
        "usuarioEmail"
    );

    window.location.href =
        "login.html";

}



// 🌐 FETCH GLOBAL

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



function validarSessao() {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (paginasPublicas.includes(pagina)) {
        return;
    }

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
// HEADER & SIDEBAR
// =====================================================

const headerHTML = `

<header class="custom-header">

    <div
        style="
            display:flex;
            align-items:center;
            width:100%;
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
                    alt="Logo"
                />

            </a>

        </span>

    </div>

</header>

`;



const paginaAtualSidebar =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

const ehPDV =
    paginaAtualSidebar ===
    "pdv.html";

const ehCadastroProduto =
    paginaAtualSidebar ===
    "cadastrop.html";



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
                alt="Cadastro de Produtos"
            />

            <span class="nav-text">
                Cadastro de
                <br>
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
                alt="Cadastro de Funcionários"
            />

            <span class="nav-text">
                Cadastro de
                <br>
                Funcionários
            </span>

        </a>

    </nav>

</aside>

`;



// =====================================================
// AÇÕES ESPECIAIS NO HEADER
// =====================================================
function instalarEstiloAcoesEspeciaisHeader() {

    if (
        document.getElementById(
            "acoes-especiais-header-style"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "acoes-especiais-header-style";

    style.textContent = `
        .acoes-especiais-header {
            position: fixed !important;

            top: 7px !important;
            right: 14px !important;

            z-index: 2000 !important;

            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            gap: 4px !important;

            width: 42px !important;
            height: 42px !important;

            padding: 0 !important;
            margin: 0 !important;

            pointer-events: none !important;
        }

        .header-acao-especial {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 40px !important;
            height: 40px !important;

            min-width: 40px !important;
            min-height: 40px !important;

            padding: 0 !important;
            margin: 0 !important;

            border: 0 !important;
            outline: 0 !important;

            background: transparent !important;
            box-shadow: none !important;

            cursor: pointer !important;

            pointer-events: auto !important;

            flex: 0 0 40px !important;

            line-height: 0 !important;
        }

        .header-acao-especial img {
            display: block !important;

            width: 38px !important;
            height: 38px !important;

            max-width: 38px !important;
            max-height: 38px !important;

            margin: 0 auto !important;

            object-fit: contain !important;

            transform-origin: center center;
        }

        .header-acao-especial:hover img {
            transform: scale(1.04);
        }

        .header-acao-especial:active img {
            transform: scale(.98);
        }

        #dialogCriarCategoriaSidebar {
            border: 0;
            padding: 0;
            border-radius: 14px;
            background: transparent;
            overflow: visible;
        }

        #dialogCriarCategoriaSidebar::backdrop {
            background: rgba(0, 0, 0, .55);
        }

        .criar-categoria-sidebar-box {
            width: 380px;
            max-width: calc(100vw - 32px);
            box-sizing: border-box;
            padding: 24px;
            border-radius: 14px;
            background: #fff;
            color: #2b1f14;
            box-shadow: 0 12px 35px rgba(0,0,0,.28);
            font-family: Arial, sans-serif;
        }

        .criar-categoria-sidebar-topo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .criar-categoria-sidebar-topo h2 {
            margin: 0;
            font-size: 23px;
        }

        .criar-categoria-sidebar-fechar {
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 50%;
            background: #eee;
            color: #2b1f14;
            font-size: 23px;
            cursor: pointer;
        }

        .criar-categoria-sidebar-box label {
            display: block;
            margin-bottom: 7px;
            font-weight: 700;
        }

        #novaCategoriaSidebarNome {
            width: 100%;
            height: 44px;
            box-sizing: border-box;
            padding: 0 12px;
            border: 1px solid #bbb;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
        }

        #novaCategoriaSidebarNome:focus {
            border-color: #c88932;
            box-shadow: 0 0 0 2px rgba(200,137,50,.18);
        }

        .criar-categoria-sidebar-acoes {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }

        .criar-categoria-sidebar-acoes button {
            min-width: 110px;
            height: 42px;
            padding: 0 15px;
            border: 0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
        }

        #btnCancelarNovaCategoriaSidebar {
            background: #e5e5e5;
            color: #2b1f14;
        }

        #btnSalvarNovaCategoriaSidebar {
            background: #2b1f14;
            color: #f1b869;
        }

        #criarCategoriaSidebarMensagem {
            display: none;
            margin-top: 10px;
            font-size: 14px;
            font-weight: 700;
        }
    `;

    document.head.appendChild(
        style
    );

}


function criarModalCategoriaSidebar() {

    let dialog =
        document.getElementById(
            "dialogCriarCategoriaSidebar"
        );

    if (dialog) {
        return dialog;
    }

    dialog =
        document.createElement("dialog");

    dialog.id =
        "dialogCriarCategoriaSidebar";

    dialog.innerHTML = `
        <div class="criar-categoria-sidebar-box">

            <div class="criar-categoria-sidebar-topo">

                <h2>
                    Criar categoria
                </h2>

                <button
                    type="button"
                    class="criar-categoria-sidebar-fechar"
                    id="btnFecharNovaCategoriaSidebar"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <label
                for="novaCategoriaSidebarNome"
            >
                Nome da categoria
            </label>

            <input
                type="text"
                id="novaCategoriaSidebarNome"
                maxlength="100"
                autocomplete="off"
                placeholder="Digite o nome da categoria"
            >

            <div
                id="criarCategoriaSidebarMensagem"
            ></div>

            <div class="criar-categoria-sidebar-acoes">

                <button
                    type="button"
                    id="btnCancelarNovaCategoriaSidebar"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    id="btnSalvarNovaCategoriaSidebar"
                >
                    Criar categoria
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        dialog
    );

    const fechar =
        () => {

            if (dialog.open) {
                dialog.close();
            }

        };

    document
        .getElementById(
            "btnFecharNovaCategoriaSidebar"
        )
        ?.addEventListener(
            "click",
            fechar
        );

    document
        .getElementById(
            "btnCancelarNovaCategoriaSidebar"
        )
        ?.addEventListener(
            "click",
            fechar
        );

    dialog.addEventListener(
        "cancel",
        event => {

            event.preventDefault();
            fechar();

        }
    );

    document
        .getElementById(
            "novaCategoriaSidebarNome"
        )
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    document
                        .getElementById(
                            "btnSalvarNovaCategoriaSidebar"
                        )
                        ?.click();

                }

            }
        );

    return dialog;

}


async function abrirCriarCategoriaSidebar() {

    const dialog =
        criarModalCategoriaSidebar();

    const input =
        document.getElementById(
            "novaCategoriaSidebarNome"
        );

    const mensagem =
        document.getElementById(
            "criarCategoriaSidebarMensagem"
        );

    const botaoSalvar =
        document.getElementById(
            "btnSalvarNovaCategoriaSidebar"
        );

    const nome =
        input;

    if (
        mensagem
    ) {

        mensagem.style.display =
            "none";

        mensagem.textContent =
            "";

    }

    if (nome) {
        nome.value = "";
    }

    if (
        botaoSalvar
    ) {

        botaoSalvar.disabled =
            false;

        botaoSalvar.textContent =
            "Criar categoria";

    }

    try {

        if (!dialog.open) {
            dialog.showModal();
        }

    } catch (erro) {

        console.error(
            "Erro ao abrir o cadastro de categoria:",
            erro
        );

        return;

    }

    setTimeout(
        () => {

            input?.focus();

        },
        80
    );



    const salvar =
        async () => {

            const nomeCategoria =
                String(
                    input?.value || ""
                ).trim();

            if (!nomeCategoria) {

                if (mensagem) {
                    mensagem.textContent =
                        "Digite o nome da categoria.";
                    mensagem.style.display =
                        "block";
                    mensagem.style.color =
                        "#b42318";
                }

                input?.focus();

                return;

            }

            if (
                nomeCategoria.length > 100
            ) {

                if (mensagem) {
                    mensagem.textContent =
                        "O nome da categoria deve ter no máximo 100 caracteres.";
                    mensagem.style.display =
                        "block";
                    mensagem.style.color =
                        "#b42318";
                }

                input?.focus();

                return;

            }

            if (botaoSalvar) {
                botaoSalvar.disabled =
                    true;
                botaoSalvar.textContent =
                    "Salvando...";
            }

            try {

                const resposta =
                    await apiFetch(
                        "http://localhost:3000/categorias",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                nome:
                                    nomeCategoria
                            })
                        }
                    );

                const dados =
                    await resposta
                        .json()
                        .catch(
                            () => ({})
                        );

                if (!resposta.ok) {

                    throw new Error(
                        dados.erro ||
                        "Não foi possível criar a categoria."
                    );

                }

                if (
                    mensagem
                ) {

                    mensagem.textContent =
                        "Categoria criada com sucesso.";

                    mensagem.style.display =
                        "block";

                    mensagem.style.color =
                        "#18794e";

                }

                /*
                 * O cadastrop.html atual declara
                 * carregarCategorias() no script da página.
                 * Atualizamos a lista existente sem
                 * alterar o seletor original.
                 */
                if (
                    typeof window
                        .carregarCategorias ===
                    "function"
                ) {

                    await window
                        .carregarCategorias();

                }

                if (
                    botaoSalvar
                ) {

                    botaoSalvar.textContent =
                        "Criado";

                }

                setTimeout(
                    () => {

                        if (dialog.open) {
                            dialog.close();
                        }

                    },
                    500
                );

            } catch (erro) {

                console.error(
                    "Erro ao criar categoria:",
                    erro
                );

                if (mensagem) {

                    mensagem.textContent =
                        erro.message ||
                        "Erro ao criar categoria.";

                    mensagem.style.display =
                        "block";

                    mensagem.style.color =
                        "#b42318";

                }

                if (botaoSalvar) {

                    botaoSalvar.disabled =
                        false;

                    botaoSalvar.textContent =
                        "Criar categoria";

                }

            }

        };



    const botaoSalvarElemento =
        document.getElementById(
            "btnSalvarNovaCategoriaSidebar"
        );



    if (
        botaoSalvarElemento
    ) {

        botaoSalvarElemento.onclick =
            salvar;

    }

}


function instalarAcoesEspeciaisHeader() {

    instalarEstiloAcoesEspeciaisHeader();

    const header =
        document.querySelector(
            ".custom-header"
        );

    if (!header) {
        return;
    }



    let container =
        document.getElementById(
            "acoes-especiais-header"
        );



    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "acoes-especiais-header";

        container.className =
            "acoes-especiais-header";

        /*
         * Fica dentro do header no DOM,
         * mas é position:fixed.
         *
         * Portanto não aumenta nem empurra
         * a altura do header.
         */

        header.appendChild(
            container
        );

    }



    container.innerHTML =
        "";



    // -------------------------------------------------
    // PDV: FECHAMENTO
    // -------------------------------------------------

    if (ehPDV) {

        const botao =
            document.createElement(
                "button"
            );

        botao.type =
            "button";

        botao.id =
            "btn-fechamento-pdv-header";

        botao.className =
            "header-acao-especial";

        botao.title =
            "Fechamento do Caixa";

        botao.setAttribute(
            "aria-label",
            "Fechamento do Caixa"
        );



        const imagem =
            document.createElement(
                "img"
            );

        imagem.src =
            "../backend/imagens/fechamento_p.png";

        imagem.alt =
            "Fechamento do Caixa";



        imagem.onerror =
            () => {

                console.error(
                    "Não foi possível carregar fechamento_p.png:",
                    imagem.src
                );

            };



        botao.appendChild(
            imagem
        );

        container.appendChild(
            botao
        );



        botao.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();



                function tentarAbrirFechamento(
                    tentativa = 0
                ) {

                    if (
                        typeof window
                            .abrirFechamentoDiario ===
                        "function"
                    ) {

                        window
                            .abrirFechamentoDiario();

                        return;

                    }



                    if (
                        tentativa < 60
                    ) {

                        setTimeout(
                            () =>
                                tentarAbrirFechamento(
                                    tentativa + 1
                                ),
                            50
                        );

                        return;

                    }



                    console.error(
                        "A função abrirFechamentoDiario não ficou disponível no PDV."
                    );

                }



                tentarAbrirFechamento();

            }
        );

    }



    // -------------------------------------------------
    // CADASTRO DE PRODUTO: CRIAR CATEGORIA
    // -------------------------------------------------

    if (ehCadastroProduto) {

        const botao =
            document.createElement(
                "button"
            );

        botao.type =
            "button";

        botao.id =
            "btn-categoria-produto-header";

        botao.className =
            "header-acao-especial";

        botao.title =
            "Criar categoria";

        botao.setAttribute(
            "aria-label",
            "Criar categoria"
        );



        const imagem =
            document.createElement(
                "img"
            );

        imagem.src =
            "../backend/imagens/categoria_p.png";

        imagem.alt =
            "Criar categoria";



        imagem.onerror =
            () => {

                console.error(
                    "Não foi possível carregar categoria_p.png:",
                    imagem.src
                );

            };



        botao.appendChild(
            imagem
        );

        container.appendChild(
            botao
        );



        botao.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                abrirCriarCategoriaSidebar();

            }
        );

    }

}



// =====================================================
// FOTO DO USUÁRIO
// =====================================================

function obterCandidatosFotoUsuario(
    foto
) {

    const candidatos = [];

    const padrao =
        "../backend/imagens/def_avt.jpg";

    if (
        foto === null ||
        foto === undefined
    ) {

        return [padrao];

    }

    let valor =
        String(foto)
            .trim()
            .replace(/\\/g, "/");

    if (
        !valor ||
        valor === "null" ||
        valor === "undefined"
    ) {

        return [padrao];

    }



    if (
        valor.startsWith("data:image/")
    ) {

        return [
            valor,
            padrao
        ];

    }



    if (
        valor.startsWith("http://") ||
        valor.startsWith("https://")
    ) {

        candidatos.push(valor);

        candidatos.push(padrao);

        return candidatos;

    }



    if (
        valor.startsWith(
            "../backend/"
        )
    ) {

        candidatos.push(
            valor
        );

    }



    if (
        valor.startsWith("/backend/")
    ) {

        candidatos.push(
            "http://localhost:3000" +
            valor
        );

    }



    if (
        valor.startsWith("/")
    ) {

        candidatos.push(
            "http://localhost:3000" +
            valor
        );

    }



    if (
        valor.startsWith("backend/")
    ) {

        candidatos.push(
            "../" +
            valor
        );

        candidatos.push(
            "http://localhost:3000/" +
            valor
        );

    }



    if (
        valor.startsWith("imagens/")
    ) {

        candidatos.push(
            "../backend/" +
            valor
        );

        candidatos.push(
            "http://localhost:3000/" +
            valor
        );

    }



    if (
        !valor.startsWith("../") &&
        !valor.startsWith("./") &&
        !valor.startsWith("/")
    ) {

        candidatos.push(
            "../backend/" +
            valor
        );

        candidatos.push(
            "http://localhost:3000/" +
            valor
        );

        candidatos.push(
            "http://localhost:3000/imagens/" +
            valor
        );

    }



    candidatos.push(
        valor
    );



    const nomeArquivo =
        valor.split("/").pop();

    if (nomeArquivo) {

        candidatos.push(
            "http://localhost:3000/imagens/" +
            nomeArquivo
        );

        candidatos.push(
            "http://localhost:3000/uploads/" +
            nomeArquivo
        );

        candidatos.push(
            "../backend/imagens/" +
            nomeArquivo
        );

    }



    candidatos.push(
        padrao
    );



    return [
        ...new Set(
            candidatos.filter(Boolean)
        )
    ];

}



function atualizarFotoSidebar(
    foto
) {

    const elFoto =
        document.getElementById(
            "sidebar-foto"
        );

    if (!elFoto) {
        return;
    }



    const candidatos =
        obterCandidatosFotoUsuario(
            foto
        );



    let indice =
        0;



    function tentarFoto() {

        if (
            indice >=
            candidatos.length
        ) {

            elFoto.onerror =
                null;

            elFoto.src =
                "../backend/imagens/def_avt.jpg";

            return;

        }



        const url =
            candidatos[indice];

        indice++;



        elFoto.onerror =
            () => {

                tentarFoto();

            };



        elFoto.src =
            url;

    }



    tentarFoto();

}



// =====================================================
// CARREGAR MENU
// =====================================================

function carregarMenu() {

    const paginasPublicas = [
        "login.html"
    ];

    const paginaAtual =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (paginasPublicas.includes(paginaAtual)) {
        return;
    }

    const body =
        document.body;



    // -------------------------------------------------
    // DETECÇÃO AUTOMÁTICA DE TEMA (FUNDO ESCURO OU LARANJA)
    // -------------------------------------------------

    const paginasFundoEscuro = [
        "editarprod.html",
        "cadastrop.html",
        "cadastrof.html"
    ];

    if (
        paginasFundoEscuro.includes(paginaAtual) ||
        window.getComputedStyle(body).backgroundColor === "rgb(36, 38, 40)"
    ) {

        body.classList.add("fundo-laranja");

    }



    // -------------------------------------------------
    // HEADER
    // -------------------------------------------------

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



    // -------------------------------------------------
    // AÇÕES ESPECIAIS — SOMENTE NO HEADER
    // -------------------------------------------------

    instalarAcoesEspeciaisHeader();



    // -------------------------------------------------
    // SIDEBAR
    // -------------------------------------------------

    /*
     * IMPORTANTE:
     *
     * O PDV usa:
     *
     * <body class="sem-sidebar fundo-marrom">
     *
     * Portanto ele continua SEM sidebar.
     */

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



        if (elNome) {

            elNome.innerText =
                nomeBanco ||
                "Convidado";

        }



        /*
         * FOTO DE PERFIL
         *
         * Continua sendo tratada
         * separadamente dos botões.
         */

        atualizarFotoSidebar(
            fotoBanco
        );



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

    }



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



    links.forEach(
        link => {

            const href =
                link.getAttribute(
                    "href"
                );



            if (
                href ===
                paginaAtual
            ) {

                link.classList.add(
                    "ativo"
                );

            }

        }
    );

}



function normalizarTexto(
    texto
) {

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
// SINCRONIZAR DADOS DO USUÁRIO COM O BANCO
// =====================================================

async function sincronizarPerfilUsuario() {

    const paginasPublicas = [
        "login.html"
    ];

    const pagina =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (paginasPublicas.includes(pagina)) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );



    if (
        !token ||
        token === "undefined" ||
        token === "null"
    ) {

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
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }

                }
            );



        if (
            response.status === 401 ||
            response.status === 403
        ) {

            console.error(
                "Falha ao autenticar na rota /perfil/meus-dados."
            );

            return;

        }



        if (!response.ok) {

            console.error(
                "Erro ao buscar os dados do perfil:",
                response.status
            );

            return;

        }



        const dados =
            await response.json();



        const nome =
            dados.nome ||
            localStorage.getItem(
                "usuarioNome"
            ) ||
            "Convidado";



        localStorage.setItem(
            "usuarioNome",
            nome
        );



        const elNome =
            document.getElementById(
                "sidebar-nome"
            );



        if (elNome) {

            elNome.innerText =
                nome;

        }



        if (
            dados.foto !==
            undefined &&
            dados.foto !==
            null &&
            String(
                dados.foto
            ).trim() !== ""
        ) {

            localStorage.setItem(
                "usuarioFoto",
                dados.foto
            );



            atualizarFotoSidebar(
                dados.foto
            );

        } else {

            localStorage.removeItem(
                "usuarioFoto"
            );



            atualizarFotoSidebar(
                null
            );

        }



    } catch (erro) {

        console.error(
            "Erro ao sincronizar perfil:",
            erro
        );



        const fotoLocal =
            localStorage.getItem(
                "usuarioFoto"
            );



        atualizarFotoSidebar(
            fotoLocal
        );



        const nomeLocal =
            localStorage.getItem(
                "usuarioNome"
            );



        const elNome =
            document.getElementById(
                "sidebar-nome"
            );



        if (elNome) {

            elNome.innerText =
                nomeLocal ||
                "Convidado";

        }

    }

}



// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarMenu();

        setTimeout(
            () => {

                sincronizarPerfilUsuario();

            },
            50
        );

    }
);