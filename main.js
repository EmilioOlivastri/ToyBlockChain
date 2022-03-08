const { Blockchain, Transaction } = require('./blockchain');

//This linraries create keys and have methods to verify 
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//Keys
const myKey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf');
const myWalletAddress = myKey.getPublic('hex');

//Creating an instance of the blockchan and testing it 
let blockchain = new Blockchain();

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKey);
blockchain.addTransaction(tx1);

// Mine block
blockchain.minePendingTransactions(myWalletAddress);

// Create second transaction
const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.signTransaction(myKey);
blockchain.addTransaction(tx2);

// Mine block
blockchain.minePendingTransactions(myWalletAddress);

console.log();
console.log(`Balance of Emix is ${blockchain.getBalanceOfAddress(myWalletAddress)}`);

// Uncomment this line if you want to test tampering with the chain
blockchain.chain[1].transactions[0].amount = 10;

// Check if the chain is valid
console.log();
console.log('Blockchain valid?', blockchain.isChainValid() ? 'Yes' : 'No');


/*
console.log("Mining block 1 : ")
blockchain.addBlock(new Block(1, "02/01/2019", { amount: 4 }));

console.log("Mining block 2 : ")
blockchain.addBlock(new Block(2, "03/01/2019", { amount: 7 }));

console.log("Mining block 3 : ")
blockchain.addBlock(new Block(3, "02/02/2019", { amount: 2 }));


if (blockchain.isChainValid())
//How to format our blockchain in our screen
    console.log(JSON.stringify(blockchain, null, 4)); 

//Let's try to modify the chain blocks
blockchain.chain[1].data = { amount: 100 };
blockchain.chain[1].hash = blockchain.chain[1].calculateHash()

if (blockchain.isChainValid())
//How to format our blockchain in our screen
    console.log(JSON.stringify(blockchain, null, 4));
else console.log("The chain has been tampered with");
*/