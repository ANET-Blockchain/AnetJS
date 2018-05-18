const CryptoJS = require("crypto-js"),
    hexToBinary = require("hex-to-binary");

// interval in minutes
const BLOCK_GENERATION_INTERVAL = 10;
// number of blocks to be generated before adjusting difficulty
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {
    constructor(index, hash, previoushash, timestamp, data, difficulty, nonce) {
        this.index = index;
        this.hash = hash;
        this.previoushash = previoushash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

const genesisBlock = new Block(
    0,
    "38BDBE092245287F0425AA8258240F9AAD47B059623BC2BD3D6207B84C5DCCF9", 
    "", 
    1526363336,
    "This is the genesis",
    0,
    0
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length -1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;

const createHash = (index, previoushash, timestamp, data, difficulty, nonce) => 
CryptoJS.SHA256(
    index + previoushash + timestamp + JSON.stringify(data) + difficulty + nonce
).toString();


const createNewBlock = data => {
    const previousBlock = getNewestBlock();
    const newBlockIndex = previousBlock.index +1;
    const newTimestamp = getTimestamp();
    const difficulty = findDifficulty(getBlockchain());
    const newBlock = findBlock(
        newBlockIndex,
        previousBlock.hash,
        newTimestamp,
        data,
        difficulty
    );
    addBlockToChain(newBlock);
    return newBlock;
};

const findDifficulty = blockchain => {
    const newestBlock = blockchain[blockchain.length - 1];
    if(newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && 
        newestBlock.index !== 0) {
        // calculate new difficulty
        return calculateNewDifficulty(newestBlock, getBlockchain());
    } else {
        return newestBlock.difficulty;
    } 
};

const calculateNewDifficulty = (newestBlock, blockchain) => {
    const lastCalculatedBlock = blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;
    if(timeTaken < timeExpected/2) {
        return lastCalculatedBlock.difficulty + 1;
    } else if(timeTaken > timeExpected * 2) {
        return lastCalculatedBlock.difficulty - 1;
    } else {
        return lastCalculatedBlock.difficulty;
    }
};

const findBlock = (index, previoushash, timestamp, data, difficulty) => {
    let nonce = 0;
    
    while(true) {
        console.log("current nonce:", nonce);
        const hash = createHash(index, previoushash, timestamp, data, difficulty, nonce);
        
        if(hashMatchesDifficulty(hash, difficulty)) {
            return new Block(index, hash, previoushash, timestamp, data, difficulty, nonce);            
        } else {
            nonce++;
        }
    }
};

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty);
    console.log("Trying difficulty:", difficulty, "with hash:", hashInBinary);
    return hashInBinary.startsWith(requiredZeros);
};

const getBlocksHash  = (block) => createHash(block.index, block.previoushash, block.timestamp, block.data, block.difficulty, block.nonce);

const isTimestampValid = (newBlock, oldBlock) => {
    return (
        oldBlock.timestamp - 60 < newBlock.timestamp && 
        newBlock.timestamp - 60 < getTimestamp()
    );
}

const isBlockValid = (candidateBlock, latestBlock) => {
    if(!isBlockStructureValid(candidateBlock)) {
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
    } else if(!isTimestampValid(candidateBlock, latestBlock)) {
        console.log("The timestamp of this block is invalid");
        return false;
    }
    return true;
};

const isBlockStructureValid = (block) => {
    //console.log("index: "+typeof block.index);
    //console.log("hash: "+typeof block.hash);
    //console.log("previoushash: "+typeof block.previoushash);
    //console.log("timestamp: "+typeof block.timestamp);
    //console.log("data: "+typeof block.data);
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
        const currentBlock = candidateChain[i];
        if(!isBlockValid(currentBlock, candidateChain[i - 1])) {
            return false;
        } 
    }
    return true;
};

const sumDifficulty = blockchain => blockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);

const replaceChain = candidateChain => {
    if(isChainValid(candidateChain) && sumDifficulty(candidateChain) > sumDifficulty(getBlockchain())) {
        blockchain = candidateChain;
        return true;
    } else {
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if(isBlockValid(candidateBlock, getNewestBlock())) {
        getBlockchain().push(candidateBlock);
        require("./p2p").broadcastNewBlock();
        return true;
    } else {
        return false;
    }
};

module.exports = {
    getNewestBlock,
    getBlockchain,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain,
    getBlockchain, 
    createNewBlock
};
