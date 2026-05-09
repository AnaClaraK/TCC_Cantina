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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~2 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `nome`, `email`, `senha`, `img`) VALUES
	(1, 'Ana Banana', 'anabanana@gmail.com', 'b2e7e03ede85560977685add00fa3276ea7aa1c780fc87b870d7b027dc277007', '/imagens/1777572726880.jpg'),
	(2, 'Kemilly', 'kemillyregina@gmail.com', '581623e8e02c55c847d25bff880b7d03a449e0990855d2b6b131c858bafc4b5f', '/imagens/def_avt.jpg');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos: ~0 rows (aproximadamente)
DELETE FROM `pedidos`;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos_itens: ~0 rows (aproximadamente)
DELETE FROM `pedidos_itens`;

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
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~68 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `qtd`, `img`) VALUES
	(1, 1, '100', 'Café coado 50ml', '', 2.26, 0, 'cafe_50.jpg'),
	(2, 1, '4006381492355', 'Café coado 100ml', '', 3.50, 5, 'cafe_100.png'),
	(3, 1, '102', 'Pingado 150ml', '', 3.80, 0, 'cafe_pingado.png'),
	(4, 1, '103', 'Chocolate quente 200ml', '', 6.94, 0, 'cafe.png'),
	(5, 2, '104', 'Arroz, Strogonoff de frango P', '', 18.60, 0, 'arroz_strog.png'),
	(6, 2, '105', 'Arroz, Strogonoff de frango M', '', 19.50, 0, 'arroz_strog.jpg'),
	(7, 2, '106', 'Arroz, Strogonoff de frango G', '', 20.70, 0, 'arroz_strog.png'),
	(8, 2, '107', 'Arroz, lasanha bolonhesa P', '', 18.60, 0, 'arroz_lasan.png'),
	(9, 2, '108', 'Arroz, lasanha bolonhesa M', '', 19.50, 0, 'arroz_lasan.png'),
	(10, 2, '109', 'Arroz, lasanha bolonhesa G', '', 20.70, 0, 'arroz_lasan.png'),
	(11, 2, '110', 'Arroz, feijão, carne de panela P', '', 18.60, 0, 'arroz_carp.jpg'),
	(12, 2, '111', 'Arroz, feijão, carne de panela M', '', 19.50, 0, 'arroz_carp.jpg'),
	(13, 2, '112', 'Arroz, feijão, carne de panela G', '', 20.70, 0, 'arroz_carp.jpg'),
	(14, 2, '113', 'Macarrão bolonhesa P', '', 18.60, 0, 'macarr_bolon.jpg'),
	(15, 2, '114', 'Macarrão bolonhesa M', '', 19.50, 0, 'macarr_bolon.jpg'),
	(16, 2, '115', 'Macarrão bolonhesa G', '', 20.70, 0, 'macarr_bolon.jpg'),
	(17, 3, '116', 'Picolé de água', '', 3.06, 0, 'picole_agua.jpg'),
	(18, 3, '117', 'Picolé de leite', '', 4.20, 0, 'picole_leite.png'),
	(19, 3, '7898119104794', 'Picolé tipo skimo', '', 5.50, 5, 'picole_skimo.jpg'),
	(20, 3, '119', 'Picolé gianduia', '', 5.50, 0, 'img_ntf.png'),
	(21, 3, '120', 'Picolé Maxxi leite trufado', '', 9.00, 0, 'maxxi_black.png'),
	(22, 3, '6972689546657', 'Picolé Maxxi Black', '', 9.00, 10, 'maxxi_black.png'),
	(23, 3, '122', 'Picolé Maxxi White', '', 9.00, 0, 'maxxi_white.png'),
	(24, 3, '123', 'Copo Big bombom', '', 7.00, 0, 'big_bombom.png'),
	(25, 3, '124', 'Copo Big flocos', '', 7.00, 0, 'big_flocos.png'),
	(26, 3, '125', 'Copo Big napolitano', '', 7.00, 0, 'big_napolitano.png'),
	(27, 3, '126', 'Copo Big speciale', '', 7.00, 0, 'img_ntf.png'),
	(28, 3, '127', 'Mini bombom Maxxi açaí', '', 15.50, 0, 'bomb_acai.jpg'),
	(29, 3, '128', 'Mini bombom Maxxi skimo', '', 15.50, 0, 'bomb_skimo.png'),
	(30, 3, '129', 'Pote de açaí 240ml', '', 12.50, 0, 'acai_240.png'),
	(31, 3, '130', 'Sorvete misto', '', 2.00, 0, 'picole_misto.png'),
	(32, 4, '6956825938261', 'Esfirra de carne', '', 7.29, 5, 'esfirra.png'),
	(33, 4, '132', 'Esfirra de frango catu', '', 7.29, 0, 'esfirra.png'),
	(34, 4, '133', 'Enrolado de queijo', '', 7.29, 0, 'enroladinho.jpg'),
	(35, 4, '134', 'Enrolado de salsicha', '', 7.29, 0, 'enr_salsi.png'),
	(36, 4, '135', 'Hambúrguer com cheddar', '', 7.29, 0, 'bauru.png'),
	(37, 4, '136', 'Assado calabresa com queijo', '', 7.29, 0, 'torta.png'),
	(38, 4, '137', 'Torta frango catu tomate', '', 8.14, 0, 'torta.png'),
	(39, 4, '138', 'Torta presunto queijo catu', '', 8.14, 0, 'torta.png'),
	(40, 4, '139', 'Coxinha de carne', '', 7.58, 0, 'coxinha.jpg'),
	(41, 4, '140', 'Coxinha de frango', '', 7.58, 0, 'coxinha.jpg'),
	(42, 4, '141', 'Coxinha de costela', '', 8.50, 0, 'coxinha.jpg'),
	(43, 5, '142', 'Pão com ovo', '', 5.62, 0, 'pao_ovo.jpg'),
	(44, 5, '7891962036984', 'Bauru', '', 10.66, 10, 'bauru.png'),
	(45, 5, '144', 'Americano', '', 18.42, 0, 'img_ntf.png'),
	(46, 5, '145', 'Omelete simples', '', 5.00, 0, 'omelete_sim.png'),
	(47, 5, '146', 'Omelete presunto e queijo', '', 7.50, 0, 'omelete_sim.png'),
	(48, 5, '147', 'Ovo mexido', '', 4.50, 0, 'ovo_mexido.png'),
	(49, 5, '148', 'Misto quente', '', 6.50, 0, 'misto_quente.png'),
	(50, 6, '149', 'Trento avelã', '', 4.11, 0, 'trento_avela.jpg'),
	(51, 6, '150', 'Trento chocolate', '', 4.11, 0, 'trento_choc.jpg'),
	(52, 6, '151', 'Stikadinho', '', 2.00, 0, 'stikadinho.jpg'),
	(53, 6, '152', 'Halls morango', '', 2.50, 0, 'halls_mor.png'),
	(54, 6, '153', 'Paçoca', '', 3.00, 0, 'pacoca.jpg'),
	(55, 7, '154', 'Trufa de brigadeiro', '', 6.00, 0, 'trufa.png'),
	(56, 7, '155', 'Trufa de beijinho', '', 6.00, 0, 'trufa.png'),
	(57, 7, '156', 'Trufa de ninho', '', 6.00, 0, 'trufa.png'),
	(58, 7, '157', 'Trufa Ovomaltine', '', 6.50, 0, 'trufa.png'),
	(59, 7, '158', 'Trufa Nutella', '', 6.50, 0, 'trufa.png'),
	(60, 7, '159', 'Trufa Maracujá', '', 6.50, 0, 'trufa.png'),
	(61, 7, '160', 'Trufa Oreo', '', 6.50, 0, 'trufa.png'),
	(62, 7, '161', 'Bala baiana', '', 6.00, 0, 'bala_baiana.png'),
	(63, 8, '162', 'Mini Coca-Cola', '', 3.00, 0, 'coca_200.png'),
	(64, 8, '163', 'Mini Fanta', '', 3.00, 0, 'fanta_200.png'),
	(65, 8, '164', 'Água', '', 2.69, 0, 'agua.jpg'),
	(66, 8, '165', 'Água com gás', '', 2.70, 0, 'agua_gas.jpg'),
	(67, 8, '166', 'Coca-Cola 2L', '', 11.97, 0, 'coca_2l.png'),
	(68, 8, '167', 'Fanta 2L', '', 11.50, 0, 'fanta_2l.png');

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
