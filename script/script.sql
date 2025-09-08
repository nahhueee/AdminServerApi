DROP DATABASE IF EXISTS dbadminserver;
CREATE DATABASE dbadminserver;

USE dbadminserver;

DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
    id INT UNSIGNED AUTO_INCREMENT,
    DNI BIGINT,
    nombre VARCHAR(50),
    email VARCHAR(50),
    descripcion VARCHAR(80),
    fechaAlta DATE,
   
    PRIMARY KEY(id,DNI)
);

DROP TABLE IF EXISTS apps_cliente;
CREATE TABLE apps_cliente (
    terminal INT UNSIGNED AUTO_INCREMENT,
    DNI INT,
    mac VARCHAR(20),
    idApp INT,
    habilitado BOOLEAN,

    PRIMARY KEY(terminal, DNI, mac, idApp)
);

DROP TABLE IF EXISTS aplicaciones;
CREATE TABLE aplicaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20),
    version VARCHAR(8),
    link VARCHAR(30),
    info VARCHAR(800)
);


INSERT INTO aplicaciones(nombre, version, link, info) VALUES ('Easy Sales', '1.0.0', '', ''), ('Easy Resto', '1.0.0', '', '');

