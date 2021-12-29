CREATE TABLE Accounts (
        Address VARCHAR(64),
        WaitUntil TIMESTAMP,
        Region VARCHAR(16),
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
