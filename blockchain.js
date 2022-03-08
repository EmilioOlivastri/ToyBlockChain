//Importing a library that allows us to encrypt using SHA256
const SHA256 = require('crypto-js/sha256')

//This linraries create keys and have methods to verify 
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//Transactions data container 
class Transaction {

    //Transaction come from someone
    //Arrive to someone
    //Have some amount of money
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    //It calculates the hash of the transaction
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    //To sign the transaction we need to use a key 
    //It is signed with the private key though
    signTransaction(signingKey) {

        //The fromAddress is a public key, I can spend money only if it is my key
        //private key is linked with public key, so I extract it from the private and check if it is the same
        //Even if you tampered and made it so that this doesn't trigget, the isValid function will check if the
        //signature is correct, for that you need the private key
        if (signingKey.getPublic('hex') !== this.fromAddress)
            throw new Error('You cannot sign transaction for other wallets')

        const hashTrans = this.calculateHash();
        //Creation the signature
        const sig = signingKey.sign(hashTrans, 'base64');

        //Saving the signature in a particular format
        this.signature = sig.toDER('hex');
    }

    isValid() {
        //Reward transactions are valid even if there is no signature
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0)
            throw Error('No signature in this transaction');

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }

}

//Single component of the blockchain
class Block {

    //Information needed in a block :
    // timestamp -> date fo creation of the block
    // transaction -> information that we want to save in the block
    // previousHash -> has of the prevous block
    // hash -> hash of the current block
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();

    }

    //Function to calculate hash of the block, it will identify the block uniquely in the chain
    calculateHash() {
        //Al the elements that we take into account to compute the hash, the function returns an object
        //So we convert it to string 
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    //Proof of Work, needed because we could tamper a block and then recalculate the blockchain hashes from that block 
    //to all the others, also called mining, we desire that to create a block it takes 10 minuts
    mineBlock(difficulty) {
        //We want to make it so the hash starts with n = difficulty zeros, in other to make it hard to create a block
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined : " + this.hash)
    }

    //Checking all the transactions in the block
    hasValidTransactions() {
        for (const tx of this.transactions)
            if (!tx.isValid()) return false;

        return true;
    }
}

//Class that manages all the blocks
class Blockchain {

    //Constructor initializes the chain
    constructor() {
        //The chain is empty at the beginning, only the genesis block
        this.chain = [this.createGenesisBlock()];

        //Number of zeros the block's hash need to start with, needed for proof-of-work
        //if you increas it, it takes a lot more to compute the block
        this.difficulty = 2;

        //Blocks can be created every 10 min so that means i will have some transactions pending
        this.pendingTransactions = [];
        //Reward for computing the transaction
        this.miningReward = 100;
    }

    //The crestion of the first block needs to be handles separatly 
    createGenesisBlock() {
        return new Block("01/01/2019", "Data : Genesis Block", "0");
    }

    //Get's the last block in the chain
    getLatestBlock() {
        return this.chain[this.chain.length - 1]
    }

    //Adds block to the chain
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        //After modifying the block we need to reculcalate the hash using proof-of-work
        //so it takes a while to compute the block
        newBlock.mineBlock(this.difficulty)
        this.chain.push(newBlock);
    }

    minePendingTransactions(miningRewardAddress) {
        //We create a new transaction that will reward us for our work
        this.pendingTransactions.push(new Transaction(null, miningRewardAddress, this.miningReward))

        //We compute the transactions that are pending
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log("Block succeffully mined");
        this.chain.push(block)

        //We create a new transaction that will reward us for our work
        this.pendingTransactions = [];
    }

    //We push the transactions in the block chain
    addTransaction(transaction) {

        if (!transaction.fromAddress || !transaction.toAddress)
            throw new Error("Transaction must include from and to Address")

        if (!transaction.isValid())
            throw new Error("Transaction must be valid")

        this.pendingTransactions.push(transaction)
    }

    //There is no static balance, it is calculated each time like this, we need to give the address of the miner
    getBalanceOfAddress(address) {
        let balance = 0;
        for (const block of this.chain)
            for (const trans of block.transactions) {
                if (trans.fromAddress === address)
                    balance -= trans.amount;
                if (trans.toAddress === address)
                    balance += trans.amount
            }

        return balance;
    }

    //Check if the chain is valid
    isChainValid() {
        for (let i = 1; i < this.chain.length; ++i) {
            const currentBlock = this.chain[i];
            const prevousBlock = this.chain[i - 1];

            //Check if the value has been modified somehow, if it doesnt correspond then it isn't valid
            // ( something in our current block/previous ones could have been modified )
            if (currentBlock.hash !== currentBlock.calculateHash()) return false;

            //Check if transactions in the block are valid
            if (!currentBlock.hasValidTransactions()) return false;

            //Check if previous blocks are valid 
            if (currentBlock.previousHash !== prevousBlock.hash) return false;
        }

        //If it exits the loop then the chain is valid
        return true;
    }


}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;