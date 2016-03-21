DROP DATABASE IF EXISTS vendfit;

CREATE DATABASE vendfit;
USE vendfit;

CREATE TABLE vendfit.user(
	id INT AUTO_INCREMENT,
	fitbit_id VARCHAR(128) UNIQUE,
	access_token VARCHAR(512),
	total_steps INT,
	steps_spent_today INT,
	PRIMARY KEY (id),
	UNIQUE KEY user_fitbit_id_unique(fitbit_id)
);

CREATE TABLE vendfit.item(
	id INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(128) NOT NULL,
	cost INT NOT NULL,
	calories INT,
	sugars INT,
	carbs INT,
	saturated_fat INT,
	trans_fat INT,
	protien INT,
	sodium INT,
	PRIMARY KEY (id)
);

CREATE TABLE vendfit.vending_machine(
	id INT NOT NULL AUTO_INCREMENT,
	state INT,
	identifier VARCHAR(64) NOT NULL UNIQUE,
	last_checkin_date DATETIME,
	PRIMARY KEY (id),
	UNIQUE KEY vending_machine_identifer_unique(identifier)
);

CREATE TABLE vendfit.item_vending_machine(
	id INT NOT NULL AUTO_INCREMENT,
	item_id INT NOT NULL,
	vending_machine_id INT NOT NULL,
	stock INT NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT 
		FOREIGN KEY item_vending_machine_item_id (item_id)
			REFERENCES vendfit.item(id),
	CONSTRAINT
		FOREIGN KEY item_vending_machine_vending_machine_id (vending_machine_id)
			REFERENCES vendfit.vending_machine(id)
);