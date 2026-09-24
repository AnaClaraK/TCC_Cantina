// 🔒 PROTEÇÃO DE PÁGINA

(function () {

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

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 2000);

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

    localStorage.removeItem(
        "token"
    );

    window.location.replace(
        "login.html"
    );

}



function checarSessao() {

    if (tokenExpirado()) {

        logoutForcado();

    }

}



setInterval(
    checarSessao,
    5000
);



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



// 👁️ MOSTRAR TELA

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
        .toLowerCase() ===
    "pdv.html";



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



        ${
            ehPDV
                ?
                `
                <a
                    href="#"
                    id="nav-fechamento-pdv"
                    class="nav-link nav-link-fechamento"
                    title="Fechamento do Caixa"
                >

                    <img
                        class="i_img"
                        data-name="fechamento"
                        src="imagens/fechamento_p.png"
                        alt="Fechamento"
                    />

                    <span class="nav-text">
                        Fechamento
                    </span>

                </a>
                `
                :
                ""
        }



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
                src="imagens/cadastrof_p.png"
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



    // Data URL

    if (
        valor.startsWith("data:image/")
    ) {

        return [
            valor,
            padrao
        ];

    }



    // URL completa

    if (
        valor.startsWith("http://") ||
        valor.startsWith("https://")
    ) {

        candidatos.push(valor);

        candidatos.push(padrao);

        return candidatos;

    }



    // Já está no formato usado pelo frontend

    if (
        valor.startsWith(
            "../backend/"
        )
    ) {

        candidatos.push(
            valor
        );

    }



    // Caminho absoluto do backend

    if (
        valor.startsWith("/backend/")
    ) {

        candidatos.push(
            "http://localhost:3000" +
            valor
        );

    }



    // Caminho absoluto

    if (
        valor.startsWith("/")
    ) {

        candidatos.push(
            "http://localhost:3000" +
            valor
        );

    }



    // Caminho relativo começando por backend

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



    // Caminho relativo começando por imagens

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



    // Caminho relativo comum

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



    // Mantém o próprio valor como tentativa,
    // caso o backend já entregue um caminho relativo válido.

    candidatos.push(
        valor
    );



    // Tenta pelo nome do arquivo nas pastas
    // mais comuns do backend.

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
// AÇÕES ESPECÍFICAS DO HEADER
// =====================================================

