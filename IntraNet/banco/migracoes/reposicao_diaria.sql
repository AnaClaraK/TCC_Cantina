-- As tabelas também são criadas automaticamente pelas rotas da reposição.
-- Execute este arquivo opcionalmente para preparar a estrutura antes de usar a tela.
CREATE TABLE IF NOT EXISTS reposicao_diaria_config (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    quantidade_diaria INT NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reposicao_diaria_produto (id_produto),
    CONSTRAINT fk_reposicao_diaria_produto FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reposicao_diaria_geradas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    data_referencia DATE NOT NULL,
    id_produto INT NOT NULL,
    id_compra INT NOT NULL,
    UNIQUE KEY uq_reposicao_diaria_data_produto (data_referencia, id_produto),
    UNIQUE KEY uq_reposicao_diaria_compra (id_compra),
    CONSTRAINT fk_reposicao_diaria_compra FOREIGN KEY (id_compra)
        REFERENCES reposicao(id_compra) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Estoque compartilhado de preparos/insumos (ml, g ou un).
CREATE TABLE IF NOT EXISTS estoque_insumos (
    id_insumo INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    quantidade DECIMAL(12,2) NOT NULL DEFAULT 0,
    unidade VARCHAR(10) NOT NULL DEFAULT 'ml',
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_estoque_insumo_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS produtos_insumos (
    id_produto INT NOT NULL,
    id_insumo INT NOT NULL,
    consumo_por_unidade DECIMAL(10,3) NOT NULL,
    PRIMARY KEY (id_produto, id_insumo),
    CONSTRAINT fk_produto_insumo_produto FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_produto_insumo_insumo FOREIGN KEY (id_insumo)
        REFERENCES estoque_insumos(id_insumo) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
