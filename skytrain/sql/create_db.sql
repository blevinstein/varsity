CREATE TABLE Accounts (
        Address VARCHAR(64),
        PrivateKey VARCHAR(128) NOT NULL,
        Region VARCHAR(16) NOT NULL,
        WaitUntil TIMESTAMP,
        PRIMARY KEY(Address)
);

CREATE TABLE Operations (
        Address VARCHAR(64),
        Priority INTEGER,
        Details TEXT NOT NULL,
        Status SMALLINT NOT NULL,
        PRIMARY KEY(Address, Priority),
        FOREIGN KEY(Address) REFERENCES Accounts(Address)
);
