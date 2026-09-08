// ===============================================
// ARQUIVO CENTRAL DE RELATÓRIOS PDF
// ===============================================

function gerarPDFMensalPedidos() {
    // 1. Obtém os pedidos filtrados do mês atual
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

    // Cores do tema
    const corFundoEscuro = [28, 28, 28];
    const corLaranja = [239, 172, 74];
    const corTextoEscuro = [31, 35, 41];

    // =============================================================
    // DATA, HORA EXATA (COM SEGUNDOS) E USUÁRIO LOGADO
    // =============================================================
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const nomeMes = agora.toLocaleString("pt-BR", { month: "long" });

    // Formatação: DD/MM/AAAA - HH:MM:SS
    const dia = String(agora.getDate()).padStart(2, '0');
    const mesNum = String(mesAtual + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    const dataHoraEmissao = `${dia}/${mesNum}/${ano} ${horas}:${minutos}:${segundos}`;

    // Captura do Usuário Logado
    let usuarioLogado = localStorage.getItem("usuarioNome");

    // Tentativa secundária via Payload JWT do Token se a chave estiver vazia
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

    // =============================================================
    // CÁLCULOS DO FATURAMENTO E RANKING MENSAL
    // =============================================================
    let totalMes = 0;
    const contador = {};

    pedidosDoMes.forEach(pedido => {
        // Soma Faturamento
        totalMes += Number(pedido.valor_total || 0);

        // Agrupa itens do ranking
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

    // =============================================================
    // MONTAGEM DO LAYOUT DO PDF
    // =============================================================

    // BANNER SUPERIOR (LARANJA)
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

    // Dados no canto superior direito do Banner
    doc.setFontSize(8);
    doc.text(`Gerado em: ${dataHoraEmissao}`, 196, 14, { align: "right" });
    doc.text(`Emitido por: ${usuarioLogado}`, 196, 21, { align: "right" });

    // CARD DE FATURAMENTO
    doc.setFillColor(248, 243, 235);
    doc.roundedRect(14, 38, 182, 18, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...corTextoEscuro);
    doc.text("FATURAMENTO TOTAL DO MÊS:", 18, 49);

    doc.setFontSize(12);
    doc.setTextColor(200, 130, 30);
    doc.text(totalMesFormatado, 82, 49);

    // RANKING DE PRODUTOS MAIS VENDIDOS NO MÊS
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

    // TABELA DE PEDIDOS DO MÊS
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

    // Download do arquivo PDF
    doc.save(`Relatorio_Pedidos_${mesNum}_${anoAtual}.pdf`);
}