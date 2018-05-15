const CryptoJS = require("crypto-js");

class Block {
    constructor(index, hash, previoushash, timestamp, data) {
        this.index = index;
        this.hash = hash;
        this.previoushash = previoushash;
        this.timestamp = timestamp;
        this.data = data;
    }
}

const genesisBlock = new Block(
    0,
    "38BDBE092245287F0425AA8258240F9AAD47B059623BC2BD3D6207B84C5DCCF9", 
    null, 
    1526363336,
    "This is the genesis"
);

let blockchain = [genesisBlock];

const getLastBlock = () => blockchain[blockchain.length -1];

const getTimeStamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;

const createHash = (index, previoushash, timestamp, data) => 
CryptoJS.SHA256(
    index + previoushash + timestamp + JSON.stringify(data)
).toString();

const createNewBlock = data => {
    const previousBlock = getLastBlock();
    const newBlockIndex = previousBlock.index +1;
    const newTimestamp = getTimestamp();
    const newHash = createHash(
        newBlockIndex, 
        previousBlock.hash, 
        newTimestamp, 
        data
    );
    const newBlock = new Block(
        newBlockIndex,
        newHash,
        previousBlock.hash,
        newTimestamp,
        data
    );
    return newBlock;
};

const getBlocksHash  = (block) => createHash(block.index, block.previoushash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) => {
    if(!isNewStructureValid(candidateBlock)) {
        console.log("The candidate block structure is not valid");
        return false;
    }
    else if(latestBlock.index + 1 !== candidateBlock.index) {
        console.log('The candidate block doesnt have a valid index');
        return false;
    } else if(latestBlock.hash !== candidateBlock.previoushash) {
        console.log('The previoushash of the candidate block is not the hash of the latest block');
        return false;
    } else if(getBlocksHash(candidateBlock) !== candidateBlock.hash) {
        console.log("The hash of this block is invalid");
        return false;
    }
    return true;
};

const isNewStructureValid = (block) => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === 'string' && 
        typeof block.previoushash === 'string' && 
        typeof block.timestamp === 'number' &&
        typeof block.data === 'string'
    );
};

const isChainValid = (candidateChain) => {
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if(!isGenesisValid(candidateChain[0])){
        console.log("The candidate chain's genesisblock is not the same as our genesisblock");
        return false;             
    }
    for(let i = 1; i < candidateChain.length; i++) {
        if(!isNewBlockValid(candidateChain[i - 1])) {
            return false;
        } 
    }
    return true;
};

const replaceChain = newChain => {
    if(isChainValid(newChain) && newChain.length > getBlockchain().length) {
        blockchain = newChain;
        return true;
    } else {
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if(isNewBlockValid(candidateBlock, getLastBlock())) {
        getBlockchain().push(candidateBlock);
        return true;
    } else {
        return false;
    }
};
