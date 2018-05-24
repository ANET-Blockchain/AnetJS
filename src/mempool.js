const _ = require("lodash"),
    Transactions = require("./transactions");

const { validateTx } = Transactions;

let memPool = [];

const getTxInPool = memPool => {
    return _(memPool).map(tx => tx.Ins).flatten().value();
};

const isTxValidForPool = (tx, memPool) => {
    const txInsInPool = getTxInPool(memPool);
    const isTxInAlreadyInPool = (txIns, txIn) => {
        return _.find(txIns, txInsInPool => {
            return (
                txIn.txOutIndex === txInsInPool.txOutIndex &&
                txIn.txOutId === txInsInPool.txOutId
            );
        });
    }

    for (const txIn of tx.txIns) {
        if(isTxInAlreadyInPool(txInsInPool, txIn)) {
            return false;
        }
    }
    return true;
};

const addToMemPool = (tx, uTxOutList) => {
    if(!validateTx(tx, uTxOutList)) {
        throw Error("This tx is invalid. It will not be added to the pool");
    } else if(!isTxValidForPool(tx, memPool)) {
        throw Error("This tx is not valid for pool. It will not be added to the pool");
    }
    memPool.push(tx);
}

module.exports = {
    addToMemPool
}