-- =====================================================
-- BACKUP AUTOMÁTICO DO BANCO CANTINA
-- =====================================================
-- Fechamento referente ao dia: 2026-10-05
-- Backup gerado em: 2026-10-06T17:33:30.494Z
-- Destino: backend/config/backups
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `cantina` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
USE `cantina`;

DROP TABLE IF EXISTS `cadastro`;
CREATE TABLE `cadastro` (
  `id_cadastro` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `senha` varchar(255) NOT NULL DEFAULT '',
  `img` varchar(255) NOT NULL,
  PRIMARY KEY (`id_cadastro`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `cadastro` (`id_cadastro`, `nome`, `email`, `senha`, `img`) VALUES
(1, 'Ana Banana', 'anabanana@gmail.com', '$2b$10$pvtAPO8Zo5cg19i03Kg87e.c.FQm0Q/zqzjNTLLfgZenw1FekZ1mO', '1790270343940.jpg'),
(2, 'Kemilly', 'kemillyregina@gmail.com', '5b41d889f9fa1c2d51448a8e009e16b7189030ce6cb637fba913ae33b231f702', '/imagens/1778585396841.jpg');

DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id_categoria`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `categorias` (`id_categoria`, `nome`) VALUES
(1, 'Bebidas Quentes'),
(2, 'Marmitas'),
(3, 'Picolés e Sorvetes'),
(4, 'Salgados'),
(5, 'Lanches'),
(6, 'Guloseimas'),
(7, 'Trufas'),
(8, 'Bebidas'),
(9, 'Batatinhas');

DROP TABLE IF EXISTS `clientes_fiado`;
CREATE TABLE `clientes_fiado` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  `dia_vencimento` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `contas_fiado`;
CREATE TABLE `contas_fiado` (
  `id_conta` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `valor_original` decimal(10,2) NOT NULL,
  `valor_final` decimal(10,2) NOT NULL,
  `juros_aplicado` tinyint(1) DEFAULT 0,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `data_vencimento` date NOT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `status` enum('Pendente','Pago','Atrasado') DEFAULT 'Pendente',
  `origem` varchar(50) DEFAULT NULL,
  `dia_vencimento` int(11) NOT NULL DEFAULT 10,
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_conta`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `contas_fiado_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes_fiado` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `conta_fiado_parcelas`;
CREATE TABLE `conta_fiado_parcelas` (
  `id_parcela` int(11) NOT NULL AUTO_INCREMENT,
  `id_conta` int(11) DEFAULT NULL,
  `id_pedido` int(11) NOT NULL,
  `numero_parcela` int(11) NOT NULL,
  `total_parcelas` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pendente',
  `data_pagamento` date DEFAULT NULL,
  PRIMARY KEY (`id_parcela`),
  KEY `idx_cfp_conta` (`id_conta`),
  KEY `idx_cfp_pedido` (`id_pedido`),
  KEY `idx_cfp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `conta_fiado_prod`;
CREATE TABLE `conta_fiado_prod` (
  `id_contprod` int(11) NOT NULL AUTO_INCREMENT,
  `id_conta` int(11) NOT NULL,
  `id_produto` int(11) DEFAULT NULL,
  `qtd` int(11) DEFAULT NULL,
  `valor_unit` decimal(10,2) DEFAULT NULL,
  `status_pagamento` varchar(20) NOT NULL DEFAULT 'Pendente',
  `juros_ativo` tinyint(1) NOT NULL DEFAULT 0,
  `tipo_juros` varchar(10) DEFAULT NULL,
  `taxa_juros` decimal(10,4) DEFAULT NULL,
  `valor_juros_inicio` decimal(12,2) DEFAULT NULL,
  `data_inicio_juros` date DEFAULT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_contprod`),
  KEY `Index 2` (`id_produto`),
  KEY `Index 3` (`id_conta`),
  CONSTRAINT `FK__produtos_fiado` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_conta_fiado_prod_contas_fiado` FOREIGN KEY (`id_conta`) REFERENCES `contas_fiado` (`id_conta`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `fechamentos`;
CREATE TABLE `fechamentos` (
  `id_fechamento` int(11) NOT NULL AUTO_INCREMENT,
  `data_referencia` date NOT NULL,
  `id_user_abertura` int(11) DEFAULT NULL,
  `id_user_fechamento` int(11) DEFAULT NULL,
  `troco_inicial` decimal(10,2) NOT NULL DEFAULT 0.00,
  `data_origem_troco` date DEFAULT NULL,
  `total_vendas` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_dinheiro` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_credito` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_debito` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_pix` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_voucher` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_fiado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_outros` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quantidade_vendas` int(11) NOT NULL DEFAULT 0,
  `dinheiro_esperado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `troco_proximo_dia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `diferenca_caixa` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'FECHADO',
  `fechado_em` datetime DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_fechamento`),
  UNIQUE KEY `uk_fechamentos_data` (`data_referencia`),
  KEY `idx_fechamentos_data` (`data_referencia`),
  KEY `idx_fechamentos_user_fechamento` (`id_user_fechamento`),
  KEY `fk_fechamentos_user_abertura` (`id_user_abertura`),
  CONSTRAINT `fk_fechamentos_user_abertura` FOREIGN KEY (`id_user_abertura`) REFERENCES `cadastro` (`id_cadastro`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_fechamentos_user_fechamento` FOREIGN KEY (`id_user_fechamento`) REFERENCES `cadastro` (`id_cadastro`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `fechamentos_diarios`;
CREATE TABLE `fechamentos_diarios` (
  `id_fechamento` int(11) NOT NULL AUTO_INCREMENT,
  `data_referencia` date NOT NULL,
  `troco_inicial` decimal(12,2) NOT NULL DEFAULT 0.00,
  `troco_proximo_dia` decimal(12,2) DEFAULT NULL,
  `dinheiro_esperado` decimal(12,2) DEFAULT NULL,
  `diferenca_caixa` decimal(12,2) DEFAULT NULL,
  `status` enum('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
  `data_fechamento` datetime DEFAULT NULL,
  `id_user_abertura` int(11) DEFAULT NULL,
  `id_user_fechamento` int(11) DEFAULT NULL,
  `data_origem_troco` date DEFAULT NULL,
  `total_vendas` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_dinheiro` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_credito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_debito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_pix` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_voucher` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_fiado` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_outros` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantidade_vendas` int(11) NOT NULL DEFAULT 0,
  `fechado_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id_fechamento`),
  UNIQUE KEY `uk_fechamento_data` (`data_referencia`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `fechamentos_diarios` (`id_fechamento`, `data_referencia`, `troco_inicial`, `troco_proximo_dia`, `dinheiro_esperado`, `diferenca_caixa`, `status`, `data_fechamento`, `id_user_abertura`, `id_user_fechamento`, `data_origem_troco`, `total_vendas`, `total_dinheiro`, `total_credito`, `total_debito`, `total_pix`, `total_voucher`, `total_fiado`, `total_outros`, `quantidade_vendas`, `fechado_em`) VALUES
(1, '2026-10-05 00:00:00.000', '0.00', '0.00', '0.00', '0.00', 'FECHADO', '2026-10-06 14:33:30.000', NULL, NULL, NULL, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 0, '2026-10-06 14:33:30.000');

DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) DEFAULT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `num_pedido` int(11) NOT NULL,
  `data` datetime DEFAULT current_timestamp(),
  `data_ag` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT '',
  `origem` varchar(30) NOT NULL DEFAULT '',
  `valor_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `qtd_total` int(11) DEFAULT NULL,
  `form_pag` varchar(50) DEFAULT NULL,
  `codigo_comanda` varchar(20) DEFAULT NULL,
  `id_conta_fiado` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  UNIQUE KEY `codigo_comanda` (`codigo_comanda`),
  KEY `Index 2` (`id_user`),
  KEY `Index 4` (`id_cliente`),
  KEY `idx_pedidos_id_conta_fiado` (`id_conta_fiado`),
  CONSTRAINT `FK_pedidos_clientes_fiado` FOREIGN KEY (`id_cliente`) REFERENCES `clientes_fiado` (`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedidos_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `pedidos_itens`;
CREATE TABLE `pedidos_itens` (
  `id_itens` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `qtd` int(11) NOT NULL,
  `preco_unitario` decimal(20,6) NOT NULL,
  PRIMARY KEY (`id_itens`),
  KEY `Index 2` (`id_pedido`),
  KEY `Index 3` (`id_produto`),
  CONSTRAINT `FK_pedidos_itens_pedidos` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedidos_itens_produtos` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `produtos`;
CREATE TABLE `produtos` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) NOT NULL,
  `codigo_barras` varchar(255) NOT NULL DEFAULT '',
  `nome` varchar(255) NOT NULL DEFAULT '',
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `valor_bruto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `porcentagem_lucro` decimal(5,2) NOT NULL DEFAULT 0.00,
  `qtd` int(11) NOT NULL,
  `img` varchar(255) NOT NULL DEFAULT '',
  `qtd_min` int(11) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `valor_bruto`, `porcentagem_lucro`, `qtd`, `img`, `qtd_min`, `ativo`) VALUES
(1, 1, '100', 'Café coado 50ml', '', '2.26', '1.74', '30.00', 2, 'cafe_50.jpg', 3, 1),
(2, 1, '101', 'Café coado 100ml', '', '3.50', '2.69', '30.00', 6, 'cafe_100.png', 1, 1),
(3, 1, '102', 'Pingado 150ml', '', '3.80', '2.92', '30.00', 3, 'cafe_pingado.png', 1, 1),
(4, 1, '103', 'Chocolate quente 200ml', '', '6.94', '5.34', '30.00', 0, 'cafe.png', 1, 1),
(5, 2, '104', 'Arroz, Strogonoff de frango P', 'Delicioso strogonoff preparado com pedaços selecionados de peito de frango, regado ao autêntico molho cremoso de creme de leite fresquinho, ketchup, mostarda e cogumelos fatiados. Acompanha arroz branco soltinho e batata palha super crocante.', '18.60', '14.31', '30.00', 2, 'arroz_strog.png', 1, 1),
(6, 2, '105', 'Arroz, Strogonoff de frango M', '', '19.50', '15.00', '30.00', 10, 'arroz_strog.jpg', 1, 1),
(7, 2, '106', 'Arroz, Strogonoff de frango G', '', '20.70', '15.92', '30.00', 3, 'arroz_strog.png', 1, 1),
(8, 2, '107', 'Arroz, lasanha bolonhesa P', '', '18.60', '14.31', '30.00', 4, 'arroz_lasan.png', 1, 1),
(9, 2, '108', 'Arroz, lasanha bolonhesa M', '', '19.50', '15.00', '30.00', 0, 'arroz_lasan.png', 1, 1),
(10, 2, '109', 'Arroz, lasanha bolonhesa G', '', '20.70', '15.92', '30.00', 0, 'arroz_lasan.png', 1, 1),
(11, 2, '110', 'Arroz, feijão, carne de panela P', '', '18.60', '14.31', '30.00', 0, 'arroz_carp.jpg', 1, 1),
(12, 2, '111', 'Arroz, feijão, carne de panela M', '', '19.50', '15.00', '30.00', 0, 'arroz_carp.jpg', 1, 1),
(13, 2, '112', 'Arroz, feijão, carne de panela G', '', '20.70', '15.92', '30.00', 0, 'arroz_carp.jpg', 1, 1),
(14, 2, '113', 'Macarrão bolonhesa P', '', '18.60', '14.31', '30.00', 0, 'macarr_bolon.jpg', 1, 1),
(15, 2, '114', 'Macarrão bolonhesa M', '', '19.50', '15.00', '30.00', 5, 'macarr_bolon.jpg', 1, 1),
(16, 2, '115', 'Macarrão bolonhesa G', '', '20.70', '15.92', '30.00', 0, 'macarr_bolon.jpg', 1, 1),
(17, 3, '116', 'Picolé de água', '', '3.06', '2.35', '30.00', 0, 'picole_agua.jpg', 1, 1),
(18, 3, '117', 'Picolé de leite', '', '4.20', '3.23', '30.00', 0, 'picole_leite.png', 1, 1),
(19, 3, '118', 'Picolé tipo skimo', '', '5.50', '4.23', '30.00', 3, 'picole_skimo.jpg', 1, 1),
(20, 3, '119', 'Picolé gianduia', '', '5.50', '4.23', '30.00', 0, 'img_ntf.png', 1, 1),
(21, 3, '120', 'Picolé Maxxi leite trufado', '', '9.00', '6.92', '30.00', 0, 'maxxi_black.png', 1, 1),
(22, 3, '121', 'Picolé Maxxi Black', '', '9.00', '6.92', '30.00', 0, 'maxxi_black.png', 1, 1),
(23, 3, '122', 'Picolé Maxxi White', '', '9.00', '6.92', '30.00', 0, 'maxxi_white.png', 1, 1),
(24, 3, '123', 'Copo Big bombom', '', '7.00', '5.38', '30.00', 0, 'big_bombom.png', 1, 1),
(25, 3, '124', 'Copo Big flocos', '', '7.00', '5.38', '30.00', 10, 'big_flocos.png', 1, 1),
(26, 3, '125', 'Copo Big napolitano', '', '7.00', '5.38', '30.00', 0, 'big_napolitano.png', 1, 1),
(27, 3, '126', 'Copo Big speciale', '', '7.00', '5.38', '30.00', 0, 'img_ntf.png', 1, 1),
(28, 3, '127', 'Mini bombom Maxxi açaí', '', '15.50', '11.92', '30.00', 0, 'bomb_acai.jpg', 1, 1),
(29, 3, '128', 'Mini bombom Maxxi skimo', '', '15.50', '11.92', '30.00', 0, 'bomb_skimo.png', 1, 1),
(30, 3, '129', 'Pote de açaí 240ml', '', '12.50', '9.62', '30.00', 0, 'acai_240.png', 1, 1),
(31, 3, '130', 'Sorvete misto', '', '2.00', '1.54', '30.00', 0, 'picole_misto.png', 1, 1),
(32, 4, '131', 'Esfirra de carne', '', '7.29', '5.61', '30.00', 0, 'esfirrac.png', 1, 1),
(33, 4, '132', 'Esfirra de frango catu', '', '7.29', '5.61', '30.00', 0, 'esfirraf.png', 1, 1),
(34, 4, '133', 'Enrolado de queijo', '', '7.29', '5.61', '30.00', 0, 'enroladinho.png', 0, 1),
(35, 4, '134', 'Enrolado de salsicha', '', '7.29', '5.61', '30.00', 0, 'enr_salsi.png', 1, 1),
(36, 4, '135', 'Hambúrguer com cheddar', '', '7.29', '5.61', '30.00', 3, 'hamburguer.png', 1, 1),
(37, 4, '136', 'Assado calabresa com queijo', '', '7.29', '5.61', '30.00', 10, 'torta.png', 1, 1),
(38, 4, '137', 'Torta frango catu tomate', '', '8.14', '6.26', '30.00', 0, 'tortaf.png', 1, 1),
(39, 4, '138', 'Torta presunto queijo catu', '', '8.14', '6.26', '30.00', 0, 'tortap.png', 1, 1),
(40, 4, '139', 'Coxinha de carne', '', '7.58', '5.83', '30.00', 0, 'coxinha.jpg', 1, 1),
(41, 4, '140', 'Coxinha de frango', '', '7.58', '5.83', '30.00', 0, 'coxinha.jpg', 1, 1),
(42, 4, '141', 'Coxinha de costela', '', '8.50', '6.54', '30.00', 10, 'coxinha.jpg', 1, 1),
(43, 5, '142', 'Pão com ovo', '', '5.62', '4.32', '30.00', 0, 'pao_ovo.jpg', 1, 1),
(44, 5, '143', 'Bauru', '', '10.66', '8.20', '30.00', 0, 'bauru.png', 1, 1),
(45, 5, '144', 'Americano', '', '18.42', '14.17', '30.00', 0, 'img_ntf.png', 1, 1),
(46, 5, '145', 'Omelete simples', '', '5.00', '3.85', '30.00', 0, 'omelete_sim.png', 1, 1),
(47, 5, '146', 'Omelete presunto e queijo', '', '7.50', '5.77', '30.00', 0, 'omelete_sim.png', 1, 1),
(48, 5, '147', 'Ovo mexido', '', '4.50', '3.46', '30.00', 0, 'ovo_mexido.png', 1, 1),
(49, 5, '148', 'Misto quente', '', '6.50', '5.00', '30.00', 0, 'misto_quente.png', 1, 1),
(50, 6, '149', 'Trento avelã', '', '4.11', '3.16', '30.00', 0, 'trento_avela.jpg', 1, 1),
(51, 6, '150', 'Trento chocolate', '', '4.11', '3.16', '30.00', 0, 'trento_choc.jpg', 1, 1),
(52, 6, '151', 'Stikadinho', '', '2.00', '1.54', '30.00', 0, 'stikadinho.jpg', 1, 1),
(53, 6, '152', 'Halls morango', '', '2.50', '1.92', '30.00', 0, 'halls_mor.png', 1, 1),
(54, 6, '153', 'Paçoca', '', '3.00', '2.31', '30.00', 0, 'pacoca.jpg', 1, 1),
(55, 7, '154', 'Trufa de brigadeiro', '', '6.00', '4.62', '30.00', 0, 'trufa.png', 1, 1),
(56, 7, '155', 'Trufa de beijinho', '', '6.00', '4.62', '30.00', 0, 'trufa.png', 1, 1),
(57, 7, '156', 'Trufa de ninho', '', '6.00', '4.62', '30.00', 0, 'trufa.png', 1, 1),
(58, 7, '157', 'Trufa Ovomaltine', '', '6.50', '5.00', '30.00', 10, 'trufa.png', 1, 1),
(59, 7, '158', 'Trufa Nutella', '', '6.50', '5.00', '30.00', 0, 'trufa.png', 1, 1),
(60, 7, '159', 'Trufa Maracujá', '', '6.50', '5.00', '30.00', 0, 'trufa.png', 1, 1),
(61, 7, '160', 'Trufa Oreo', '', '6.50', '5.00', '30.00', 0, 'trufa.png', 1, 1),
(62, 7, '161', 'Bala baiana', '', '6.00', '4.62', '30.00', 0, 'bala_baiana.png', 1, 1),
(63, 8, '162', 'Mini Coca-Cola', '', '3.00', '2.31', '30.00', 10, 'coca_200.png', 1, 1),
(64, 8, '163', 'Mini Fanta', '', '3.00', '2.31', '30.00', 0, 'fanta_200.png', 1, 1),
(65, 8, '164', 'Água', '', '2.69', '2.07', '30.00', 0, 'agua.jpg', 1, 1),
(66, 8, '165', 'Água com gás', '', '2.70', '2.08', '30.00', 0, 'agua_gas.jpg', 1, 1),
(67, 8, '166', 'Coca-Cola 2L', '', '11.97', '9.21', '30.00', 0, 'coca_2l.png', 1, 1),
(68, 8, '167', 'Fanta 2L', '', '11.50', '8.85', '30.00', 0, 'fanta_2l.png', 1, 1),
(70, 6, '168', 'Brownie', '', '6.50', '5.00', '30.00', 0, 'brownie.png', 0, 1),
(71, 7, '169', 'Trufa de KitKat', '', '6.50', '5.00', '30.00', 0, '1778613120966.png', NULL, 1),
(72, 5, '170', 'batatinha', 'uma linda batatinha que se esparralhou pelo chão', '6.00', '3.00', '100.00', 7, 'img_ntf.png', 5, 1);

DROP TABLE IF EXISTS `reposicao`;
CREATE TABLE `reposicao` (
  `id_compra` int(11) NOT NULL AUTO_INCREMENT,
  `id_produto` int(11) NOT NULL,
  `produto` varchar(255) NOT NULL DEFAULT '',
  `qtd_prevista` int(11) NOT NULL,
  `qtd_comprada` int(11) DEFAULT NULL,
  `prioridade` varchar(50) NOT NULL DEFAULT '',
  `local` varchar(50) NOT NULL DEFAULT '',
  `status` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_compra`),
  KEY `Index 2` (`id_produto`),
  CONSTRAINT `FK__produtos` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL DEFAULT '',
  `cpf` varchar(14) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '0',
  `senha` varchar(255) NOT NULL DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `users` (`id_user`, `nome`, `cpf`, `email`, `senha`, `data_criacao`) VALUES
(1, 'Consumidor Final', '00000000000', 'granovita@gmail.com', 'granovita', '2026-04-30 13:29:04.000'),
(2, 'Ana Clara', '50572398808', 'clarinhakassao@gmail.com', 'anabanana', '2026-04-30 13:27:58.000');

SET UNIQUE_CHECKS = 1;
SET FOREIGN_KEY_CHECKS = 1;
