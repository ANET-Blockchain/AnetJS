const express = require("express"),
  _ = require("lodash"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  Blockchain = require("./blockchain"),
  P2P = require("./p2p"),
  Mempool = require("./mempool"),
  Wallet = require("./wallet");

const { getBlockchain, createNewBlock, getAccountBalance, sendTx, initBlockchain, getUTxOutList } = Blockchain;
const { startP2PServer, connectToPeers } = P2P;
const { initWallet, getPublicFromWallet } = Wallet;
const { getMempool } = Mempool;

const PORT = process.env.HTTP_PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));

app
  .route("/blocks")
  .get((req, res) => {
    res.send(getBlockchain());
  })
  .post((req, res) => {
    const newBlock = createNewBlock();
    res.send(newBlock);
  });

app.post("/peers", (req, res) => {
  const { body: { peer } } = req;
  connectToPeers(peer);
  res.send();
});

app.get("/balance", (req, res) => {
  const balance = getAccountBalance();
  res.send({ balance });
});

app.get("/balance/:address", (req, res) => {
  const { params: { address }} = req;
  const balance = getAccountBalance(address);
  res.send({balance});
});

app.get("/myaddress", (req, res) => {
  res.send(getPublicFromWallet());
});

app.get("/utxolist", (req, res) => {
  res.send(getUTxOutList());
});

app.get("/blocks/:hash", (req, res) => {
  const { params: { hash }} = req;
  const block = _.find(getBlockchain(), { hash });
  if(block === undefined) {
    res.status(400).send("Block not found");
  } else {
    res.send(block);
  }
});

app.get("/transactions/:id", (req, res) => {
  const tx = _(getBlockchain())
    .map(block => block.data)
    .flatten()
    .find({ id: req.params.id });

  if(tx === undefined) {
    res.status(400).send("Transaction not found");
  } else {
    res.send(tx);
  }
});



app
  .route("/transactions")
  .get((req, res) => {
    res.send(getMempool());
  })
  .post((req, res) => {
    try {
      const { body: { address, amount } } = req;
      if (address === undefined || amount === undefined) {
        throw Error("Please specify and address and an amount");
      } else {
        const resPonse = sendTx(address, amount);
        res.send(resPonse);
      }
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

const server = app.listen(PORT, () =>
  console.log(`HTTP Server running on port ${PORT}`)
);

initWallet();
initBlockchain();
startP2PServer(server);
