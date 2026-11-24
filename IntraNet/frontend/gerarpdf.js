function gerarPDFMensalPedidos() {
    
    const pedidosDoMes = typeof obterPedidosDoMesAtual === "function" 
        ? obterPedidosDoMesAtual() 
        : [];

    if (!pedidosDoMes || pedidosDoMes.length === 0) {
        if (typeof exibirAviso === "function") {
            exibirAviso("Não há pedidos realizados neste mês para exportar o PDF.");
        } else {
            alert("Não há pedidos realizados neste mês para exportar o PDF.");
        }
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const corFundoEscuro = [28, 28, 28];
    const corLaranja = [239, 172, 74];
    const corTextoEscuro = [31, 35, 41];

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const nomeMes = agora.toLocaleString("pt-BR", { month: "long" });

    const dia = String(agora.getDate()).padStart(2, '0');
    const mesNum = String(mesAtual + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    const dataHoraEmissao = `${dia}/${mesNum}/${ano} ${horas}:${minutos}:${segundos}`;

    let usuarioLogado = localStorage.getItem("usuarioNome");

    if (!usuarioLogado || usuarioLogado === "null" || usuarioLogado.trim() === "") {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = typeof parseJwt === "function" 
                    ? parseJwt(token) 
                    : JSON.parse(atob(token.split(".")[1]));

                usuarioLogado = payload.nome || payload.nomeUsuario || payload.usuario || payload.email;
            } catch (e) {
                console.warn("Não foi possível decodificar o token para obter o nome.");
            }
        }
    }

    if (!usuarioLogado || usuarioLogado === "null") {
        usuarioLogado = "Usuário do Sistema";
    }

    let totalMes = 0;
    const contador = {};

    pedidosDoMes.forEach(pedido => {
        
        totalMes += Number(pedido.valor_total || 0);

        let listaProds = pedido.itens || pedido.produtos || [];
        if (typeof listaProds === "string") {
            try { 
                listaProds = JSON.parse(listaProds); 
            } catch (e) { 
                listaProds = []; 
            }
        }

        if (Array.isArray(listaProds)) {
            listaProds.forEach(prod => {
                const nome = prod.nome || prod.nome_produto || "Produto Sem Nome";
                const qtd = Number(prod.qtd || prod.quantidade || 1);
                if (nome) contador[nome] = (contador[nome] || 0) + qtd;
            });
        }
    });

    const totalMesFormatado = totalMes.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    const rankingMes = Object.entries(contador)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

    doc.setFillColor(...corLaranja);
    doc.rect(0, 0, 210, 32, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...corFundoEscuro);
    doc.text("RELATÓRIO MENSAL DE PEDIDOS", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`Referente a: ${nomeMes.toUpperCase()} de ${anoAtual}`, 14, 22);

    doc.setFontSize(8);
    doc.text(`Gerado em: ${dataHoraEmissao}`, 196, 14, { align: "right" });
    doc.text(`Emitido por: ${usuarioLogado}`, 196, 21, { align: "right" });

    doc.setFillColor(248, 243, 235);
    doc.roundedRect(14, 38, 182, 18, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...corTextoEscuro);
    doc.text("FATURAMENTO TOTAL DO MÊS:", 18, 49);

    doc.setFontSize(12);
    doc.setTextColor(200, 130, 30);
    doc.text(totalMesFormatado, 82, 49);

    let y = 64;
    if (rankingMes.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Top Produtos mais vendidos no mês:", 14, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        rankingMes.slice(0, 5).forEach((produto, index) => {
            doc.text(`${index + 1}° ${produto.nome} (${produto.quantidade} un.)`, 18, y);
            y += 5;
        });
        y += 4;
    }

    const colunas = ["Cliente", "Nº Pedido", "Origem", "Data/Hora", "Valor Total", "Pagamento"];
    const linhas = pedidosDoMes.map(pedido => [
        pedido.nome || "Consumidor Final",
        `#${pedido.num_pedido || pedido.id_pedido || "-"}`,
        pedido.origem || "PDV",
        pedido.data ? new Date(pedido.data).toLocaleString("pt-BR") : "-",
        `R$ ${Number(pedido.valor_total || 0).toFixed(2).replace(".", ",")}`,
        typeof formatarFormaPagamento === "function" 
            ? formatarFormaPagamento(pedido.form_pag) 
            : (pedido.form_pag || "-")
    ]);

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: y,
        theme: "grid",
        headStyles: { 
            fillColor: corFundoEscuro, 
            textColor: corLaranja, 
            fontStyle: "bold", 
            halign: "left" 
        },
        alternateRowStyles: { fillColor: [250, 247, 242] },
        bodyStyles: { textColor: corTextoEscuro, fontSize: 8 },
        columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
        didDrawPage: function () {
            const str = `Página ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(120, 120, 120);
            doc.text(str, 196, 285, { align: "right" });
        }
    });

    doc.save(`Relatorio_Pedidos_${mesNum}_${anoAtual}.pdf`);
}

function gerarPdfReposicao() {
    const linhasTabela = Array.from(corpoTabela.querySelectorAll('tr'));

    if (linhasTabela.length === 0) {
        if (typeof exibirAviso === "function") {
            exibirAviso("A lista de reposição está vazia.");
        } else {
            alert("A lista de reposição está vazia.");
        }
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const corFundoEscuro = [28, 28, 28];
    const corLaranja = [239, 172, 74];
    const corTextoEscuro = [31, 35, 41];

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    const dataHoraEmissao = `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;

    let usuarioLogado = localStorage.getItem("usuarioNome");
    if (!usuarioLogado || usuarioLogado === "null" || usuarioLogado.trim() === "") {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = typeof parseJwt === "function" 
                    ? parseJwt(token) 
                    : JSON.parse(atob(token.split(".")[1]));
                usuarioLogado = payload.nome || payload.nomeUsuario || payload.usuario || payload.email;
            } catch (e) {
                console.warn("Erro ao extrair usuário do token.");
            }
        }
    }
    if (!usuarioLogado || usuarioLogado === "null") {
        usuarioLogado = "Usuário do Sistema";
    }

    doc.setFillColor(...corLaranja);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...corFundoEscuro);
    doc.text("RELATÓRIO DE REPOSIÇÃO DE ESTOQUE", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Lista de Compras / Controle de Insumos`, 14, 22);

    doc.setFontSize(8);
    doc.text(`Gerado em: ${dataHoraEmissao}`, 196, 14, { align: "right" });
    doc.text(`Emitido por: ${usuarioLogado}`, 196, 21, { align: "right" });

    const colunas = ["Produto", "Qtd Prevista", "Qtd Comprada", "Prioridade", "Local"];
    const dadosTabela = [];

    linhasTabela.forEach(linha => {
        
        if (linha.style.display === "none") return;

        const tds = linha.querySelectorAll('td');
        const produto = tds[0]?.innerText?.trim() || "-";
        const qtdPrevista = tds[1]?.innerText?.trim() || "0";

        const inputComprado = tds[2]?.querySelector('input');
        const qtdCompradaVal = inputComprado ? inputComprado.value.trim() : "";

        const qtdCompradaExibicao = (qtdCompradaVal !== "" && qtdCompradaVal !== "0") 
            ? qtdCompradaVal 
            : "_______";

        const prioridade = tds[3]?.innerText?.trim() || "Média";

        const inputLocal = tds[4]?.querySelector('input');
        const localVal = inputLocal ? inputLocal.value.trim() : tds[4]?.innerText?.trim() || "-";

        dadosTabela.push([
            produto,
            qtdPrevista,
            qtdCompradaExibicao,
            prioridade,
            localVal !== "" ? localVal : "-"
        ]);
    });

    doc.autoTable({
        head: [colunas],
        body: dadosTabela,
        startY: 36,
        theme: "grid",
        headStyles: { 
            fillColor: corFundoEscuro, 
            textColor: corLaranja, 
            fontStyle: "bold", 
            halign: "left" 
        },
        alternateRowStyles: { fillColor: [250, 247, 242] },
        bodyStyles: { textColor: corTextoEscuro, fontSize: 8.5 },
        columnStyles: { 
            1: { halign: "center", cellWidth: 30 }, 
            2: { halign: "center", cellWidth: 35 }, 
            3: { halign: "center", cellWidth: 30 }  
        },
        didDrawPage: function (data) {
            const str = `Página ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(120, 120, 120);
            doc.text(str, 196, 285, { align: "right" });
        }
    });

    doc.save(`Lista_Reposicao_${dia}_${mes}_${ano}.pdf`);
}

