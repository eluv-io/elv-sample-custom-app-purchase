const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { ElvClient } = require("@eluvio/elv-client-js");
const bs58 = require("bs58");
const fetch = require('node-fetch');
const { GenerateMintEntitlement } = require('./src/Entitlement');

const networkName = "demov3"; // or "main"
// this is using localhost for demov3 dev; a deployed demov3 wallet is: https://media-wallet-dv3.dev.app.eluv.io
const walletUrl = (networkName === "main") ? "https://media-wallet.dev.app.eluv.io" : "https://elv-test.io:8090";

let marketplaceObjectId = "iq__2dXeKyUVhpcsd1RM6xaC1jdeZpyr"; // A Place for Goats

let client;
let code, scope, state;

const port = process.env.PORT || 8080;
const host = '127.0.0.1';

const app = express();
app.use(express.static('src'));
app.use(express.static('public'));
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/login.html");
})

app.get('/app', (req, res) => {
  console.log("app req", req.url);
  console.log("app req.query", req.query);
  code = req.query.code;
  scope = req.query.scope;
  state = req.query.state;

  const url = "https://frosty-sanderson-jl1xbi88ik.projects.oryapis.com/oauth2/token";
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: '57c24a6c-0954-411b-849c-2e89a33991da',
      code: code,
      audience: 'https://wltd.svc.eluv.io',
      redirect_uri: 'http://127.0.0.1:8080/app'
    })
  };
  console.log("fetch options", options);

  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log('Ok:', data);
      const { access_token, id_token, refresh_token } = data;

    })
    .catch(error => console.error('Error:', error));

  res.sendFile(__dirname + "/app.html");
})

app.get('/goToWallet', (req, res) => {
  console.log("goToWallet req", req.url);
  console.log("goToWallet req.query", req.query);

  res.redirect(walletUrl + "/marketplace/" + marketplaceObjectId);
});

app.post('/submitPurchaseId', async (req, res) => {
  const purchaseId = req.body.inputText || '';
  console.log("purchaseId", purchaseId);


  const { entitlementJson, signature } = await GenerateMintEntitlement(purchaseId);

  res.send(`
      <html>
        <head>
          <title>Entitlement</title>
          <link rel="stylesheet" type="text/css" href="/styles.css">
        </head>
        <body>
          <div class="container">
            <h3>This is the signed Entitlement for the purchase</h3>
              <p>PurchaseId: ${purchaseId}</p>
              <p>Entitlement: ${JSON.stringify(entitlementJson)}</p>
              <p>Signature: ${signature}</p>
           </div>
           <div class="container">
              <a href="/goToWallet">Go to media wallet to mint (if needed) and display the item</a>
            </div>
           <div class="container">
              <a href="/app">Buy another</a>
            </div>
        </body>
      </html>
    `);
});

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);
