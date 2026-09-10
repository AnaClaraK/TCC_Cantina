/* =========================================================
   SIDEBAR + HEADER
   ========================================================= */

(function () {
    "use strict";

    const ehPDV =
        document.body.classList.contains("sem-sidebar") ||
        document.body.classList.contains("pdv-com-sidebar") ||
        window.location.pathname.toLowerCase().includes("pdv");

    /* =========================================================
       HEADER / SIDEBAR
       ========================================================= */

    const headerHTML = `
        <header class="custom-header">

            <div class="header-logo">
                <img
                    class="l_img"
                    data-name="logo"
                    src="imagens/logo.png"
                    alt="Grano Vita"
                >
            </div>

            ${
                ehPDV
                    ? `
                    <button
                        type="button"
                        id="btn-fechamento-pdv"
                        class="header-fechamento-pdv"
                        title="Fechamento do Caixa"
                        aria-label="Fechamento do Caixa"
                    >
                        <img
                            class="l_img"
                            data-name="fechamento"
                            src="imagens/fechamento_p.png"
                            alt="Fechamento"
                        >
                    </button>
                    `
                    : ""
            }

            ${
                !ehPDV
                    ? `
                    <button
                        type="button"
                        id="btn-menu"
                        class="btn-menu"
                        aria-label="Abrir menu"
                    >
                        ☰
                    </button>
                    `
                    : ""
            }

        </header>
    `;

    const sidebarHTML = `
        <aside class="custom-sidebar">

            <div class="sidebar-logo">
                <img
                    class="l_img"
                    data-name="logo"
                    src="imagens/logo.png"
                    alt="Grano Vita"
                >
            </div>

            <nav class="sidebar-menu">

                <a href="pdv.html">
                    <span>PDV</span>
                </a>

                <a href="estoque.html">
                    <span>Estoque</span>
                </a>

                <a href="reposicao.html">
                    <span>Reposição</span>
                </a>

                <a href="pedidos.html">
                    <span>Pedidos</span>
                </a>

                <a href="clientes-fiado.html">
                    <span>Clientes / Fiado</span>
                </a>

                <a href="dashboard.html">
                    <span>Dashboard</span>
                </a>

                <a href="perfil.html">
                    <span>Perfil</span>
                </a>

            </nav>

        </aside>
    `;


    /* =========================================================
       INSERÇÃO
       ========================================================= */

    document.body.insertAdjacentHTML(
        "afterbegin",
        headerHTML
    );

    if (!ehPDV) {
        document.body.insertAdjacentHTML(
            "afterbegin",
            sidebarHTML
        );
    }


    /* =========================================================
       NORMALIZAÇÃO DAS IMAGENS
       ========================================================= */

    function normalizarImagens() {

        const imagens = document.querySelectorAll(
            "img.l_img[data-name]"
        );

        imagens.forEach(img => {

            const nome = img.dataset.name;

            if (!nome) return;

            /*
             * O backend mantém as imagens em:
             * backend/imagens/
             */

            const imagensBackend = {
                logo: "../backend/imagens/logo.png",
                fechamento: "../backend/imagens/fechamento_p.png"
            };

            if (imagensBackend[nome]) {
                img.src = imagensBackend[nome];
            }

        });
    }

    normalizarImagens();


    /* =========================================================
       BOTÃO DO MENU
       ========================================================= */

    if (!ehPDV) {

        const btnMenu =
            document.getElementById("btn-menu");

        const sidebar =
            document.querySelector(".custom-sidebar");

        if (btnMenu && sidebar) {

            btnMenu.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    sidebar.classList.toggle(
                        "sidebar-aberta"
                    );
                }
            );
        }
    }


    /* =========================================================
       FECHAMENTO DIÁRIO — BOTÃO DO HEADER DO PDV
       ========================================================= */

    const btnFechamentoHeader =
        document.getElementById(
            "btn-fechamento-pdv"
        );

    if (btnFechamentoHeader) {

        btnFechamentoHeader.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (
                    typeof window.abrirFechamentoDiario ===
                    "function"
                ) {
                    window.abrirFechamentoDiario();
                }

            },
            { once: true }
        );
    }


    /* =========================================================
       ESC FECHA SIDEBAR
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                !ehPDV
            ) {

                const sidebar =
                    document.querySelector(
                        ".custom-sidebar"
                    );

                if (sidebar) {
                    sidebar.classList.remove(
                        "sidebar-aberta"
                    );
                }
            }

        }
    );

})();