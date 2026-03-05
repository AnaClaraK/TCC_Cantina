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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.cadastro: ~5 rows (aproximadamente)
DELETE FROM `cadastro`;
INSERT INTO `cadastro` (`id_cadastro`, `email`, `senha`) VALUES
	(2, 'clarinhakassao@gmail.com', '53646ae3a9424a0dfa2444e8d194a0d24cb45bfbca699f3b7f7eff604b70a904'),
	(3, 'clarinhakassaoa@gmail.com', '53646ae3a9424a0dfa2444e8d194a0d24cb45bfbca699f3b7f7eff604b70a904'),
	(4, 'clarinhakassaoaa@gmail.com', '961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506'),
	(5, 'clarinhakassaoaaa@gmail.com', '961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506'),
	(6, 'clarinhakassaao@gmail.com', '961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506');

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

-- Copiando estrutura para tabela cantina.categoria
DROP TABLE IF EXISTS `categoria`;
CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categ` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id_categ`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.categoria: ~0 rows (aproximadamente)
DELETE FROM `categoria`;

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
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `dt_validade` date DEFAULT NULL,
  `qtd` int(11) NOT NULL,
  `img` varchar(255) NOT NULL DEFAULT '',
  `disponivel` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela cantina.produtos: ~3 rows (aproximadamente)
DELETE FROM `produtos`;
INSERT INTO `produtos` (`id_produto`, `id_categoria`, `codigo_barras`, `nome`, `descricao`, `preco`, `dt_validade`, `qtd`, `img`, `disponivel`) VALUES
	(1, NULL, '1', 'coca\r\n', NULL, 3.00, NULL, 10, '/imagens/1772548011594.jpg', NULL),
	(2, NULL, '2', 'paçoca', NULL, 2.00, NULL, 0, '/imagens/1772729991633.webp', NULL),
	(3, NULL, '3', 'cereal', NULL, 2.20, NULL, 0, '/imagens/1772730083078.webp', NULL);

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