function configurarAcoesEspecificasHeader() {

    const header =
        document.querySelector(
            ".custom-header"
        );

    if (!header) {
        return;
    }



    const areaHeader =
        header.firstElementChild;

    if (!areaHeader) {
        return;
    }



    areaHeader.style.width =
        "100%";



    const paginaAtual =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();



    // -------------------------------------------------
    // FECHAMENTO DIÁRIO — SOMENTE NO PDV
    // -------------------------------------------------

    if (
        paginaAtual === "pdv.html" &&
        !document.getElementById(
            "btn-fechamento-pdv"
        )
    ) {

        const btnFechamento =
            document.createElement(
                "button"
            );

        btnFechamento.type =
            "button";

        btnFechamento.id =
            "btn-fechamento-pdv";

        btnFechamento.className =
            "header-fechamento-pdv";

        btnFechamento.title =
            "Fechamento do Caixa";

        btnFechamento.style.marginLeft =
            "auto";

        btnFechamento.style.marginRight =
            "18px";

        btnFechamento.style.width =
            "42px";

        btnFechamento.style.height =
            "42px";

        btnFechamento.style.padding =
            "4px";

        btnFechamento.style.border =
            "0";

        btnFechamento.style.background =
            "transparent";

        btnFechamento.style.display =
            "flex";

        btnFechamento.style.alignItems =
            "center";

        btnFechamento.style.justifyContent =
            "center";

        btnFechamento.style.cursor =
            "pointer";

        btnFechamento.setAttribute(
            "aria-label",
            "Fechamento do Caixa"
        );



        const imagem =
            document.createElement(
                "img"
            );

        imagem.className =
            "l_img";

        imagem.setAttribute(
            "data-name",
            "fechamento"
        );

        imagem.src =
            "../backend/imagens/fechamento_p.png";

        imagem.alt =
            "Fechamento";

        imagem.style.width =
            "32px";

        imagem.style.height =
            "32px";

        imagem.style.objectFit =
            "contain";

        imagem.style.display =
            "block";



        btnFechamento.appendChild(
            imagem
        );



        areaHeader.appendChild(
            btnFechamento
        );



        btnFechamento.addEventListener(
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
                        tentativa < 40
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
    // NOVA CATEGORIA — SOMENTE NO CADASTRO DE PRODUTO
    // -------------------------------------------------

    if (
        paginaAtual === "cadastrop.html" &&
        !document.getElementById(
            "btn-nova-categoria-header"
        )
    ) {

        const btnCategoria =
            document.createElement(
                "button"
            );

        btnCategoria.type =
            "button";

        btnCategoria.id =
            "btn-nova-categoria-header";

        btnCategoria.className =
            "header-categoria-produto";

        btnCategoria.title =
            "Cadastrar nova categoria";

        btnCategoria.setAttribute(
            "aria-label",
            "Cadastrar nova categoria"
        );

        btnCategoria.style.marginLeft =
            "auto";

        btnCategoria.style.marginRight =
            "18px";

        btnCategoria.style.width =
            "42px";

        btnCategoria.style.height =
            "42px";

        btnCategoria.style.padding =
            "4px";

        btnCategoria.style.border =
            "0";

        btnCategoria.style.background =
            "transparent";

        btnCategoria.style.display =
            "flex";

        btnCategoria.style.alignItems =
            "center";

        btnCategoria.style.justifyContent =
            "center";

        btnCategoria.style.cursor =
            "pointer";



        const imagemCategoria =
            document.createElement(
                "img"
            );

        imagemCategoria.src =
            "../backend/imagens/categoria_p.png";

        imagemCategoria.alt =
            "Nova categoria";

        imagemCategoria.style.width =
            "32px";

        imagemCategoria.style.height =
            "32px";

        imagemCategoria.style.objectFit =
            "contain";

        imagemCategoria.style.display =
            "block";



        btnCategoria.appendChild(
            imagemCategoria
        );



        areaHeader.appendChild(
            btnCategoria
        );



        btnCategoria.addEventListener(
            "mouseenter",
            () => {

                imagemCategoria.style.filter =
                    "brightness(0.96)";

            }
        );



        btnCategoria.addEventListener(
            "mouseleave",
            () => {

                imagemCategoria.style.filter =
                    "none";

            }
        );



        btnCategoria.addEventListener(
            "click",
            event => {

                event.preventDefault();



                const modal =
                    document.getElementById(
                        "modalNovaCategoria"
                    );

                const input =
                    document.getElementById(
                        "nomeNovaCategoria"
                    );



                if (!modal) {
                    return;
                }



                if (input) {

                    input.value =
                        "";

                }



                if (
                    typeof modal.showModal ===
                    "function"
                ) {

                    modal.showModal();

                } else {

                    modal.setAttribute(
                        "open",
                        ""
                    );

                }



                if (input) {

                    setTimeout(
                        () =>
                            input.focus(),
                        80
                    );

                }

            }
        );

    }

}



// =====================================================
// CARREGAR MENU
// =====================================================

function carregarMenu() {

    const body =
        document.body;



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



    configurarAcoesEspecificasHeader();



    // -------------------------------------------------
    // SIDEBAR
    // -------------------------------------------------

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



        atualizarFotoSidebar(
            fotoBanco
        );



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



        // -------------------------------------------------
        // FECHAMENTO — SOMENTE NO PDV
        // -------------------------------------------------

        const btnFechamento =
            document.getElementById(
                "nav-fechamento-pdv"
            );



        if (btnFechamento) {

            btnFechamento.addEventListener(
                "click",
                event => {

                    event.preventDefault();



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
                            tentativa < 40
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



        // -------------------------------------------------
        // FOTO
        // -------------------------------------------------

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