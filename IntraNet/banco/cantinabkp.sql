-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para cantina
DROP DATABASE IF EXISTS `cantina`;
CREATE DATABASE IF NOT EXISTS `cantina` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin */;
USE `cantina`;

-- Copiando estrutura para tabela cantina.cadastro
DROP TABLE IF EXISTS `cadastro`;
CREATE TABLE IF NOT EXISTS `cadastro` (
  `id_cadastro` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `senha` varchar(255) NOT NULL DEFAULT '',
  `img` varchar(255) NOT NULL,
  PRIMARY KEY (`id_cadastro`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~3 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `nome`, `email`, `senha`, `img`) VALUES
	(1, 'Ana Banana', 'anabanana@gmail.com', 'b2e7e03ede85560977685add00fa3276ea7aa1c780fc87b870d7b027dc277007', '/imagens/1777572726880.jpg'),
	(2, 'Kemilly', 'kemillyregina@gmail.com', '5b41d889f9fa1c2d51448a8e009e16b7189030ce6cb637fba913ae33b231f702', '/imagens/1778585396841.jpg'),
	(4, 'Teste', 't@t.com', 'a2ca37fe6fdc490b8f7ce841e1701a169d2b1697c6b5b5c63f94abb8f9b6d6dd', '/imagens/def_avt.jpg');

-- Copiando estrutura para tabela cantina.categorias
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE IF NOT EXISTS `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id_categoria`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.categorias: ~8 rows (aproximadamente)
DELETE FROM `categorias`;
INSERT INTO `categorias` (`id_categoria`, `nome`) VALUES
	(1, 'Bebidas Quentes'),
	(2, 'Marmitas'),
	(3, 'Picolés e Sorvetes'),
	(4, 'Salgados'),
	(5, 'Lanches'),
	(6, 'Guloseimas'),
	(7, 'Trufas'),
	(8, 'Bebidas');

-- Copiando estrutura para tabela cantina.clientes_fiado
DROP TABLE IF EXISTS `clientes_fiado`;
CREATE TABLE IF NOT EXISTS `clientes_fiado` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.clientes_fiado: ~4 rows (aproximadamente)
DELETE FROM `clientes_fiado`;
INSERT INTO `clientes_fiado` (`id_cliente`, `nome_completo`, `cpf`, `telefone`, `endereco`, `created_at`) VALUES
	(1, 'Ana Clara', '21345678901', '18 98812-8490', 'afnsafb snfbfbanf', '2026-05-14 16:35:37'),
	(4, 'ana Banana', '213456789056', '18 98812-8490', 'afnsafb snfbfbanf', '2026-05-14 16:36:23'),
	(5, 'Kemilly Regina', '21345678930209', '18 98812-8490', 'adgjkd jd', '2026-05-14 17:03:54'),
	(6, 'Kemilly Reginer', '213456789654', '5518930853494', 'ku7 opkl', '2026-05-14 18:40:27');

-- Copiando estrutura para tabela cantina.contas_fiado
DROP TABLE IF EXISTS `contas_fiado`;
CREATE TABLE IF NOT EXISTS `contas_fiado` (
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
  PRIMARY KEY (`id_conta`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `contas_fiado_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes_fiado` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.contas_fiado: ~3 rows (aproximadamente)
DELETE FROM `contas_fiado`;
INSERT INTO `contas_fiado` (`id_conta`, `id_cliente`, `valor_original`, `valor_final`, `juros_aplicado`, `data_criacao`, `data_vencimento`, `data_pagamento`, `status`, `origem`) VALUES
	(9, 1, 103.50, 103.50, 0, '2026-05-14 16:56:18', '2026-05-30', '2026-05-23 00:00:00', 'Pendente', ''),
	(13, 1, 9.56, 9.56, 0, '2026-05-19 08:38:50', '2026-05-28', '2026-05-29 00:00:00', 'Pago', NULL),
	(14, 1, 3.80, 3.80, 0, '2026-05-19 08:49:53', '2026-06-04', NULL, 'Pendente', 'loja');

-- Copiando estrutura para tabela cantina.conta_fiado_prod
DROP TABLE IF EXISTS `conta_fiado_prod`;
CREATE TABLE IF NOT EXISTS `conta_fiado_prod` (
  `id_contprod` int(11) NOT NULL AUTO_INCREMENT,
  `id_conta` int(11) NOT NULL,
  `id_produto` int(11) DEFAULT NULL,
  `qtd` int(11) DEFAULT NULL,
  `valor_unit` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_contprod`),
  KEY `Index 2` (`id_produto`),
  KEY `Index 3` (`id_conta`),
  CONSTRAINT `FK__produtos_fiado` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_conta_fiado_prod_contas_fiado` FOREIGN KEY (`id_conta`) REFERENCES `contas_fiado` (`id_conta`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.conta_fiado_prod: ~5 rows (aproximadamente)
DELETE FROM `conta_fiado_prod`;
INSERT INTO `conta_fiado_prod` (`id_contprod`, `id_conta`, `id_produto`, `qtd`, `valor_unit`) VALUES
	(13, 9, 10, 5, 21.00),
	(14, 13, 3, 1, 4.00),
	(15, 13, 2, 1, 4.00),
	(16, 13, 1, 1, 2.00),
	(17, 14, 3, 1, 3.80);

-- Copiando estrutura para tabela cantina.pedidos
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `num_pedido` int(11) NOT NULL,
  `data` datetime DEFAULT current_timestamp(),
  `data_ag` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT '',
  `origem` varchar(30) NOT NULL DEFAULT '',
  `valor_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `qtd_total` int(11) DEFAULT NULL,
  `form_pag` varchar(50) DEFAULT NULL,
  `codigo_comanda` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  UNIQUE KEY `codigo_comanda` (`codigo_comanda`),
  KEY `Index 2` (`id_user`),
  CONSTRAINT `FK_pedidos_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos: ~35 rows (aproximadamente)
DELETE FROM `pedidos`;
INSERT INTO `pedidos` (`id_pedido`, `id_user`, `num_pedido`, `data`, `data_ag`, `status`, `origem`, `valor_total`, `qtd_total`, `form_pag`, `codigo_comanda`) VALUES
	(7, 2, 1, '2026-04-16 17:08:06', '0000-00-00 00:00:00', 'Finalizado', 'PDV', 10.00, 1, 'DINHEIRO (F2)', NULL),
	(8, 2, 2, '2026-04-16 17:08:19', '0000-00-00 00:00:00', 'Finalizado', '', 2.00, 2, 'CARTÃO DE CRÉDITO (F3)', NULL),
	(9, 2, 3, '2026-04-16 17:09:23', '2026-05-08 11:40:00', 'Finalizado', 'Agendamento', 30.00, 2, 'DINHEIRO (F2)', NULL),
	(10, 2, 4, '2026-04-16 17:10:44', '0000-00-00 00:00:00', 'Finalizado', '', 21.76, 3, 'DINHEIRO (F2)', NULL),
	(13, 1, 7, '2026-04-30 13:37:22', '0000-00-00 00:00:00', 'Finalizado', 'Fiado', 8.02, 3, 'PIX (F6)', NULL),
	(15, 1, 8, '2026-04-30 13:49:05', '2026-06-17 09:30:00', 'Agendado', '', 2.26, 1, 'PIX (F6)', NULL),
	(16, 1, 9, '2026-04-30 14:05:23', '0000-00-00 00:00:00', 'Finalizado', '', 2.26, 1, 'PIX (F6)', NULL),
	(17, 1, 10, '2026-04-30 14:27:16', '2026-05-08 12:00:00', 'Agendado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(18, 1, 11, '2026-05-05 16:46:52', '0000-00-00 00:00:00', 'Finalizado', '', 13.05, 3, 'CARTÃO DE CRÉDITO (F3)', NULL),
	(19, 1, 12, '2026-05-05 16:48:57', '0000-00-00 00:00:00', 'Finalizado', '', 10.79, 2, 'PIX (F6)', NULL),
	(20, 1, 13, '2026-05-07 10:41:49', NULL, 'Finalizado', '', 7.00, 2, 'DINHEIRO (F2)', NULL),
	(21, 1, 14, '2026-05-07 10:42:09', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(22, 1, 15, '2026-05-07 10:44:48', NULL, 'Finalizado', '', 7.00, 2, 'PIX (F6)', NULL),
	(23, 1, 16, '2026-05-07 13:27:49', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(24, 1, 17, '2026-05-07 13:27:51', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(25, 1, 18, '2026-05-07 13:30:26', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(26, 1, 19, '2026-05-07 13:32:37', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(27, 1, 20, '2026-05-07 13:37:16', NULL, 'Finalizado', '', 3.50, 1, 'DINHEIRO (F2)', NULL),
	(28, 1, 21, '2026-05-12 11:07:03', NULL, 'Finalizado', '', 3.50, 1, 'CARTÃO DE DÉBITO (F4)', NULL),
	(29, 1, 22, '2026-05-12 11:10:35', NULL, 'Finalizado', 'PDV', 39.30, 2, 'DINHEIRO (F2)', NULL),
	(31, 1, 0, '2026-05-26 13:49:26', NULL, 'pendente', 'APP', 40.70, 3, NULL, 'CMD2894'),
	(32, 1, 0, '2026-05-26 13:49:47', NULL, 'pendente', 'APP', 7.76, 2, NULL, 'CMD5560'),
	(33, 1, 0, '2026-05-26 13:51:31', NULL, 'pendente', 'APP', 9.04, 4, NULL, 'CMD1783'),
	(34, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD4790'),
	(35, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD1212'),
	(36, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD8765'),
	(37, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD9183'),
	(38, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD8282'),
	(39, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD8250'),
	(40, 1, 0, '2026-05-26 14:00:10', NULL, 'pendente', 'APP', 39.30, 2, NULL, 'CMD4232'),
	(41, 1, 0, '2026-05-26 14:02:21', NULL, 'pendente', 'APP', 20.86, 2, NULL, 'CMD3037'),
	(42, 1, 0, '2026-05-26 14:04:57', NULL, 'pendente', 'APP', 20.70, 1, NULL, 'CMD3284'),
	(43, 1, 0, '2026-05-26 14:11:46', NULL, 'pendente', 'APP', 20.70, 1, NULL, 'CMD3997'),
	(44, 4, 0, '2026-05-26 15:54:01', NULL, 'pendente', 'APP', 18.60, 1, NULL, 'CMD3062'),
	(45, 4, 0, '2026-05-26 15:55:36', NULL, 'pendente', 'APP', 20.70, 1, NULL, 'CMD7401');

-- Copiando estrutura para tabela cantina.pedidos_itens
DROP TABLE IF EXISTS `pedidos_itens`;
CREATE TABLE IF NOT EXISTS `pedidos_itens` (
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
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos_itens: ~47 rows (aproximadamente)
DELETE FROM `pedidos_itens`;
INSERT INTO `pedidos_itens` (`id_itens`, `id_pedido`, `id_produto`, `qtd`, `preco_unitario`) VALUES
	(12, 7, 1, 1, 2.260000),
	(13, 8, 14, 1, 18.600000),
	(14, 8, 1, 1, 2.260000),
	(15, 9, 14, 1, 18.600000),
	(16, 9, 1, 1, 2.260000),
	(17, 10, 6, 1, 19.500000),
	(18, 10, 1, 1, 2.260000),
	(19, 13, 1, 2, 2.260000),
	(20, 13, 2, 1, 3.500000),
	(21, 15, 1, 1, 2.260000),
	(22, 16, 1, 1, 2.260000),
	(23, 17, 2, 1, 3.500000),
	(24, 18, 1, 1, 2.260000),
	(25, 18, 32, 1, 7.290000),
	(26, 18, 2, 1, 3.500000),
	(27, 19, 2, 1, 3.500000),
	(28, 19, 32, 1, 7.290000),
	(29, 20, 2, 2, 3.500000),
	(30, 21, 2, 1, 3.500000),
	(31, 22, 2, 2, 3.500000),
	(32, 23, 2, 1, 3.500000),
	(33, 24, 2, 1, 3.500000),
	(34, 25, 2, 1, 3.500000),
	(35, 26, 2, 1, 3.500000),
	(36, 27, 2, 1, 3.500000),
	(37, 28, 2, 1, 3.500000),
	(38, 29, 7, 1, 20.700000),
	(39, 29, 5, 1, 18.600000),
	(40, 31, 2, 1, 3.500000),
	(41, 31, 5, 2, 18.600000),
	(42, 32, 1, 1, 2.260000),
	(43, 32, 19, 1, 5.500000),
	(44, 33, 1, 4, 2.260000),
	(45, 34, 5, 1, 18.600000),
	(46, 34, 7, 1, 20.700000),
	(47, 35, 5, 1, 18.600000),
	(48, 35, 7, 1, 20.700000),
	(49, 36, 5, 1, 18.600000),
	(50, 37, 5, 1, 18.600000),
	(51, 38, 5, 1, 18.600000),
	(52, 36, 7, 1, 20.700000),
	(53, 37, 7, 1, 20.700000),
	(54, 38, 7, 1, 20.700000),
	(55, 39, 5, 1, 18.600000),
	(56, 39, 7, 1, 20.700000),
	(57, 40, 5, 1, 18.600000),
	(58, 40, 7, 1, 20.700000),
	(59, 41, 5, 1, 18.600000),
	(60, 41, 1, 1, 2.260000),
	(61, 42, 7, 1, 20.700000),
	(62, 43, 7, 1, 20.700000),
	(63, 44, 5, 1, 18.600000),
	(64, 45, 7, 1, 20.700000);

-- Copiando estrutura para tabela cantina.produtos
DROP TABLE IF EXISTS `produtos`;
CREATE TABLE IF NOT EXISTS `produtos` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) NOT NULL,
  `codigo_barras` varchar(255) NOT NULL DEFAULT '',
  `nome` varchar(255) NOT NULL DEFAULT '',
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `qtd` int(11) NOT NULL,
  `img` varchar(255) NOT NULL DEFAULT '',
  `qtd_min` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~70 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `qtd`, `img`, `qtd_min`) VALUES
	(1, 1, '100', 'Café coado 50ml', '', 2.26, 4, 'cafe_50.jpg', 3),
	(2, 1, '4006381492355', 'Café coado 100ml', '', 3.50, 8, 'cafe_100.png', 1),
	(3, 1, '102', 'Pingado 150ml', '', 3.80, 8, 'cafe_pingado.png', 1),
	(4, 1, '103', 'Chocolate quente 200ml', '', 6.94, 15, 'cafe.png', 1),
	(5, 2, '104', 'Arroz, Strogonoff de frango P', 'Delicioso strogonoff preparado com pedaços selecionados de peito de frango, regado ao autêntico molho cremoso de creme de leite fresquinho, ketchup, mostarda e cogumelos fatiados. Acompanha arroz branco soltinho e batata palha super crocante.', 18.60, 20, 'arroz_strog.png', 1),
	(6, 2, '105', 'Arroz, Strogonoff de frango M', '', 19.50, 0, 'arroz_strog.jpg', 1),
	(7, 2, '106', 'Arroz, Strogonoff de frango G', '', 20.70, 2, 'arroz_strog.png', 1),
	(8, 2, '107', 'Arroz, lasanha bolonhesa P', '', 18.60, 25, 'arroz_lasan.png', 1),
	(9, 2, '108', 'Arroz, lasanha bolonhesa M', '', 19.50, 0, 'arroz_lasan.png', 1),
	(10, 2, '109', 'Arroz, lasanha bolonhesa G', '', 20.70, -5, 'arroz_lasan.png', 1),
	(11, 2, '110', 'Arroz, feijão, carne de panela P', '', 18.60, 0, 'arroz_carp.jpg', 1),
	(12, 2, '111', 'Arroz, feijão, carne de panela M', '', 19.50, 0, 'arroz_carp.jpg', 1),
	(13, 2, '112', 'Arroz, feijão, carne de panela G', '', 20.70, 0, 'arroz_carp.jpg', 1),
	(14, 2, '113', 'Macarrão bolonhesa P', '', 18.60, -1, 'macarr_bolon.jpg', 1),
	(15, 2, '114', 'Macarrão bolonhesa M', '', 19.50, 0, 'macarr_bolon.jpg', 1),
	(16, 2, '115', 'Macarrão bolonhesa G', '', 20.70, 0, 'macarr_bolon.jpg', 1),
	(17, 3, '116', 'Picolé de água', '', 3.06, 0, 'picole_agua.jpg', 1),
	(18, 3, '117', 'Picolé de leite', '', 4.20, 0, 'picole_leite.png', 1),
	(19, 3, '7898119104794', 'Picolé tipo skimo', '', 5.50, 5, 'picole_skimo.jpg', 1),
	(20, 3, '119', 'Picolé gianduia', '', 5.50, 0, 'img_ntf.png', 1),
	(21, 3, '120', 'Picolé Maxxi leite trufado', '', 9.00, 0, 'maxxi_black.png', 1),
	(22, 3, '6972689546657', 'Picolé Maxxi Black', '', 9.00, 82, 'maxxi_black.png', 1),
	(23, 3, '122', 'Picolé Maxxi White', '', 9.00, 0, 'maxxi_white.png', 1),
	(24, 3, '123', 'Copo Big bombom', '', 7.00, 0, 'big_bombom.png', 1),
	(25, 3, '124', 'Copo Big flocos', '', 7.00, 0, 'big_flocos.png', 1),
	(26, 3, '125', 'Copo Big napolitano', '', 7.00, 0, 'big_napolitano.png', 1),
	(27, 3, '126', 'Copo Big speciale', '', 7.00, 0, 'img_ntf.png', 1),
	(28, 3, '127', 'Mini bombom Maxxi açaí', '', 15.50, 0, 'bomb_acai.jpg', 1),
	(29, 3, '128', 'Mini bombom Maxxi skimo', '', 15.50, 0, 'bomb_skimo.png', 1),
	(30, 3, '129', 'Pote de açaí 240ml', '', 12.50, 0, 'acai_240.png', 1),
	(31, 3, '130', 'Sorvete misto', '', 2.00, 0, 'picole_misto.png', 1),
	(32, 4, '6956825938261', 'Esfirra de carne', '', 7.29, 9, 'esfirra.png', 1),
	(33, 4, '132', 'Esfirra de frango catu', '', 7.29, 0, 'esfirra.png', 1),
	(34, 4, '133', 'Enrolado de queijo', '', 7.29, 0, 'enroladinho.jpg', 1),
	(35, 4, '134', 'Enrolado de salsicha', '', 7.29, 0, 'enr_salsi.png', 1),
	(36, 4, '135', 'Hambúrguer com cheddar', '', 7.29, 0, 'bauru.png', 1),
	(37, 4, '136', 'Assado calabresa com queijo', '', 7.29, 0, 'torta.png', 1),
	(38, 4, '137', 'Torta frango catu tomate', '', 8.14, 0, 'torta.png', 1),
	(39, 4, '138', 'Torta presunto queijo catu', '', 8.14, 0, 'torta.png', 1),
	(40, 4, '139', 'Coxinha de carne', '', 7.58, 0, 'coxinha.jpg', 1),
	(41, 4, '140', 'Coxinha de frango', '', 7.58, 0, 'coxinha.jpg', 1),
	(42, 4, '141', 'Coxinha de costela', '', 8.50, 0, 'coxinha.jpg', 1),
	(43, 5, '142', 'Pão com ovo', '', 5.62, 0, 'pao_ovo.jpg', 1),
	(44, 5, '7891962036984', 'Bauru', '', 10.66, 10, 'bauru.png', 1),
	(45, 5, '144', 'Americano', '', 18.42, 0, 'img_ntf.png', 1),
	(46, 5, '145', 'Omelete simples', '', 5.00, 0, 'omelete_sim.png', 1),
	(47, 5, '146', 'Omelete presunto e queijo', '', 7.50, 0, 'omelete_sim.png', 1),
	(48, 5, '147', 'Ovo mexido', '', 4.50, 0, 'ovo_mexido.png', 1),
	(49, 5, '148', 'Misto quente', '', 6.50, 0, 'misto_quente.png', 1),
	(50, 6, '149', 'Trento avelã', '', 4.11, 0, 'trento_avela.jpg', 1),
	(51, 6, '150', 'Trento chocolate', '', 4.11, 0, 'trento_choc.jpg', 1),
	(52, 6, '151', 'Stikadinho', '', 2.00, 0, 'stikadinho.jpg', 1),
	(53, 6, '152', 'Halls morango', '', 2.50, 0, 'halls_mor.png', 1),
	(54, 6, '153', 'Paçoca', '', 3.00, 0, 'pacoca.jpg', 1),
	(55, 7, '154', 'Trufa de brigadeiro', '', 6.00, 0, 'trufa.png', 1),
	(56, 7, '155', 'Trufa de beijinho', '', 6.00, 0, 'trufa.png', 1),
	(57, 7, '156', 'Trufa de ninho', '', 6.00, 0, 'trufa.png', 1),
	(58, 7, '157', 'Trufa Ovomaltine', '', 6.50, 0, 'trufa.png', 1),
	(59, 7, '158', 'Trufa Nutella', '', 6.50, 0, 'trufa.png', 1),
	(60, 7, '159', 'Trufa Maracujá', '', 6.50, 0, 'trufa.png', 1),
	(61, 7, '160', 'Trufa Oreo', '', 6.50, 0, 'trufa.png', 1),
	(62, 7, '161', 'Bala baiana', '', 6.00, 0, 'bala_baiana.png', 1),
	(63, 8, '162', 'Mini Coca-Cola', '', 3.00, 0, 'coca_200.png', 1),
	(64, 8, '163', 'Mini Fanta', '', 3.00, 0, 'fanta_200.png', 1),
	(65, 8, '164', 'Água', '', 2.69, 0, 'agua.jpg', 1),
	(66, 8, '165', 'Água com gás', '', 2.70, 0, 'agua_gas.jpg', 1),
	(67, 8, '166', 'Coca-Cola 2L', '', 11.97, 0, 'coca_2l.png', 1),
	(68, 8, '167', 'Fanta 2L', '', 11.50, 0, 'fanta_2l.png', 1),
	(70, 6, '168', 'Brownie', '', 6.50, 10, 'brownie.png', NULL),
	(71, 7, '169', 'Trufa de KitKat', '', 6.50, 1, '1778613120966.png', NULL);

-- Copiando estrutura para tabela cantina.reposicao
DROP TABLE IF EXISTS `reposicao`;
CREATE TABLE IF NOT EXISTS `reposicao` (
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.reposicao: ~5 rows (aproximadamente)
DELETE FROM `reposicao`;
INSERT INTO `reposicao` (`id_compra`, `id_produto`, `produto`, `qtd_prevista`, `qtd_comprada`, `prioridade`, `local`, `status`) VALUES
	(1, 22, 'Picolé Maxxi Black', 36, 36, 'Alta', 'l', 'Concluído'),
	(2, 8, 'Arroz, lasanha bolonhesa P', 25, 25, 'Alta', '9', 'Concluído'),
	(3, 32, 'Esfirra de carne', 2, 2, 'Baixa', 'p', 'Concluído'),
	(4, 3, 'Pingado 150ml', 6, 0, 'Média', 't', 'Pendente'),
	(5, 7, 'Arroz, Strogonoff de frango G', 5, 0, 'Média', 'Fornecedor Padrão', 'Pendente'),
	(6, 1, 'Café coado 50ml', 10, 0, 'Baixa', 'a', 'Pendente');

-- Copiando estrutura para tabela cantina.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL DEFAULT '',
  `cpf` varchar(14) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '0',
  `senha` varchar(255) NOT NULL DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.users: ~2 rows (aproximadamente)
DELETE FROM `users`;
INSERT INTO `users` (`id_user`, `nome`, `cpf`, `email`, `senha`, `data_criacao`) VALUES
	(1, 'Consumidor Final', '00000000000', 'granovita@gmail.com', 'granovita', '2026-04-30 16:29:04'),
	(2, 'Ana Clara', '50572398808', 'clarinhakassao@gmail.com', 'anabanana', '2026-04-30 16:27:58'),
	(4, 'Ana Banana', '50572398808', 'anabanana@gmail.com', '$2b$10$1tzot9yWfx.U4zWWrLlMhOfhPxSWf2LgA.aNfOheU0ZU5K.lFPcPm', '2026-05-12 16:15:08');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
