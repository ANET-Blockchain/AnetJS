const _ = require("lodash"),
  Transactions = require("./transactions"),
  level = require('level-browserify');

const { validateTx } = Transactions;

let mempool = [];

const getMempool = () => _.cloneDeep(mempool);

const getTxInsInPool = mempool => {
  return _(mempool)
    .map(tx => tx.txIns)
    .flatten()
    .value();
};

const isTxValidForPool = (tx, mempool) => {
  const txInsInPool = getTxInsInPool(mempool);

  const isTxInAlreadyInPool = (txIns, txIn) => {
    return _.find(txIns, txInInPool => {
      return (
        txIn.txOutIndex === txInInPool.txOutIndex &&
        txIn.txOutId === txInInPool.txOutId
      );
    });
  };

  for (const txIn of tx.txIns) {
    if (isTxInAlreadyInPool(txInsInPool, txIn)) {
      return false;
    }
  }
  return true;
};

const hasTxIn = (txIn, uTxOutList) => {
  const foundTxIn = uTxOutList.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);

  return foundTxIn !== undefined;
}

const updateMempool = (uTxOutList) => {
  const invalidTxs = [];

  for(const tx of mempool) {
    for(const txIn of tx.txIns) {
        if(!hasTxIn(txIn, uTxOutList)) {
          invalidTxs.push(tx);
          break;
        }
    }
  }

  if(invalidTxs.length > 0) {
    mempool = _.without(mempool, ...invalidTxs);
  }
};

const addToMempool = (tx, uTxOutList, bDBflag = true) => {
  if (!validateTx(tx, uTxOutList)) {
    throw Error("This tx is invalid. Will not add it to pool");
  } else if (!isTxValidForPool(tx, mempool)) {
    throw Error("This tx is not valid for the pool. Will not add it.");
  } else {
    mempool.push(tx);
    if(bDBflag) {
      addTxToDB(tx);
    }
  }
};

const addTxToDB = tx => {
  const db = level('./db/tx');

  var ops = [
    { type: 'put', key: tx.id, value: JSON.stringify(tx) }
  ];
  
  db.batch(ops, function (err) {
    if (err) return console.log('Error: ', err);
    console.log('Tx added to DB!');
  });
  db.close();
}

module.exports = {
  addToMempool,
  getMempool,
  updateMempool
};
