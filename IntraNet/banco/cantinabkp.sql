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
  `email` varchar(255) NOT NULL DEFAULT '',
  `senha` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_cadastro`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~1 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `email`, `senha`) VALUES
	(1, 'anabanana@gmail.com', 'c64a0fbaee020a68288cd158bbd2d711ef7b8c07b592903546e7bc38fc002f02');

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
  `id_categ` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id_categ`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.categorias: ~8 rows (aproximadamente)
DELETE FROM `categorias`;
INSERT INTO `categorias` (`id_categ`, `nome`) VALUES
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

-- Copiando estrutura para tabela cantina.itens_pedido
DROP TABLE IF EXISTS `itens_pedido`;
CREATE TABLE IF NOT EXISTS `itens_pedido` (
  `id_itenspedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `qtd` int(11) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_itenspedido`),
  KEY `Index 2` (`id_pedido`),
  KEY `Index 3` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.itens_pedido: ~0 rows (aproximadamente)
DELETE FROM `itens_pedido`;

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
  `data` date NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT '',
  `valor_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id_pedido`),
  KEY `Index 2` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.pedidos: ~0 rows (aproximadamente)
DELETE FROM `pedidos`;

-- Copiando estrutura para tabela cantina.produtos
DROP TABLE IF EXISTS `produtos`;
CREATE TABLE IF NOT EXISTS `produtos` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) DEFAULT NULL,
  `codigo_barras` varchar(255) NOT NULL DEFAULT '',
  `nome` varchar(255) NOT NULL DEFAULT '',
  `descricao` text NOT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `dt_validade` date DEFAULT NULL,
  `qtd` int(11) DEFAULT NULL,
  `img` varchar(255) NOT NULL DEFAULT '',
  `disponivel` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~68 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `dt_validade`, `qtd`, `img`, `disponivel`) VALUES
	(1, 1, '', 'Café coado 50ml', '', 2.26, NULL, NULL, '/images', 1),
	(2, 1, '', 'Café coado 100ml', '', 3.50, NULL, NULL, '/images', 1),
	(3, 1, '', 'Pingado 150ml', '', 3.80, NULL, NULL, '/images', 1),
	(4, 1, '', 'Chocolate quente 200ml', '', 6.94, NULL, NULL, '/images', 1),
	(5, 2, '', 'Arroz, Strogonoff de frango P', '', 18.60, NULL, NULL, '/images', 1),
	(6, 2, '', 'Arroz, Strogonoff de frango M', '', 19.50, NULL, NULL, '/images', 1),
	(7, 2, '', 'Arroz, Strogonoff de frango G', '', 20.70, NULL, NULL, '/images', 1),
	(8, 2, '', 'Arroz, lasanha bolonhesa P', '', 18.60, NULL, NULL, '/images', 1),
	(9, 2, '', 'Arroz, lasanha bolonhesa M', '', 19.50, NULL, NULL, '/images', 1),
	(10, 2, '', 'Arroz, lasanha bolonhesa G', '', 20.70, NULL, NULL, '/images', 1),
	(11, 2, '', 'Arroz, feijão, carne de panela P', '', 18.60, NULL, NULL, '/images', 1),
	(12, 2, '', 'Arroz, feijão, carne de panela M', '', 19.50, NULL, NULL, '/images', 1),
	(13, 2, '', 'Arroz, feijão, carne de panela G', '', 20.70, NULL, NULL, '/images', 1),
	(14, 2, '', 'Macarrão bolonhesa P', '', 18.60, NULL, NULL, '/images', 1),
	(15, 2, '', 'Macarrão bolonhesa M', '', 19.50, NULL, NULL, '/images', 1),
	(16, 2, '', 'Macarrão bolonhesa G', '', 20.70, NULL, NULL, '/images', 1),
	(17, 3, '', 'Picolé de água', '', 3.06, NULL, NULL, '/images', 1),
	(18, 3, '', 'Picolé de leite', '', 4.20, NULL, NULL, '/images', 1),
	(19, 3, '', 'Picolé tipo skimo', '', 5.50, NULL, NULL, '/images', 1),
	(20, 3, '', 'Picolé gianduia', '', 5.50, NULL, NULL, '/images', 1),
	(21, 3, '', 'Picolé Maxxi leite trufado', '', 9.00, NULL, NULL, '/images', 1),
	(22, 3, '', 'Picolé Maxxi Black', '', 9.00, NULL, NULL, '/images', 1),
	(23, 3, '', 'Picolé Maxxi White', '', 9.00, NULL, NULL, '/images', 1),
	(24, 3, '', 'Copo Big bombom', '', 7.00, NULL, NULL, '/images', 1),
	(25, 3, '', 'Copo Big flocos', '', 7.00, NULL, NULL, '/images', 1),
	(26, 3, '', 'Copo Big napolitano', '', 7.00, NULL, NULL, '/images', 1),
	(27, 3, '', 'Copo Big speciale', '', 7.00, NULL, NULL, '/images', 1),
	(28, 3, '', 'Mini bombom Maxxi açaí', '', 15.50, NULL, NULL, '/images', 1),
	(29, 3, '', 'Mini bombom Maxxi skimo', '', 15.50, NULL, NULL, '/images', 1),
	(30, 3, '', 'Pote de açaí 240ml', '', 12.50, NULL, NULL, '/images', 1),
	(31, 3, '', 'Sorvete misto', '', 2.00, NULL, NULL, '/images', 1),
	(32, 4, '', 'Esfirra de carne', '', 7.29, NULL, NULL, '/images', 1),
	(33, 4, '', 'Esfirra de frango catu', '', 7.29, NULL, NULL, '/images', 1),
	(34, 4, '', 'Enrolado de queijo', '', 7.29, NULL, NULL, '/images', 1),
	(35, 4, '', 'Enrolado de salsicha', '', 7.29, NULL, NULL, '/images', 1),
	(36, 4, '', 'Hambúrguer com cheddar', '', 7.29, NULL, NULL, '/images', 1),
	(37, 4, '', 'Assado calabresa com queijo', '', 7.29, NULL, NULL, '/images', 1),
	(38, 4, '', 'Torta frango catu tomate', '', 8.14, NULL, NULL, '/images', 1),
	(39, 4, '', 'Torta presunto queijo catu', '', 8.14, NULL, NULL, '/images', 1),
	(40, 4, '', 'Coxinha de carne', '', 7.58, NULL, NULL, '/images', 1),
	(41, 4, '', 'Coxinha de frango', '', 7.58, NULL, NULL, '/images', 1),
	(42, 4, '', 'Coxinha de costela', '', 8.50, NULL, NULL, '/images', 1),
	(43, 5, '', 'Pão com ovo', '', 5.62, NULL, NULL, '/images', 1),
	(44, 5, '', 'Bauru', '', 10.66, NULL, NULL, '/images', 1),
	(45, 5, '', 'Americano', '', 18.42, NULL, NULL, '/images', 1),
	(46, 5, '', 'Omelete simples', '', 5.00, NULL, NULL, '/images', 1),
	(47, 5, '', 'Omelete presunto e queijo', '', 7.50, NULL, NULL, '/images', 1),
	(48, 5, '', 'Ovo mexido', '', 4.50, NULL, NULL, '/images', 1),
	(49, 5, '', 'Misto quente', '', 6.50, NULL, NULL, '/images', 1),
	(50, 6, '', 'Trento avelã', '', 4.11, NULL, NULL, '/images', 1),
	(51, 6, '', 'Trento chocolate', '', 4.11, NULL, NULL, '/images', 1),
	(52, 6, '', 'Stikadinho', '', 2.00, NULL, NULL, '/images', 1),
	(53, 6, '', 'Halls morango', '', 2.50, NULL, NULL, '/images', 1),
	(54, 6, '', 'Paçoca', '', 3.00, NULL, NULL, '/images', 1),
	(55, 7, '', 'Trufa de brigadeiro', '', 6.00, NULL, NULL, '/images', 1),
	(56, 7, '', 'Trufa de beijinho', '', 6.00, NULL, NULL, '/images', 1),
	(57, 7, '', 'Trufa de ninho', '', 6.00, NULL, NULL, '/images', 1),
	(58, 7, '', 'Trufa Ovomaltine', '', 6.50, NULL, NULL, '/images', 1),
	(59, 7, '', 'Trufa Nutella', '', 6.50, NULL, NULL, '/images', 1),
	(60, 7, '', 'Trufa Maracujá', '', 6.50, NULL, NULL, '/images', 1),
	(61, 7, '', 'Trufa Oreo', '', 6.50, NULL, NULL, '/images', 1),
	(62, 7, '', 'Bala baiana', '', 6.00, NULL, NULL, '/images', 1),
	(63, 8, '', 'Mini Coca-Cola', '', 3.00, NULL, NULL, '/images', 1),
	(64, 8, '', 'Mini Fanta', '', 3.00, NULL, NULL, '/images', 1),
	(65, 8, '', 'Água', '', 2.69, NULL, NULL, '/images', 1),
	(66, 8, '', 'Água com gás', '', 2.70, NULL, NULL, '/images', 1),
	(67, 8, '', 'Coca-Cola 2L', '', 11.97, NULL, NULL, '/images', 1),
	(68, 8, '', 'Fanta 2L', '', 11.50, NULL, NULL, '/images', 1);

-- Copiando estrutura para tabela cantina.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL DEFAULT '',
  `cpf` int(11) NOT NULL DEFAULT 0,
  `email` varchar(255) NOT NULL DEFAULT '0',
  `senha` varchar(255) NOT NULL DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.users: ~0 rows (aproximadamente)
DELETE FROM `users`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
