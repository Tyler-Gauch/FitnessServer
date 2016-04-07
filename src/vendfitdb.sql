-- MySQL dump 10.13  Distrib 5.5.46, for Linux (x86_64)
--
-- Host: localhost    Database: vendfit
-- ------------------------------------------------------
-- Server version	5.5.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `item`
--

USE vendift;

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item` (
  `id` int(11) NOT NULL,
  `vend_id` int(11),
  `name` varchar(128) NOT NULL,
  `cost` int(11) NOT NULL,
  `calories` int(11) DEFAULT NULL,
  `sugars` int(11) DEFAULT NULL,
  `carbs` int(11) DEFAULT NULL,
  `saturated_fat` int(11) DEFAULT NULL,
  `trans_fat` int(11) DEFAULT NULL,
  `protein` int(11) DEFAULT NULL,
  `sodium` int(11) DEFAULT NULL,
  `servings` float(6,2) DEFAULT NULL,
  `pic` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (21675,0,'Water',2000,0,0,0,0,0,0,0,1.00, "https://erinkim2011.files.wordpress.com/2011/06/lg_ko_dasani_bottle.jpg"),(5473583,1,'Gatorade G2 - Fruit Punch',3500,60,14,14,0,0,0,110,2.50, "http://www.pepsicobeveragefacts.com/content/image/products/G_StrawWater_32.png"),(14666435,2,'Gatorade G2 - Lemon Lime',3500,60,14,14,0,0,0,110,2.50,"https://happyspeedy.com/sites/default/files/gatorade-cool-blue-28oz06042015.jpg");
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_vending_machine`
--

DROP TABLE IF EXISTS `item_vending_machine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item_vending_machine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `vending_machine_id` int(11) NOT NULL,
  `stock` int(11) NOT NULL,
  `dispenser` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `item_vending_machine_item_id` (`item_id`),
  KEY `item_vending_machine_vending_machine_id` (`vending_machine_id`),
  CONSTRAINT `item_vending_machine_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `item_vending_machine_ibfk_2` FOREIGN KEY (`vending_machine_id`) REFERENCES `vending_machine` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--red gatorade png size
-- Dumping data for table `item_vending_machine`
--

LOCK TABLES `item_vending_machine` WRITE;
/*!40000 ALTER TABLE `item_vending_machine` DISABLE KEYS */;
INSERT INTO `item_vending_machine` VALUES (1,21675,1,8,0),(2,14666435,1,10,1),(4,5473583,1,10,2);
/*!40000 ALTER TABLE `item_vending_machine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fitbit_id` varchar(128) DEFAULT NULL,
  `access_token` varchar(512) DEFAULT NULL,
  `total_steps` int(11) DEFAULT NULL,
  `steps_spent_today` int(11) DEFAULT NULL,
  `date_updated` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fitbit_id` (`fitbit_id`),
  UNIQUE KEY `user_fitbit_id_unique` (`fitbit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vending_machine`
--

DROP TABLE IF EXISTS `vending_machine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vending_machine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(64) NOT NULL UNIQUE,	
  `state` int(11) DEFAULT NULL,
  `last_checkin_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY vending_machine_identifier_unique(`identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vending_machine`
--

LOCK TABLES `vending_machine` WRITE;
/*!40000 ALTER TABLE `vending_machine` DISABLE KEYS */;
INSERT INTO `vending_machine` VALUES (1,'vendfit_machine_1',1,'2016-03-11 18:17:25');
/*!40000 ALTER TABLE `vending_machine` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-03-22  1:31:23
