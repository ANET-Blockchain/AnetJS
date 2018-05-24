const _ = require("lodash"),
    Transactions = require("./transactions");

const { validateTx } = Transactions;

let memPool = [];