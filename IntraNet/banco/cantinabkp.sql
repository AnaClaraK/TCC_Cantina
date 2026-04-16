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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~0 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `nome`, `email`, `senha`, `img`) VALUES
	(1, 'Ana Banana', 'anabanana@gmail.com', 'c64a0fbaee020a68288cd158bbd2d711ef7b8c07b592903546e7bc38fc002f02', 'images/jimin.jpg');

-- Copiando estrutura para tabela cantina.cardapio_dia
DROP TABLE IF EXISTS `cardapio_dia`;
CREATE TABLE IF NOT EXISTS `cardapio_dia` (
  `id_cardapiodia` int(11) NOT NULL AUTO_INCREMENT,
  `id_produto` int(11) NOT NULL,
  `dia_semana` varchar(255) NOT NULL DEFAULT '0',
  `acompanhamentos` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_cardapiodia`),
  KEY `Index 2` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cardapio_dia: ~0 rows (aproximadamente)
DELETE FROM `cardapio_dia`;

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

-- Copiando estrutura para tabela cantina.controle_reserva
DROP TABLE IF EXISTS `controle_reserva`;
CREATE TABLE IF NOT EXISTS `controle_reserva` (
  `id_controle` int(11) NOT NULL AUTO_INCREMENT,
  `id_reserva` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `qtd` int(11) NOT NULL,
  PRIMARY KEY (`id_controle`),
  KEY `Index 2` (`id_reserva`),
  KEY `Index 3` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.controle_reserva: ~0 rows (aproximadamente)
DELETE FROM `controle_reserva`;

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

-- Copiando estrutura para tabela cantina.lote_estoque
DROP TABLE IF EXISTS `lote_estoque`;
CREATE TABLE IF NOT EXISTS `lote_estoque` (
  `id_estoque` int(11) NOT NULL AUTO_INCREMENT,
  `id_produto` int(11) NOT NULL,
  `dt_fabricacao` date NOT NULL,
  `dt_validade` date NOT NULL,
  `qtd_atual` int(11) NOT NULL,
  PRIMARY KEY (`id_estoque`),
  KEY `Index 2` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.lote_estoque: ~0 rows (aproximadamente)
DELETE FROM `lote_estoque`;

-- Copiando estrutura para tabela cantina.pedidos
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `num_pedido` int(11) NOT NULL,
  `data` datetime DEFAULT current_timestamp(),
  `status` varchar(30) NOT NULL DEFAULT '',
  `valor_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `form_pag` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `Index 2` (`id_user`),
  CONSTRAINT `FK_pedidos_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos_itens: ~0 rows (aproximadamente)
DELETE FROM `pedidos_itens`;

-- Copiando estrutura para tabela cantina.produtos
DROP TABLE IF EXISTS `produtos`;
CREATE TABLE IF NOT EXISTS `produtos` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) DEFAULT NULL,
  `codigo_barras` varchar(255) NOT NULL DEFAULT '',
  `nome` varchar(255) NOT NULL DEFAULT '',
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `dt_validade` date NOT NULL,
  `qtd` int(11) NOT NULL,
  `img` varchar(255) NOT NULL DEFAULT '',
  `disponivel` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~68 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `dt_validade`, `qtd`, `img`, `disponivel`) VALUES
	(1, 1, '11', 'Café coado 50ml', '', 2.26, '0000-00-00', 3, '/images/cafe_50.jpg', 1),
	(2, 1, '3', 'Café coado 100ml', '', 3.50, '0000-00-00', 0, '/images/cafe_100.png', 1),
	(3, 1, '4', 'Pingado 150ml', '', 3.80, '0000-00-00', 0, '/images/cafe_pingado.png', 1),
	(4, 1, '', 'Chocolate quente 200ml', '', 6.94, '0000-00-00', 0, '/images/cafe.png', 1),
	(5, 2, '', 'Arroz, Strogonoff de frango P', '', 18.60, '0000-00-00', 0, '/images/arroz_strog.png', 1),
	(6, 2, '2', 'Arroz, Strogonoff de frango M', '', 19.50, '0000-00-00', 0, '/images/arroz_strog.jpg', 1),
	(7, 2, '', 'Arroz, Strogonoff de frango G', '', 20.70, '0000-00-00', 0, '/images/arroz_strog.png', 1),
	(8, 2, '', 'Arroz, lasanha bolonhesa P', '', 18.60, '0000-00-00', 0, '/images/arroz_lasan.png', 1),
	(9, 2, '', 'Arroz, lasanha bolonhesa M', '', 19.50, '0000-00-00', 0, '/images/arroz_lasan.png', 1),
	(10, 2, '', 'Arroz, lasanha bolonhesa G', '', 20.70, '0000-00-00', 0, '/images/arroz_lasan.png', 1),
	(11, 2, '', 'Arroz, feijão, carne de panela P', '', 18.60, '0000-00-00', 0, '/images/arroz_carp.jpg', 1),
	(12, 2, '', 'Arroz, feijão, carne de panela M', '', 19.50, '0000-00-00', 0, '/images/arroz_carp.jpg', 1),
	(13, 2, '', 'Arroz, feijão, carne de panela G', '', 20.70, '0000-00-00', 0, '/images/arroz_carp.jpg', 1),
	(14, 2, '7', 'Macarrão bolonhesa P', '', 18.60, '0000-00-00', 0, '/images/macarr_bolon.jpg', 1),
	(15, 2, '', 'Macarrão bolonhesa M', '', 19.50, '0000-00-00', 0, '/images/macarr_bolon.jpg', 1),
	(16, 2, '', 'Macarrão bolonhesa G', '', 20.70, '0000-00-00', 0, '/images/macarr_bolon.jpg', 1),
	(17, 3, '', 'Picolé de água', '', 3.06, '0000-00-00', 0, '/images/picole_agua.jpg', 1),
	(18, 3, '', 'Picolé de leite', '', 4.20, '0000-00-00', 0, '/images/picole_leite.png', 1),
	(19, 3, '', 'Picolé tipo skimo', '', 5.50, '0000-00-00', 0, '/images/picole_skimo.jpg', 1),
	(20, 3, '', 'Picolé gianduia', '', 5.50, '0000-00-00', 0, '/images/img_ntf.png', 1),
	(21, 3, '', 'Picolé Maxxi leite trufado', '', 9.00, '0000-00-00', 0, '/images/maxxi_black.png', 1),
	(22, 3, '', 'Picolé Maxxi Black', '', 9.00, '0000-00-00', 0, '/images/maxxi_black.png', 1),
	(23, 3, '', 'Picolé Maxxi White', '', 9.00, '0000-00-00', 0, '/images/maxxi_white.png', 1),
	(24, 3, '', 'Copo Big bombom', '', 7.00, '0000-00-00', 0, '/images/big_bombom.png', 1),
	(25, 3, '', 'Copo Big flocos', '', 7.00, '0000-00-00', 0, '/images/big_flocos.png', 1),
	(26, 3, '', 'Copo Big napolitano', '', 7.00, '0000-00-00', 0, '/images/big_napolitano.png', 1),
	(27, 3, '', 'Copo Big speciale', '', 7.00, '0000-00-00', 0, '/images/img_ntf.png', 1),
	(28, 3, '', 'Mini bombom Maxxi açaí', '', 15.50, '0000-00-00', 0, '/images/bomb_acai.jpg', 1),
	(29, 3, '', 'Mini bombom Maxxi skimo', '', 15.50, '0000-00-00', 0, '/images/bomb_skimo.png', 1),
	(30, 3, '', 'Pote de açaí 240ml', '', 12.50, '0000-00-00', 0, '/images/acai_240.png', 1),
	(31, 3, '', 'Sorvete misto', '', 2.00, '0000-00-00', 0, '/images/picole_misto.png', 1),
	(32, 4, '', 'Esfirra de carne', '', 7.29, '0000-00-00', 0, '/images/esfirra.png', 1),
	(33, 4, '', 'Esfirra de frango catu', '', 7.29, '0000-00-00', 0, '/images/esfirra.png', 1),
	(34, 4, '', 'Enrolado de queijo', '', 7.29, '0000-00-00', 0, '/images/enroladinho.jpg', 1),
	(35, 4, '', 'Enrolado de salsicha', '', 7.29, '0000-00-00', 0, '/images/enr_salsi.png', 1),
	(36, 4, '', 'Hambúrguer com cheddar', '', 7.29, '0000-00-00', 0, '/images/bauru.png', 1),
	(37, 4, '', 'Assado calabresa com queijo', '', 7.29, '0000-00-00', 0, '/images/torta.png', 1),
	(38, 4, '', 'Torta frango catu tomate', '', 8.14, '0000-00-00', 0, '/images/torta.png', 1),
	(39, 4, '', 'Torta presunto queijo catu', '', 8.14, '0000-00-00', 0, '/images/torta.png', 1),
	(40, 4, '', 'Coxinha de carne', '', 7.58, '0000-00-00', 0, '/images/coxinha.jpg', 1),
	(41, 4, '4', 'Coxinha de frango', '', 7.58, '0000-00-00', 0, '/images/coxinha.jpg', 1),
	(42, 4, '', 'Coxinha de costela', '', 8.50, '0000-00-00', 0, '/images/coxinha.jpg', 1),
	(43, 5, '', 'Pão com ovo', '', 5.62, '0000-00-00', 0, '/images/pao_ovo.jpg', 1),
	(44, 5, '', 'Bauru', '', 10.66, '0000-00-00', 0, '/images/bauru.png', 1),
	(45, 5, '', 'Americano', '', 18.42, '0000-00-00', 0, '/images/img_ntf.png', 1),
	(46, 5, '', 'Omelete simples', '', 5.00, '0000-00-00', 0, '/images/omelete_sim.png', 1),
	(47, 5, '', 'Omelete presunto e queijo', '', 7.50, '0000-00-00', 0, '/images/omelete_sim.png', 1),
	(48, 5, '', 'Ovo mexido', '', 4.50, '0000-00-00', 0, '/images/ovo_mexido.png', 1),
	(49, 5, '', 'Misto quente', '', 6.50, '0000-00-00', 0, '/images/misto_quente.png', 1),
	(50, 6, '', 'Trento avelã', '', 4.11, '0000-00-00', 0, '/images/trento_avela.jpg', 1),
	(51, 6, '', 'Trento chocolate', '', 4.11, '0000-00-00', 0, '/images/trento_choc.jpg', 1),
	(52, 6, '', 'Stikadinho', '', 2.00, '0000-00-00', 0, '/images/stikadinho.jpg', 1),
	(53, 6, '', 'Halls morango', '', 2.50, '0000-00-00', 0, '/images/halls_mor.png', 1),
	(54, 6, '', 'Paçoca', '', 3.00, '0000-00-00', 0, '/images/pacoca.jpg', 1),
	(55, 7, '', 'Trufa de brigadeiro', '', 6.00, '0000-00-00', 0, '/images/trufa.png', 1),
	(56, 7, '', 'Trufa de beijinho', '', 6.00, '0000-00-00', 0, '/images/trufa.png', 1),
	(57, 7, '', 'Trufa de ninho', '', 6.00, '0000-00-00', 0, '/images/trufa.png', 1),
	(58, 7, '', 'Trufa Ovomaltine', '', 6.50, '0000-00-00', 0, '/images/trufa.png', 1),
	(59, 7, '', 'Trufa Nutella', '', 6.50, '0000-00-00', 0, '/images/trufa.png', 1),
	(60, 7, '', 'Trufa Maracujá', '', 6.50, '0000-00-00', 0, '/images/trufa.png', 1),
	(61, 7, '', 'Trufa Oreo', '', 6.50, '0000-00-00', 0, '/images/trufa.png', 1),
	(62, 7, '', 'Bala baiana', '', 6.00, '0000-00-00', 0, '/images/bala_baiana.png', 1),
	(63, 8, '', 'Mini Coca-Cola', '', 3.00, '0000-00-00', 0, '/images/coca_200.png', 1),
	(64, 8, '', 'Mini Fanta', '', 3.00, '0000-00-00', 0, '/images/fanta_200.png', 1),
	(65, 8, '', 'Água', '', 2.69, '0000-00-00', 0, '/images/agua.jpg', 1),
	(66, 8, '', 'Água com gás', '', 2.70, '0000-00-00', 0, '/images/agua_gas.jpg', 1),
	(67, 8, '', 'Coca-Cola 2L', '', 11.97, '0000-00-00', 0, '/images/coca_2l.png', 1),
	(68, 8, '', 'Fanta 2L', '', 11.50, '0000-00-00', 0, '/images/fanta_2l.png', 1);

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.users: ~0 rows (aproximadamente)
DELETE FROM `users`;
INSERT INTO `users` (`id_user`, `nome`, `cpf`, `email`, `senha`, `data_criacao`) VALUES
	(1, 'Ana Clara', '50572398808', 'clarinhakassao@gmail.com', 'anabanana', '2026-04-16 13:04:17');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
