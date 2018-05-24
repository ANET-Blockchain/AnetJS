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