CREATE DATABASE IF NOT EXISTS loja_pokemon;
USE loja_pokemon;

DROP TABLE IF EXISTS pokemon_tipo;
DROP TABLE IF EXISTS item_compra;
DROP TABLE IF EXISTS compra;
DROP TABLE IF EXISTS cliente_endereco;
DROP TABLE IF EXISTS tipo;
DROP TABLE IF EXISTS item_carrinho;
DROP TABLE IF EXISTS pokemon;
DROP TABLE IF EXISTS endereco;
DROP TABLE IF EXISTS cliente;


CREATE TABLE cliente(
cliente_id INT AUTO_INCREMENT,
nome_cliente VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
cpf CHAR(14) NOT NULL UNIQUE,
senha VARCHAR(255) NOT NULL,
telefone CHAR(11),
PRIMARY KEY (cliente_id)
);


CREATE TABLE endereco(
endereco_id INT AUTO_INCREMENT,
rua VARCHAR(100) NOT NULL,
bairro VARCHAR(50) NOT NULL,
numero VARCHAR(10) NOT NULL,
cidade VARCHAR(50) NOT NULL,
estado CHAR(2) NOT NULL,
cep CHAR(9) NOT NULL,
PRIMARY KEY (endereco_id)
);

CREATE TABLE pokemon(
pokemon_id INT AUTO_INCREMENT,
nome_pokemon VARCHAR(40) NOT NULL,
cor VARCHAR(20) NOT NULL,
genero VARCHAR(15) NOT NULL,
preco DECIMAL(10,2) NOT NULL,
geracao INT NOT NULL,
descricao TEXT,
estoque INT NOT NULL DEFAULT 0,
numero_pokedex INT,
PRIMARY KEY (pokemon_id),
CHECK (estoque >= 0)
);

CREATE TABLE tipo(
tipo_id INT AUTO_INCREMENT,
nome_tipo VARCHAR(40) NOT NULL,
PRIMARY KEY (tipo_id)
);

CREATE TABLE cliente_endereco(
cliente_id INT NOT NULL,
endereco_id INT NOT NULL,
PRIMARY KEY (cliente_id, endereco_id),
FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id) ON DELETE CASCADE,
FOREIGN KEY (endereco_id) REFERENCES endereco(endereco_id) ON DELETE CASCADE
);

CREATE TABLE compra(
nf_id INT AUTO_INCREMENT,
cliente_id INT NOT NULL,
preco DECIMAL(10,2) NOT NULL,
data_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (nf_id),
FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id)
);

CREATE TABLE item_compra(
compra_id INT NOT NULL,
pokemon_id INT NOT NULL,
quantidade INT NOT NULL,
preco_unitario DECIMAL(10,2) NOT NULL,
PRIMARY KEY (compra_id, pokemon_id),
FOREIGN KEY (compra_id) REFERENCES compra(nf_id) ON DELETE CASCADE,
FOREIGN KEY (pokemon_id) REFERENCES pokemon(pokemon_id),
CHECK (quantidade > 0)
);

CREATE TABLE pokemon_tipo(
pokemon_id INT NOT NULL,
tipo_id INT NOT NULL,
PRIMARY KEY (pokemon_id, tipo_id),
FOREIGN KEY (pokemon_id) REFERENCES pokemon(pokemon_id) ON DELETE CASCADE,
FOREIGN KEY (tipo_id) REFERENCES tipo(tipo_id) ON DELETE CASCADE
);

CREATE TABLE item_carrinho(
    cliente_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    quantidade INT NOT NULL,
    PRIMARY KEY (cliente_id, pokemon_id),
    FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id) ON DELETE CASCADE,
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(pokemon_id) ON DELETE CASCADE,
    CHECK (quantidade > 0)
);	

INSERT INTO cliente (nome_cliente, email, cpf, senha, telefone) VALUES
('João Silva', 'josilva@gmail.com', '111.111.111-11', 'pikachu123', '35999999999'),
('Maria Oliveira', 'mariaoliveira30@gmail.com', '222.222.222-22', 'starmie456', '11888888888'),
('Jose Santos', 'zedossantoss@gmail.com', '333.333.333-33', 'onix789', '12777777777');

INSERT INTO endereco (rua, bairro, numero, cidade, estado, cep) VALUES
('Rua das Flores', 'Centro', '10', 'São Paulo', 'SP', '01001-000'),
('Avenida Brasil', 'Jardim América', '200', 'Rio de Janeiro', 'RJ', '20000-000'),
('Rua Tiradentes', 'Funcionários', '30', 'Belo Horizonte', 'MG', '30000-000');


INSERT INTO cliente_endereco (cliente_id, endereco_id) VALUES
(1, 1), (2, 2), (3, 3);


INSERT INTO pokemon (nome_pokemon, cor, genero, preco, geracao, descricao, estoque, numero_pokedex) VALUES
('Pikachu', 'Amarelo', 'Macho', 1500.00, 1, 'Rato elétrico amigável', 10, 25),
('Charmander', 'Laranja', 'Macho', 1200.00, 1, 'Lagarto de fogo', 5, 4),
('Bulbasaur', 'Verde', 'Fêmea', 1100.00, 1, 'Semente nas costas', 8, 1);


INSERT INTO tipo (nome_tipo) VALUES
('Elétrico'),
('Fogo'),
('Planta'),
('Venenoso');


INSERT INTO pokemon_tipo (pokemon_id, tipo_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(3, 4);

INSERT INTO compra (cliente_id, preco) VALUES
(1, 1500.00),
(2, 2400.00),
(3, 1100.00);

INSERT INTO item_compra (compra_id, pokemon_id, quantidade, preco_unitario) VALUES
(1, 1, 1, 1500.00),
(2, 2, 2, 1200.00),
(3, 3, 1, 1100.00);

SELECT c.nome_cliente, p.nome_pokemon, ic.quantidade, co.data_compra FROM cliente c
INNER JOIN compra co ON c.cliente_id = co.cliente_id
INNER JOIN item_compra ic ON co.nf_id = ic.compra_id
INNER JOIN pokemon p ON ic.pokemon_id = p.pokemon_id;

SELECT p.nome_pokemon, t.nome_tipo FROM pokemon p
INNER JOIN pokemon_tipo pt ON p.pokemon_id = pt.pokemon_id
INNER JOIN tipo t ON pt.tipo_id = t.tipo_id;

SELECT c.nome_cliente, SUM(co.preco) AS total_gasto FROM cliente c
INNER JOIN compra co ON c.cliente_id = co.cliente_id
GROUP BY c.cliente_id, c.nome_cliente
ORDER BY total_gasto DESC;

SELECT nome_pokemon, estoque FROM pokemon 
WHERE estoque <= 5;

DELIMITER //

CREATE TRIGGER trg_atualiza_estoque_apos_venda
AFTER INSERT ON item_compra
FOR EACH ROW
BEGIN
    UPDATE pokemon 
    SET estoque = estoque - NEW.quantidade
    WHERE pokemon_id = NEW.pokemon_id;
END;
//

DELIMITER ;



