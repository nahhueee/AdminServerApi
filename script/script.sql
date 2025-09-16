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
    fechaBaja DATE,
   
    PRIMARY KEY(id,DNI)
);

DROP TABLE IF EXISTS pagos_cliente;
CREATE TABLE pagos_cliente (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idCliente INT,
    monto DECIMAL(10,2),
    fecha DATE,
    obs VARCHAR(50)
);

DROP TABLE IF EXISTS apps_cliente;
CREATE TABLE apps_cliente (
    terminal INT UNSIGNED AUTO_INCREMENT,
    DNI INT,
    mac VARCHAR(20),
    idApp INT,
    version VARCHAR(8),
    actualizacion DATETIME,
    habilitado BOOLEAN,

    PRIMARY KEY(terminal, DNI, mac, idApp)
);

DROP TABLE IF EXISTS aplicaciones;
CREATE TABLE aplicaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    portada VARCHAR(200),
    nombre VARCHAR(20),
    version VARCHAR(8),
    link VARCHAR(30),
    info VARCHAR(800),
    estado VARCHAR(10)
);


INSERT INTO aplicaciones(nombre, portada, version, link, info) VALUES ('Easy Sales', 'https://www.dropbox.com/scl/fi/m3g9ejqjlg3y04mp9g7lb/EasySalesLogo.png?rlkey=s64u72mj8mvhbtmlr5l1rx1vm&st=816wpv5c&dl=1', '1.0.0', '', ''), ('Easy Resto', 'https://www.dropbox.com/scl/fi/a4v2heionq4xq8yvevj6q/EasyRestoLogo.png?rlkey=qlmo18ctye2ingdz4vsmbx2y8&st=5429wsts&dl=1', '1.0.0', '', '');