function gerarPDFReposicaoEstoque() {

    if (!Array.isArray(produtosCache)) {
        if (typeof exibirAviso === "function") {
            exibirAviso("Os produtos do estoque ainda não foram carregados.");
        } else {
            alert("Os produtos do estoque ainda não foram carregados.");
        }
        return;
    }

    const produtosParaReposicao = produtosCache
        .filter(produto => {
            const estoqueAtual = Number(produto.qtd || 0);
            const estoqueMinimo = Number(produto.qtd_min || 0);

            return estoqueAtual < estoqueMinimo;
        })
        .sort((a, b) => {
            const nomeA = String(a.nome || "").toLowerCase();
            const nomeB = String(b.nome || "").toLowerCase();

            return nomeA.localeCompare(nomeB, "pt-BR");
        });

    if (produtosParaReposicao.length === 0) {
        if (typeof exibirAviso === "function") {
            exibirAviso("Não há produtos abaixo do estoque mínimo para reposição.");
        } else {
            alert("Não há produtos abaixo do estoque mínimo para reposição.");
        }
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const corFundoEscuro = [28, 28, 28];
    const corLaranja = [239, 172, 74];
    const corTextoEscuro = [31, 35, 41];

    const agora = new Date();

    const dia = String(agora.getDate()).padStart(2, "0");
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const ano = agora.getFullYear();

    const horas = String(agora.getHours()).padStart(2, "0");
    const minutos = String(agora.getMinutes()).padStart(2, "0");
    const segundos = String(agora.getSeconds()).padStart(2, "0");

    const dataHoraEmissao =
        `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;

    let usuarioLogado = localStorage.getItem("usuarioNome");

    if (
        !usuarioLogado ||
        usuarioLogado === "null" ||
        usuarioLogado.trim() === ""
    ) {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const payload = typeof parseJwt === "function"
                    ? parseJwt(token)
                    : JSON.parse(atob(token.split(".")[1]));

                usuarioLogado =
                    payload.nome ||
                    payload.nomeUsuario ||
                    payload.usuario ||
                    payload.email;
            } catch (e) {
                console.warn("Erro ao extrair usuário do token.");
            }
        }
    }

    if (!usuarioLogado || usuarioLogado === "null") {
        usuarioLogado = "Usuário do Sistema";
    }

    doc.setFillColor(...corLaranja);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...corFundoEscuro);

    doc.text(
        "RELATÓRIO DE REPOSIÇÃO DE ESTOQUE ",
        14,
        15
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    doc.text(
        "Produtos abaixo do estoque mínimo",
        14,
        22
    );

    doc.setFontSize(8);

    doc.text(
        `Gerado em: ${dataHoraEmissao}`,
        196,
        14,
        { align: "right" }
    );

    doc.text(
        `Emitido por: ${usuarioLogado}`,
        196,
        21,
        { align: "right" }
    );

    const colunas = [
    "Nome do Produto",
    "Código",
    "Estoque Atual",
    "Estoque Mínimo"
];

const dadosTabela = produtosParaReposicao.map(produto => {

    const estoqueAtual = Number(produto.qtd || 0);
    const estoqueMinimo = Number(produto.qtd_min || 0);

    return [
        produto.nome || "-",
        produto.codigo_barras || "-",
        estoqueAtual,
        estoqueMinimo
    ];
});

    doc.autoTable({
        head: [colunas],
        body: dadosTabela,
        startY: 36,

        theme: "grid",

        headStyles: {
            fillColor: corFundoEscuro,
            textColor: corLaranja,
            fontStyle: "bold",
            halign: "left"
        },

        alternateRowStyles: {
            fillColor: [250, 247, 242]
        },

        bodyStyles: {
            textColor: corTextoEscuro,
            fontSize: 8.5
        },

        columnStyles: {
            1: {
                halign: "center"
            },
            2: {
                halign: "center"
            },
            3: {
                halign: "center"
            }
            
        },

        didDrawPage: function () {
            const pagina =
                `Página ${doc.internal.getNumberOfPages()}`;

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(120, 120, 120);

            doc.text(
                pagina,
                196,
                285,
                { align: "right" }
            );
        }
    });

    doc.save(
        `Relatorio_Reposicao_Estoque_${dia}_${mes}_${ano}.pdf`
    );
}
