const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic"),
    utils = require("./utils");

const ec = new elliptic.ec("secp256k1");

class TxOut {
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }
}

class TxIn {
    // uTxOutId
    // uTxOutIndex
    // Signature
}

class Transaction {
    // ID
    // txIns[]
    // txOuts[]
}

class UTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.TxOutId = txOutId;
        this.TxOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

let uTxOuts = [];

const getTxId = tx => {
    const txInContent = tx.txIns
        .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, "");
    const txOutContent = tx.txOuts
        .map(txOut => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, "");
    return CryptoJS.SHA256(txUnContent + txOutContent).toString();
};

const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
    return uTxOutList.find(uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex);
}

const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;
    
    const referencedUTxOut = findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOuts);
    if(referencedUTxOut === null) {
        return;
    }
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = utils.toHexString(key.sign(dataToSign).toDER());
    return signature;
};

const updateUTxOuts = (newTxs, uTxOutList) => {
    
    // making new TxOut resulting from a new Tx
    const newUTxOuts = newTxs.map(tx => {
        tx.txOuts.map(
            (txOut, index) => {
                new UTxOut(tx.id, index, txOut.address, txOut.amount);
            });
    })
    .reduce((a, b) => a.concat(b), []);

    // emptying the spentTxOut
    const spentTxOuts = newTxs
        .map(tx => tx.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));

    // remove the spentTxOut and add the new TxOut
    const resultingUTxOuts = uTxOutList
        .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
        .concat(newUTxOuts);
};

const isTxInStructureValid = (txIn) => {
    if(txIn === null) {
        return false;
    } else if(typeof txIn.signature !== "string") {
        return false;
    } else if(typeof txIn.txOutId !== "string") {
        return false;
    } else if(typeof txIn.txOutIndex !== "number") {
        return false;
    } else {
        return true;
    }

}

const isAddressValid = address => {
    if(address.length !== 300) {
        return false;
    } else if(address.match("^[a-fA-F0-9]+$") === null) {
        return false;
    } else if(!address.startsWith("04")) {
        return false;
    } else {
        return true;
    }
}

const isTxOutStructureValid = (txOut) => {
    if(txOut === null) {
        return false;
    } else if(typeof txOut.address !== "string") {
        return false;
    } else if(!isAddressValid(txOut.address)) {
        return false;
    } else if(typeof txOut.amount !== "number") {
        return false;
    } else {
        return true;
    }
}

const isTxStructureValid = (tx) => {
    if(typeof tx.id !== "string") {
        console.log("Tx Id is not valid");
        return false;
    } else if(!(tx.txIns instanceof Array)) {
        console.log("txIns are not an array");
        return false;
    } else if(!tx.txIns.map(isTxInStructureValid).reduce((a, b) => a && b, true)) {
        console.log("structure of one of the txIns is not valid");
        return false;
    } else if(!(tx.txOuts instanceof Array)) {
        console.log("txOuts are not an array");
        return false;
    } else if(!tx.txOuts.map(isTxOutStructureValid).reduce((a, b) => a && b, true)) {
        console.log("structure of one of the txOuts is not valid");
        return false;
    } else {
        return true;
    }
}
