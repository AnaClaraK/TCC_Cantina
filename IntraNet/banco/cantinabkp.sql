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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~1 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `nome`, `email`, `senha`, `img`) VALUES
	(1, 'Ana Banana', 'anabanana@gmail.com', 'b2e7e03ede85560977685add00fa3276ea7aa1c780fc87b870d7b027dc277007', '/imagens/1777572726880.jpg');

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
	(4, 'Assados'),
	(5, 'Lanches'),
	(6, 'Guloseimas'),
	(7, 'Trufas'),
	(8, 'Bebidas');

-- Copiando estrutura para tabela cantina.disponibilidade
DROP TABLE IF EXISTS `disponibilidade`;
CREATE TABLE IF NOT EXISTS `disponibilidade` (
  `id_disponib` int(11) NOT NULL AUTO_INCREMENT,
  `id_produto` int(11) NOT NULL,
  `data` date NOT NULL,
  `qtd_limite` int(11) NOT NULL,
  `qtd_reservada` int(11) NOT NULL,
  PRIMARY KEY (`id_disponib`),
  KEY `Index 2` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.disponibilidade: ~0 rows (aproximadamente)
DELETE FROM `disponibilidade`;

-- Copiando estrutura para tabela cantina.pedidos
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `num_pedido` int(11) NOT NULL,
  `data` datetime DEFAULT current_timestamp(),
  `data_ag` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT '',
  `valor_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `qtd_total` int(11) DEFAULT NULL,
  `form_pag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `Index 2` (`id_user`),
  CONSTRAINT `FK_pedidos_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos: ~18 rows (aproximadamente)
DELETE FROM `pedidos`;
INSERT INTO `pedidos` (`id_pedido`, `id_user`, `num_pedido`, `data`, `data_ag`, `status`, `valor_total`, `qtd_total`, `form_pag`) VALUES
	(7, 2, 1, '2026-04-16 17:08:06', '0000-00-00 00:00:00', 'Finalizado', 10.00, 1, 'DINHEIRO (F2)'),
	(8, 2, 2, '2026-04-16 17:08:19', '0000-00-00 00:00:00', 'Finalizado', 2.00, 2, 'CARTÃO DE CRÉDITO (F3)'),
	(9, 2, 3, '2026-04-16 17:09:23', '2026-05-08 11:40:00', 'Agendado', 30.00, 2, 'DINHEIRO (F2)'),
	(10, 2, 4, '2026-04-16 17:10:44', '0000-00-00 00:00:00', 'Finalizado', 21.76, 3, 'DINHEIRO (F2)'),
	(13, 1, 7, '2026-04-30 13:37:22', '0000-00-00 00:00:00', 'Finalizado', 8.02, 3, 'PIX (F6)'),
	(15, 1, 8, '2026-04-30 13:49:05', '2026-06-17 09:30:00', 'Agendado', 2.26, 1, 'PIX (F6)'),
	(16, 1, 9, '2026-04-30 14:05:23', '0000-00-00 00:00:00', 'Finalizado', 2.26, 1, 'PIX (F6)'),
	(17, 1, 10, '2026-04-30 14:27:16', '2026-05-08 12:00:00', 'Agendado', 3.50, 1, 'DINHEIRO (F2)'),
	(18, 1, 11, '2026-05-05 16:46:52', '0000-00-00 00:00:00', 'Finalizado', 13.05, 3, 'CARTÃO DE CRÉDITO (F3)'),
	(19, 1, 12, '2026-05-05 16:48:57', '0000-00-00 00:00:00', 'Finalizado', 10.79, 2, 'PIX (F6)'),
	(20, 1, 13, '2026-05-07 10:41:49', NULL, 'Finalizado', 7.00, 2, 'DINHEIRO (F2)'),
	(21, 1, 14, '2026-05-07 10:42:09', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)'),
	(22, 1, 15, '2026-05-07 10:44:48', NULL, 'Finalizado', 7.00, 2, 'PIX (F6)'),
	(23, 1, 16, '2026-05-07 13:27:49', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)'),
	(24, 1, 17, '2026-05-07 13:27:51', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)'),
	(25, 1, 18, '2026-05-07 13:30:26', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)'),
	(26, 1, 19, '2026-05-07 13:32:37', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)'),
	(27, 1, 20, '2026-05-07 13:37:16', NULL, 'Finalizado', 3.50, 1, 'DINHEIRO (F2)');

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
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos_itens: ~25 rows (aproximadamente)
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
	(36, 27, 2, 1, 3.500000);

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
  `disponivel` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~68 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `qtd`, `img`, `disponivel`) VALUES
	(1, 1, '100', 'Café coado 50ml', '', 2.26, 5, 'cafe_50.jpg', 1),
	(2, 1, '4006381492355', 'Café coado 100ml', '', 3.50, 9, 'cafe_100.png', 1),
	(3, 1, '102', 'Pingado 150ml', '', 3.80, 10, 'cafe_pingado.png', 1),
	(4, 1, '103', 'Chocolate quente 200ml', '', 6.94, 10, 'cafe.png', 1),
	(5, 2, '104', 'Arroz, Strogonoff de frango P', '', 18.60, 10, 'arroz_strog.png', 1),
	(6, 2, '105', 'Arroz, Strogonoff de frango M', '', 19.50, 0, 'arroz_strog.jpg', 1),
	(7, 2, '106', 'Arroz, Strogonoff de frango G', '', 20.70, 0, 'arroz_strog.png', 1),
	(8, 2, '107', 'Arroz, lasanha bolonhesa P', '', 18.60, 0, 'arroz_lasan.png', 1),
	(9, 2, '108', 'Arroz, lasanha bolonhesa M', '', 19.50, 0, 'arroz_lasan.png', 1),
	(10, 2, '109', 'Arroz, lasanha bolonhesa G', '', 20.70, 0, 'arroz_lasan.png', 1),
	(11, 2, '110', 'Arroz, feijão, carne de panela P', '', 18.60, 0, 'arroz_carp.jpg', 1),
	(12, 2, '111', 'Arroz, feijão, carne de panela M', '', 19.50, 0, 'arroz_carp.jpg', 1),
	(13, 2, '112', 'Arroz, feijão, carne de panela G', '', 20.70, 0, 'arroz_carp.jpg', 1),
	(14, 2, '113', 'Macarrão bolonhesa P', '', 18.60, 0, 'macarr_bolon.jpg', 1),
	(15, 2, '114', 'Macarrão bolonhesa M', '', 19.50, 0, 'macarr_bolon.jpg', 1),
	(16, 2, '115', 'Macarrão bolonhesa G', '', 20.70, 0, 'macarr_bolon.jpg', 1),
	(17, 3, '116', 'Picolé de água', '', 3.06, 0, 'picole_agua.jpg', 1),
	(18, 3, '117', 'Picolé de leite', '', 4.20, 0, 'picole_leite.png', 1),
	(19, 3, '7898119104794', 'Picolé tipo skimo', '', 5.50, 5, 'picole_skimo.jpg', 1),
	(20, 3, '119', 'Picolé gianduia', '', 5.50, 0, 'img_ntf.png', 1),
	(21, 3, '120', 'Picolé Maxxi leite trufado', '', 9.00, 0, 'maxxi_black.png', 1),
	(22, 3, '6972689546657', 'Picolé Maxxi Black', '', 9.00, 10, 'maxxi_black.png', 1),
	(23, 3, '122', 'Picolé Maxxi White', '', 9.00, 0, 'maxxi_white.png', 1),
	(24, 3, '123', 'Copo Big bombom', '', 7.00, 0, 'big_bombom.png', 1),
	(25, 3, '124', 'Copo Big flocos', '', 7.00, 0, 'big_flocos.png', 1),
	(26, 3, '125', 'Copo Big napolitano', '', 7.00, 0, 'big_napolitano.png', 1),
	(27, 3, '126', 'Copo Big speciale', '', 7.00, 0, 'img_ntf.png', 1),
	(28, 3, '127', 'Mini bombom Maxxi açaí', '', 15.50, 0, 'bomb_acai.jpg', 1),
	(29, 3, '128', 'Mini bombom Maxxi skimo', '', 15.50, 0, 'bomb_skimo.png', 1),
	(30, 3, '129', 'Pote de açaí 240ml', '', 12.50, 0, 'acai_240.png', 1),
	(31, 3, '130', 'Sorvete misto', '', 2.00, 0, 'picole_misto.png', 1),
	(32, 4, '6956825938261', 'Esfirra de carne', '', 7.29, 5, 'esfirra.png', 1),
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
	(68, 8, '167', 'Fanta 2L', '', 11.50, 0, 'fanta_2l.png', 1);

-- Copiando estrutura para tabela cantina.reposicao
DROP TABLE IF EXISTS `reposicao`;
CREATE TABLE IF NOT EXISTS `reposicao` (
  `id_compra` int(11) NOT NULL,
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

-- Copiando dados para a tabela cantina.reposicao: ~0 rows (aproximadamente)
DELETE FROM `reposicao`;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.users: ~2 rows (aproximadamente)
DELETE FROM `users`;
INSERT INTO `users` (`id_user`, `nome`, `cpf`, `email`, `senha`, `data_criacao`) VALUES
	(1, 'Consumidor Final', '00000000000', 'granovita@gmail.com', 'granovita', '2026-04-30 16:29:04'),
	(2, 'Ana Clara', '50572398808', 'clarinhakassao@gmail.com', 'anabanana', '2026-04-30 16:27:58');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
