/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: cantina
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `cadastro`
--

DROP TABLE IF EXISTS `cadastro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cadastro` (
  `id_cadastro` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `senha` varchar(255) NOT NULL DEFAULT '',
  `img` varchar(255) NOT NULL,
  PRIMARY KEY (`id_cadastro`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadastro`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cadastro` WRITE;
/*!40000 ALTER TABLE `cadastro` DISABLE KEYS */;
INSERT INTO `cadastro` VALUES
(1,'Ana Banana','anabanana@gmail.com','$2b$10$pvtAPO8Zo5cg19i03Kg87e.c.FQm0Q/zqzjNTLLfgZenw1FekZ1mO','1788287557651.jpg'),
(2,'Kemilly','kemillyregina@gmail.com','5b41d889f9fa1c2d51448a8e009e16b7189030ce6cb637fba913ae33b231f702','/imagens/1778585396841.jpg'),
(4,'Teste','t@t.com','a2ca37fe6fdc490b8f7ce841e1701a169d2b1697c6b5b5c63f94abb8f9b6d6dd','/imagens/def_avt.jpg'),
(5,'a','a@a.c','$2b$10$Jlzz4.OxtdUo075ep8U0NeVoFmdTqvSBS4FlTkdiQXym0RKXGnAz.','/imagens/def_avt.jpg'),
(6,'aa','a@a.com','$2b$10$HUds0zH1CGJudYzKjwro6.cPiG1pGSlIcBy6A1O.ZnWQ.AnRnNtlO','/imagens/def_avt.jpg');
/*!40000 ALTER TABLE `cadastro` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id_categoria`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES
(1,'Bebidas Quentes'),
(2,'Marmitas'),
(3,'Picolés e Sorvetes'),
(4,'Salgados'),
(5,'Lanches'),
(6,'Guloseimas'),
(7,'Trufas'),
(8,'Bebidas');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `clientes_fiado`
--

DROP TABLE IF EXISTS `clientes_fiado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_fiado` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes_fiado`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `clientes_fiado` WRITE;
/*!40000 ALTER TABLE `clientes_fiado` DISABLE KEYS */;
INSERT INTO `clientes_fiado` VALUES
(1,'Ana Clara','21345678901','18 98812-8490','afnsafb snfbfbanf','2026-05-14 16:35:37'),
(4,'ana Banana','213456789056','18 98812-8490','afnsafb snfbfbanf','2026-05-14 16:36:23'),
(5,'Kemilly Regina','21345678930209','18 98812-8490','adgjkd jd','2026-05-14 17:03:54'),
(6,'Kemilly Reginer','213456789654','5518930853494','ku7 opkl','2026-05-14 18:40:27'),
(9,'ana','21345678902','18 98812-8492','afnsafb snfbfbanf','2026-08-06 16:31:12'),
(10,'enzo','1','1','1','2026-08-06 18:26:43'),
(11,'a','a','a','a','2026-08-06 18:54:51'),
(12,'g','11111111111','11111111111','g','2026-08-06 18:59:40'),
(14,'aaaaaaaaaaa','11111111112','11111111111','aaaaaaaaaaaaaaaaa','2026-08-20 16:11:56');
/*!40000 ALTER TABLE `clientes_fiado` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `conta_fiado_prod`
--

DROP TABLE IF EXISTS `conta_fiado_prod`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conta_fiado_prod`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `conta_fiado_prod` WRITE;
/*!40000 ALTER TABLE `conta_fiado_prod` DISABLE KEYS */;
INSERT INTO `conta_fiado_prod` VALUES
(13,9,10,5,21.00,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(14,13,3,1,4.00,'Pendente',1,'dia',2.0000,4.00,'0000-00-00',NULL,NULL),
(15,13,2,1,4.00,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(16,13,1,1,2.00,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(17,14,3,1,3.80,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(18,15,7,1,20.70,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(19,19,1,1,2.26,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(22,21,2,1,3.50,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL),
(23,21,1,1,2.26,'Pendente',0,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `conta_fiado_prod` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `contas_fiado`
--

DROP TABLE IF EXISTS `contas_fiado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contas_fiado`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `contas_fiado` WRITE;
/*!40000 ALTER TABLE `contas_fiado` DISABLE KEYS */;
INSERT INTO `contas_fiado` VALUES
(9,1,103.50,207.00,1,'2026-05-14 16:56:18','2026-08-22','2026-08-06 00:00:00','Atrasado','',10,0),
(13,1,9.56,101.34,1,'2026-05-19 08:38:50','2026-05-28','2026-05-29 00:00:00','Atrasado',NULL,10,0),
(14,1,3.80,37.62,1,'2026-05-19 08:49:53','2026-06-04','2026-08-22 00:00:00','Atrasado','loja',10,0),
(15,1,20.70,74.52,1,'2026-08-06 13:28:15','2026-08-06','2026-08-27 13:34:41','Atrasado','Fiado',10,0),
(19,4,2.26,2.26,0,'2026-08-06 15:26:10','2026-09-10','2026-08-27 13:50:11','Pendente','loja',10,0),
(21,14,5.76,12.10,1,'2026-08-20 13:13:52','2026-08-21','2026-08-27 00:00:00','Atrasado','loja',10,0);
/*!40000 ALTER TABLE `contas_fiado` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `fechamentos`
--

DROP TABLE IF EXISTS `fechamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fechamentos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `fechamentos` WRITE;
/*!40000 ALTER TABLE `fechamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `fechamentos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `fechamentos_diarios`
--

DROP TABLE IF EXISTS `fechamentos_diarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fechamentos_diarios` (
  `id_fechamento` int(11) NOT NULL AUTO_INCREMENT,
  `data_referencia` date NOT NULL,
  `troco_inicial` decimal(12,2) NOT NULL DEFAULT 0.00,
  `troco_proximo_dia` decimal(12,2) DEFAULT NULL,
  `dinheiro_esperado` decimal(12,2) DEFAULT NULL,
  `diferenca_caixa` decimal(12,2) DEFAULT NULL,
  `status` enum('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
  `data_fechamento` datetime DEFAULT NULL,
  PRIMARY KEY (`id_fechamento`),
  UNIQUE KEY `uk_fechamento_data` (`data_referencia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fechamentos_diarios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `fechamentos_diarios` WRITE;
/*!40000 ALTER TABLE `fechamentos_diarios` DISABLE KEYS */;
INSERT INTO `fechamentos_diarios` VALUES
(1,'2026-09-15',20.00,18.00,20.00,-2.00,'FECHADO','2026-09-15 14:28:57'),
(2,'2026-09-09',100.00,80.00,100.00,-20.00,'FECHADO','2026-09-15 14:37:43');
/*!40000 ALTER TABLE `fechamentos_diarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id_pedido`),
  UNIQUE KEY `codigo_comanda` (`codigo_comanda`),
  KEY `Index 2` (`id_user`),
  KEY `Index 4` (`id_cliente`),
  CONSTRAINT `FK_pedidos_clientes_fiado` FOREIGN KEY (`id_cliente`) REFERENCES `clientes_fiado` (`id_cliente`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedidos_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES
(7,2,NULL,1,'2026-04-16 17:08:06','0000-00-00 00:00:00','Finalizado','PDV',10.00,1,'DINHEIRO (F2)',NULL),
(8,2,NULL,2,'2026-04-16 17:08:19','0000-00-00 00:00:00','Finalizado','',2.00,2,'CARTÃO DE CRÉDITO (F3)',NULL),
(9,2,NULL,3,'2026-04-16 17:09:23','2026-05-08 11:40:00','Finalizado','Agendamento',30.00,2,'DINHEIRO (F2)',NULL),
(10,2,NULL,4,'2026-04-16 17:10:44','0000-00-00 00:00:00','Finalizado','',21.76,3,'DINHEIRO (F2)',NULL),
(13,1,NULL,7,'2026-04-30 13:37:22','0000-00-00 00:00:00','Finalizado','Fiado',8.02,3,'PIX (F6)',NULL),
(15,1,NULL,8,'2026-04-30 13:49:05','2026-06-17 09:30:00','Finalizado','',2.26,1,'PIX (F6)',NULL),
(16,1,NULL,9,'2026-04-30 14:05:23','0000-00-00 00:00:00','Finalizado','',2.26,1,'PIX (F6)',NULL),
(17,1,NULL,10,'2026-04-30 14:27:16','2026-05-08 12:00:00','Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(18,1,NULL,11,'2026-05-05 16:46:52','0000-00-00 00:00:00','Finalizado','',13.05,3,'CARTÃO DE CRÉDITO (F3)',NULL),
(19,1,NULL,12,'2026-05-05 16:48:57','0000-00-00 00:00:00','Finalizado','',10.79,2,'PIX (F6)',NULL),
(20,1,NULL,13,'2026-05-07 10:41:49',NULL,'Finalizado','',7.00,2,'DINHEIRO (F2)',NULL),
(21,1,NULL,14,'2026-05-07 10:42:09',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(22,1,NULL,15,'2026-05-07 10:44:48',NULL,'Finalizado','',7.00,2,'PIX (F6)',NULL),
(23,1,NULL,16,'2026-05-07 13:27:49',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(24,1,NULL,17,'2026-05-07 13:27:51',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(25,1,NULL,18,'2026-05-07 13:30:26',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(26,1,NULL,19,'2026-05-07 13:32:37',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(27,1,NULL,20,'2026-05-07 13:37:16',NULL,'Finalizado','',3.50,1,'DINHEIRO (F2)',NULL),
(28,1,NULL,21,'2026-05-12 11:07:03',NULL,'Finalizado','',3.50,1,'CARTÃO DE DÉBITO (F4)',NULL),
(29,1,NULL,22,'2026-05-12 11:10:35',NULL,'Finalizado','PDV',39.30,2,'DINHEIRO (F2)',NULL),
(31,1,NULL,0,'2026-05-26 13:49:26',NULL,'pendente','APP',40.70,3,NULL,'CMD2894'),
(32,1,NULL,0,'2026-05-26 13:49:47',NULL,'pendente','APP',7.76,2,NULL,'CMD5560'),
(33,1,NULL,0,'2026-05-26 13:51:31',NULL,'pendente','APP',9.04,4,NULL,'CMD1783'),
(34,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','APP',39.30,2,NULL,'CMD4790'),
(35,1,NULL,0,'2026-05-26 14:00:10',NULL,'Finalizado','APP',39.30,2,NULL,'CMD1212'),
(36,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','Agendamento',39.30,2,NULL,'CMD8765'),
(37,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','APP',39.30,2,NULL,'CMD9183'),
(38,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','APP',39.30,2,NULL,'CMD8282'),
(39,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','Agendamento',39.30,2,NULL,'CMD8250'),
(40,1,NULL,0,'2026-05-26 14:00:10',NULL,'pendente','APP',39.30,2,NULL,'CMD4232'),
(41,1,NULL,0,'2026-05-26 14:02:21',NULL,'pendente','APP',20.86,2,NULL,'CMD3037'),
(42,1,NULL,0,'2026-05-26 14:04:57',NULL,'Finalizado','APP',20.70,1,NULL,'CMD3284'),
(43,1,NULL,0,'2026-05-26 14:11:46',NULL,'pendente','APP',20.70,1,NULL,'CMD3997'),
(44,4,NULL,0,'2026-05-26 15:54:01',NULL,'pendente','APP',18.60,1,NULL,'CMD3062'),
(45,4,NULL,0,'2026-05-26 15:55:36',NULL,'pendente','APP',20.70,1,NULL,'CMD7401'),
(46,4,NULL,23,'2026-08-13 13:43:04',NULL,'Finalizado','App',20.70,1,'CARTÃO DE CRÉDITO (F3)','CMD23'),
(47,4,NULL,24,'2026-08-13 15:31:21',NULL,'Finalizado','App',18.60,1,'Dinheiro','CMD24'),
(50,4,NULL,25,'2026-07-28 11:07:32','2026-07-29 12:00:00','Agendado','App',20.70,1,'CREDITO','CMD25'),
(51,4,NULL,26,'2026-09-08 10:33:08','2026-07-29 12:00:00','Finalizado','App',42.70,3,'Dinheiro','CMD26'),
(58,4,NULL,27,'2026-08-06 08:45:24','2026-08-06 10:00:00','Agendado','App',18.60,1,'PIX','CMD27'),
(59,6,NULL,28,'2026-08-06 09:16:02','2026-08-06 10:00:00','Pendente','App',86.36,6,'PIX','CMD28'),
(60,4,NULL,29,'2026-08-06 10:13:31','2026-08-06 10:00:00','Pendente','Agendamento',41.56,3,'CREDITO','CMD29'),
(61,4,NULL,30,'2026-08-06 10:39:14','2026-08-06 10:00:00','Pendente','App',7.76,2,'PIX','CMD30'),
(62,4,NULL,31,'2026-08-06 13:20:20','2026-08-06 10:00:00','Pendente','App',48.40,12,'PIX','CMD31'),
(63,1,NULL,32,'2026-08-06 13:28:15',NULL,'Finalizado','Fiado',20.70,1,'FIADO',NULL),
(64,8,NULL,33,'2026-09-01 10:16:31','2026-08-06 10:00:00','Finalizado','App',18.60,1,'CARTÃO DE CRÉDITO (F3)','CMD33'),
(65,1,NULL,34,'2026-08-06 17:11:48',NULL,'Finalizado','PDV',7.76,2,'CARTÃO DE DÉBITO (F4)',NULL),
(66,1,NULL,35,'2026-08-06 17:13:43',NULL,'Finalizado','PDV',18.60,1,'CARTÃO DE CRÉDITO (F3)',NULL),
(67,4,NULL,36,'2026-09-01 10:39:41','2026-08-16 10:00:00','Finalizado','APP',18.60,1,'Dinheiro','CMD36'),
(68,1,NULL,37,'2026-08-27 00:00:00',NULL,'Finalizado','loja',2.49,1,NULL,NULL),
(69,1,NULL,38,'2026-08-27 00:00:00',NULL,'Finalizado','loja',2.49,1,NULL,NULL),
(71,1,NULL,39,'2026-08-27 00:00:00',NULL,'Finalizado','Fiado',22.77,1,NULL,NULL),
(72,1,NULL,40,'2026-08-27 00:00:00',NULL,'Finalizado','loja',6.34,2,NULL,NULL),
(73,1,4,41,'2026-08-27 00:00:00',NULL,'Finalizado','loja',2.49,1,'Pix',NULL),
(74,1,4,42,'2026-08-27 00:00:00',NULL,'Finalizado','loja',2.49,1,'Pix',NULL),
(75,1,4,43,'2026-08-27 00:00:00',NULL,'Finalizado','loja',2.49,1,'Dinheiro',NULL),
(76,1,4,44,'2026-08-27 13:34:14',NULL,'Finalizado','loja',2.49,1,'Cartão de débito',NULL),
(79,1,1,45,'2026-08-27 13:34:41',NULL,'Finalizado','Fiado',22.77,1,'Pix',NULL),
(80,1,4,46,'2026-08-27 13:38:22',NULL,'Finalizado','loja',2.49,1,'Dinheiro',NULL),
(81,1,4,47,'2026-08-27 13:43:20',NULL,'Finalizado','loja',2.49,1,'Dinheiro',NULL),
(82,1,4,48,'2026-08-27 13:50:11',NULL,'Finalizado','loja',2.49,1,'Dinheiro',NULL),
(84,1,NULL,49,'2026-09-01 10:23:25',NULL,'Finalizado','PDV',3.50,1,'Dinheiro',NULL),
(85,1,NULL,50,'2026-09-01 10:39:55',NULL,'Finalizado','PDV',3.50,1,'Dinheiro',NULL),
(86,1,NULL,51,'2026-09-01 10:43:01',NULL,'Finalizado','PDV',3.50,1,'CARTÃO DE DÉBITO (F4)',NULL),
(87,1,NULL,52,'2026-09-01 10:53:59',NULL,'Finalizado','PDV',3.50,1,'PIX (F6)',NULL),
(88,1,NULL,53,'2026-09-01 13:07:04',NULL,'Finalizado','PDV',3.50,1,'Dinheiro',NULL),
(89,1,NULL,54,'2026-09-01 13:08:36',NULL,'Finalizado','PDV',3.50,1,'CARTÃO DE DÉBITO (F4)',NULL),
(90,1,NULL,55,'2026-09-01 13:08:47',NULL,'Finalizado','PDV',3.50,1,'Cartão de Crédito',NULL),
(91,1,NULL,56,'2026-09-01 13:09:04',NULL,'Finalizado','PDV',3.50,1,'CARTÃO DE DÉBITO (F4)',NULL),
(92,1,NULL,57,'2026-09-01 13:20:03',NULL,'Finalizado','PDV',3.50,1,'CARTÃO DE DÉBITO',NULL),
(93,1,NULL,58,'2026-09-01 14:06:51',NULL,'Finalizado','PDV',3.50,1,'CARTÃO DE DÉBITO',NULL),
(95,1,NULL,59,'2026-09-08 10:41:54',NULL,'Finalizado','PDV',2.26,1,'PIX',NULL),
(96,1,NULL,60,'2026-09-08 10:51:23',NULL,'Finalizado','PDV',2.26,1,'Dinheiro',NULL),
(97,1,NULL,61,'2026-09-08 10:51:38',NULL,'Finalizado','PDV',2.26,1,'PIX',NULL),
(98,4,NULL,62,'2026-09-08 10:56:23','2026-09-08 10:00:00','Finalizado','APP',37.20,2,'DINHEIRO','CMD62');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `pedidos_itens`
--

DROP TABLE IF EXISTS `pedidos_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos_itens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `pedidos_itens` WRITE;
/*!40000 ALTER TABLE `pedidos_itens` DISABLE KEYS */;
INSERT INTO `pedidos_itens` VALUES
(12,7,1,1,2.260000),
(13,8,14,1,18.600000),
(14,8,1,1,2.260000),
(15,9,14,1,18.600000),
(16,9,1,1,2.260000),
(17,10,6,1,19.500000),
(18,10,1,1,2.260000),
(19,13,1,2,2.260000),
(20,13,2,1,3.500000),
(21,15,1,1,2.260000),
(22,16,1,1,2.260000),
(23,17,2,1,3.500000),
(24,18,1,1,2.260000),
(25,18,32,1,7.290000),
(26,18,2,1,3.500000),
(27,19,2,1,3.500000),
(28,19,32,1,7.290000),
(29,20,2,2,3.500000),
(30,21,2,1,3.500000),
(31,22,2,2,3.500000),
(32,23,2,1,3.500000),
(33,24,2,1,3.500000),
(34,25,2,1,3.500000),
(35,26,2,2,3.500000),
(36,27,2,1,3.500000),
(37,28,2,1,3.500000),
(38,29,7,1,20.700000),
(39,29,5,1,18.600000),
(40,31,2,1,3.500000),
(41,31,5,2,18.600000),
(42,32,1,1,2.260000),
(43,32,19,1,5.500000),
(44,33,1,4,2.260000),
(45,34,5,1,18.600000),
(46,34,7,1,20.700000),
(47,35,5,1,18.600000),
(48,35,7,1,20.700000),
(49,36,5,1,18.600000),
(50,37,5,1,18.600000),
(51,38,5,1,18.600000),
(52,36,7,1,20.700000),
(53,37,7,1,20.700000),
(54,38,7,1,20.700000),
(55,39,5,1,18.600000),
(56,39,7,1,20.700000),
(57,40,5,1,18.600000),
(58,40,7,1,20.700000),
(59,41,5,1,18.600000),
(60,41,1,1,2.260000),
(61,42,7,1,20.700000),
(62,43,7,1,20.700000),
(63,44,5,1,18.600000),
(64,45,7,1,20.700000),
(65,46,7,1,20.700000),
(66,47,8,1,18.600000),
(67,50,7,1,20.700000),
(68,51,5,2,18.600000),
(69,51,19,1,5.500000),
(70,58,5,1,18.600000),
(71,59,1,1,2.260000),
(72,59,19,1,5.500000),
(73,59,5,2,18.600000),
(74,59,7,2,20.700000),
(75,60,5,1,18.600000),
(76,60,7,1,20.700000),
(77,60,1,1,2.260000),
(78,61,1,1,2.260000),
(79,61,19,1,5.500000),
(80,62,25,1,7.000000),
(81,62,1,7,2.260000),
(82,62,19,2,5.500000),
(83,62,37,2,7.290000),
(84,63,7,1,20.700000),
(85,64,5,1,18.600000),
(86,65,19,1,5.500000),
(87,65,1,1,2.260000),
(88,66,5,1,18.600000),
(89,67,5,1,18.600000),
(90,68,1,1,2.260000),
(91,69,1,1,2.260000),
(92,71,7,1,20.700000),
(93,72,2,1,3.500000),
(94,72,1,1,2.260000),
(95,73,1,1,2.260000),
(96,74,1,1,2.260000),
(97,75,1,1,2.260000),
(98,76,1,1,2.260000),
(99,79,7,1,20.700000),
(100,80,1,1,2.260000),
(101,81,1,1,2.260000),
(102,82,1,1,2.260000),
(104,84,2,1,3.500000),
(105,85,2,1,3.500000),
(106,86,2,1,3.500000),
(107,87,2,1,3.500000),
(108,88,2,1,3.500000),
(109,89,2,1,3.500000),
(110,90,2,1,3.500000),
(111,91,2,1,3.500000),
(112,92,2,1,3.500000),
(113,93,2,1,3.500000),
(114,95,1,1,2.260000),
(115,96,1,1,2.260000),
(116,97,1,1,2.260000),
(117,98,5,2,18.600000);
/*!40000 ALTER TABLE `pedidos_itens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  `fiado` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  KEY `Index 2` (`id_categoria`),
  CONSTRAINT `FK_produtos_categorias` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES
(1,1,'100','Café coado 50ml','',2.26,0.00,0.00,0,'cafe_50.jpg',3,NULL),
(2,1,'101','Café coado 100ml','',3.50,0.00,0.00,10,'cafe_100.png',1,NULL),
(3,1,'102','Pingado 150ml','',3.80,0.00,0.00,0,'cafe_pingado.png',1,NULL),
(4,1,'103','Chocolate quente 200ml','',6.94,0.00,0.00,0,'cafe.png',1,NULL),
(5,2,'104','Arroz, Strogonoff de frango P','Delicioso strogonoff preparado com pedaços selecionados de peito de frango, regado ao autêntico molho cremoso de creme de leite fresquinho, ketchup, mostarda e cogumelos fatiados. Acompanha arroz branco soltinho e batata palha super crocante.',18.60,0.00,0.00,3,'arroz_strog.png',1,NULL),
(6,2,'105','Arroz, Strogonoff de frango M','',19.50,0.00,0.00,10,'arroz_strog.jpg',1,NULL),
(7,2,'106','Arroz, Strogonoff de frango G','',20.70,0.00,0.00,6,'arroz_strog.png',1,NULL),
(8,2,'107','Arroz, lasanha bolonhesa P','',18.60,0.00,0.00,4,'arroz_lasan.png',1,NULL),
(9,2,'108','Arroz, lasanha bolonhesa M','',19.50,0.00,0.00,0,'arroz_lasan.png',1,NULL),
(10,2,'109','Arroz, lasanha bolonhesa G','',20.70,0.00,0.00,0,'arroz_lasan.png',1,NULL),
(11,2,'110','Arroz, feijão, carne de panela P','',18.60,0.00,0.00,0,'arroz_carp.jpg',1,NULL),
(12,2,'111','Arroz, feijão, carne de panela M','',19.50,0.00,0.00,0,'arroz_carp.jpg',1,NULL),
(13,2,'112','Arroz, feijão, carne de panela G','',20.70,0.00,0.00,0,'arroz_carp.jpg',1,NULL),
(14,2,'113','Macarrão bolonhesa P','',18.60,0.00,0.00,0,'macarr_bolon.jpg',1,NULL),
(15,2,'114','Macarrão bolonhesa M','',19.50,0.00,0.00,5,'macarr_bolon.jpg',1,NULL),
(16,2,'115','Macarrão bolonhesa G','',20.70,0.00,0.00,0,'macarr_bolon.jpg',1,NULL),
(17,3,'116','Picolé de água','',3.06,0.00,0.00,0,'picole_agua.jpg',1,NULL),
(18,3,'117','Picolé de leite','',4.20,0.00,0.00,0,'picole_leite.png',1,NULL),
(19,3,'118','Picolé tipo skimo','',5.50,0.00,0.00,6,'picole_skimo.jpg',1,NULL),
(20,3,'119','Picolé gianduia','',5.50,0.00,0.00,0,'img_ntf.png',1,NULL),
(21,3,'120','Picolé Maxxi leite trufado','',9.00,0.00,0.00,0,'maxxi_black.png',1,NULL),
(22,3,'121','Picolé Maxxi Black','',9.00,0.00,0.00,0,'maxxi_black.png',1,NULL),
(23,3,'122','Picolé Maxxi White','',9.00,0.00,0.00,0,'maxxi_white.png',1,NULL),
(24,3,'123','Copo Big bombom','',7.00,0.00,0.00,0,'big_bombom.png',1,NULL),
(25,3,'124','Copo Big flocos','',7.00,0.00,0.00,10,'big_flocos.png',1,NULL),
(26,3,'125','Copo Big napolitano','',7.00,0.00,0.00,0,'big_napolitano.png',1,NULL),
(27,3,'126','Copo Big speciale','',7.00,0.00,0.00,0,'img_ntf.png',1,NULL),
(28,3,'127','Mini bombom Maxxi açaí','',15.50,0.00,0.00,0,'bomb_acai.jpg',1,NULL),
(29,3,'128','Mini bombom Maxxi skimo','',15.50,0.00,0.00,0,'bomb_skimo.png',1,NULL),
(30,3,'129','Pote de açaí 240ml','',12.50,0.00,0.00,0,'acai_240.png',1,NULL),
(31,3,'130','Sorvete misto','',2.00,0.00,0.00,0,'picole_misto.png',1,NULL),
(32,4,'131','Esfirra de carne','',7.29,0.00,0.00,0,'esfirrac.png',1,NULL),
(33,4,'132','Esfirra de frango catu','',7.29,0.00,0.00,0,'esfirraf.png',1,NULL),
(34,4,'133','Enrolado de queijo','',7.29,0.00,0.00,0,'enroladinho.png',0,NULL),
(35,4,'134','Enrolado de salsicha','',7.29,0.00,0.00,0,'enr_salsi.png',1,NULL),
(36,4,'135','Hambúrguer com cheddar','',7.29,0.00,0.00,3,'hamburguer.png',1,NULL),
(37,4,'136','Assado calabresa com queijo','',7.29,0.00,0.00,10,'torta.png',1,NULL),
(38,4,'137','Torta frango catu tomate','',8.14,0.00,0.00,0,'tortaf.png',1,NULL),
(39,4,'138','Torta presunto queijo catu','',8.14,0.00,0.00,0,'tortap.png',1,NULL),
(40,4,'139','Coxinha de carne','',7.58,0.00,0.00,0,'coxinha.jpg',1,NULL),
(41,4,'140','Coxinha de frango','',7.58,0.00,0.00,0,'coxinha.jpg',1,NULL),
(42,4,'141','Coxinha de costela','',8.50,0.00,0.00,10,'coxinha.jpg',1,NULL),
(43,5,'142','Pão com ovo','',5.62,0.00,0.00,0,'pao_ovo.jpg',1,NULL),
(44,5,'143','Bauru','',10.66,0.00,0.00,0,'bauru.png',1,NULL),
(45,5,'144','Americano','',18.42,0.00,0.00,0,'img_ntf.png',1,NULL),
(46,5,'145','Omelete simples','',5.00,0.00,0.00,0,'omelete_sim.png',1,NULL),
(47,5,'146','Omelete presunto e queijo','',7.50,0.00,0.00,0,'omelete_sim.png',1,NULL),
(48,5,'147','Ovo mexido','',4.50,0.00,0.00,0,'ovo_mexido.png',1,NULL),
(49,5,'148','Misto quente','',6.50,0.00,0.00,0,'misto_quente.png',1,NULL),
(50,6,'149','Trento avelã','',4.11,0.00,0.00,0,'trento_avela.jpg',1,NULL),
(51,6,'150','Trento chocolate','',4.11,0.00,0.00,0,'trento_choc.jpg',1,NULL),
(52,6,'151','Stikadinho','',2.00,0.00,0.00,0,'stikadinho.jpg',1,NULL),
(53,6,'152','Halls morango','',2.50,0.00,0.00,0,'halls_mor.png',1,NULL),
(54,6,'153','Paçoca','',3.00,0.00,0.00,0,'pacoca.jpg',1,NULL),
(55,7,'154','Trufa de brigadeiro','',6.00,0.00,0.00,0,'trufa.png',1,NULL),
(56,7,'155','Trufa de beijinho','',6.00,0.00,0.00,0,'trufa.png',1,NULL),
(57,7,'156','Trufa de ninho','',6.00,0.00,0.00,0,'trufa.png',1,NULL),
(58,7,'157','Trufa Ovomaltine','',6.50,0.00,0.00,10,'trufa.png',1,NULL),
(59,7,'158','Trufa Nutella','',6.50,0.00,0.00,0,'trufa.png',1,NULL),
(60,7,'159','Trufa Maracujá','',6.50,0.00,0.00,0,'trufa.png',1,NULL),
(61,7,'160','Trufa Oreo','',6.50,0.00,0.00,0,'trufa.png',1,NULL),
(62,7,'161','Bala baiana','',6.00,0.00,0.00,0,'bala_baiana.png',1,NULL),
(63,8,'162','Mini Coca-Cola','',3.00,0.00,0.00,10,'coca_200.png',1,NULL),
(64,8,'163','Mini Fanta','',3.00,0.00,0.00,0,'fanta_200.png',1,NULL),
(65,8,'164','Água','',2.69,0.00,0.00,0,'agua.jpg',1,NULL),
(66,8,'165','Água com gás','',2.70,0.00,0.00,0,'agua_gas.jpg',1,NULL),
(67,8,'166','Coca-Cola 2L','',11.97,0.00,0.00,0,'coca_2l.png',1,NULL),
(68,8,'167','Fanta 2L','',11.50,0.00,0.00,0,'fanta_2l.png',1,NULL),
(70,6,'168','Brownie','',6.50,0.00,0.00,0,'brownie.png',0,NULL),
(71,7,'169','Trufa de KitKat','',6.50,0.00,0.00,0,'1778613120966.png',NULL,NULL);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `reposicao`
--

DROP TABLE IF EXISTS `reposicao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reposicao`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `reposicao` WRITE;
/*!40000 ALTER TABLE `reposicao` DISABLE KEYS */;
INSERT INTO `reposicao` VALUES
(1,22,'Picolé Maxxi Black',36,36,'Alta','l','Concluído'),
(2,8,'Arroz, lasanha bolonhesa P',25,25,'Alta','9','Concluído'),
(3,32,'Esfirra de carne',2,2,'Baixa','p','Concluído'),
(4,3,'Pingado 150ml',6,0,'Média','t','Pendente'),
(5,7,'Arroz, Strogonoff de frango G',5,5,'Média','Fornecedor Padrão','Concluído'),
(6,1,'Café coado 50ml',10,0,'Baixa','a','Cancelado'),
(7,19,'Picolé tipo skimo',5,5,'Média','Fornecedor Padrão','Concluído'),
(8,19,'Picolé tipo skimo',5,5,'Média','Fornecedor Padrão','Concluído'),
(9,2,'Café coado 100ml',9,4,'Média','aa','Concluído'),
(10,19,'Picolé tipo skimo',5,5,'Média','Fornecedor Padrão','Concluído'),
(11,8,'Arroz, lasanha bolonhesa P',5,0,'Média','Fornecedor Padrão','Pendente'),
(12,2,'Café coado 100ml',4,4,'Alta','aa','Concluído'),
(13,2,'Café coado 100ml',4,4,'Baixa','aa','Concluído'),
(14,9,'Arroz, lasanha bolonhesa M',6,0,'Baixa','a','Pendente'),
(15,2,'Café coado 100ml',5,5,'Média','Fornecedor Padrão','Concluído');
/*!40000 ALTER TABLE `reposicao` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL DEFAULT '',
  `cpf` varchar(14) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '0',
  `senha` varchar(255) NOT NULL DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Consumidor Final','00000000000','granovita@gmail.com','granovita','2026-04-30 16:29:04'),
(2,'Ana Clara','50572398808','clarinhakassao@gmail.com','anabanana','2026-04-30 16:27:58'),
(4,'Ana Banana','50572398808','anabanana1@gmail.com','$2b$10$PgNxl4/RTOBIbnqFtzAkUOTbPnnZPKz6d12a2bN0r8ATPh3LryyX.','2026-08-20 17:00:28'),
(5,'lauanemelissa','12345678912','melissalauane@email.com','$2b$10$AIm15c1vXbXaX3G17vnUeu8WXyxhE/ZwcRfhSg8K2maUs6EPNVVlu','2026-08-06 11:53:04'),
(6,'melissalauane','12345678912','stardevaulas@email.com','$2b$10$g0VX0N54JWULZNQ7LorJtuxcloLTPOEFSycFGmlNXVcDpxjmmV9cq','2026-08-06 11:54:47'),
(7,'ana bananana','50572398808','clarinhakassao@gmail.com','$2b$10$qtX/f..m0m2.q4xT88iqY.qZr4atm4ZBqyCrU5I55.j7Pn6RuBVUy','2026-08-06 13:06:20'),
(8,'felipe ','159159159159','felipe@teski','$2b$10$bgtE0fCIWy2N7ky4uItckOO75Az8EKj0BHY7FPGYnQHi40RnW7pcK','2026-08-06 18:23:33'),
(9,'Fernandacrua','37574489211','fernandacrua@gmail.com','$2b$10$bmWqDyGa/YPANx5IXCuje.qi.IRaSmkICrkKlQSa67jCHlOqvo7a2','2026-08-20 19:06:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping events for database 'cantina'
--

--
-- Dumping routines for database 'cantina'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-15 14:37:44
