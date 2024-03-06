const express = require('express');
const bodyParser = require('body-parser');
const { ElvClient } = require("@eluvio/elv-client-js");
const fetch = require('node-fetch');
const { GenerateMintEntitlement } = require('./src/Entitlement');

const networkName = "demov3"; // or "main"
                                                      // localhost for dev; deployed use media-wallet-dv3.dev.app.eluv.io
const walletUrl = (networkName === "demov3") ? "https://elv-test.io:8090" : "https://media-wallet.dev.app.eluv.io";
// Sample configuration
const tenant = "iten4TXq2en3qtu3JREnE5tSLRf9zLod"; // paladin
const marketplace= "iq__2dXeKyUVhpcsd1RM6xaC1jdeZpyr"; // A Place for Goats

let entitlementJson, signature;
let code;

const port = process.env.PORT || 8081;
const host = '127.0.0.1';

const app = express();
app.use(express.static('src'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/login.html");
})

app.get('/app', (req, res) => {
  console.log("app req", req.url);
  console.log("app req.query", req.query);
  code = req.query.code;

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
      redirect_uri: 'http://' + host + ':' + port + '/app'
    })
  };
  //console.log("fetch options", options);

  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      //console.log('Ok:', data);
      console.log('Ok', data?.access_token?.length);
      const { access_token, id_token, refresh_token } = data;

      // TODO: update the client lib with the access token

    })
    .catch(error => console.error('Error:', error));

  res.sendFile(__dirname + "/app.html");
})

app.get('/goToWallet', async (req, res) => {

  // XXX this is just going straight to authd, as we do not yet have an endpoint to submit the entitlement to the wallet

  const tok = "acspjcT6NoP5Ldxdh6NFpLN6hJuobQXjnwUy8so4ime4nhvR2dSQcXTqbAtsy6Zstt1Gf57Sc5d4R537kDt6AkL5pkEQxjxLYSsTZ65s29JpLTE3RRqmnGU6C8YshrQj3rte2S4LUaiCp9JRME5UezA6b112FGmRBe69bM88AgoZ46dtxAUwodTcT6esqtJdDJEXLEqrPag32rmTkvKywU8aC3YMTTdNV1iANkUnrqEVtPfqhd2PcE3bnXFmzbK4TNe4SKAhB1ciFnnnu97j1SqcEXMXeFNuuEcm6fMaVgdsDRKUT";
  const url = `http://localhost:6546/wlt/act/${tenant}`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tok,
    },
    body: JSON.stringify({"op":"nft-claim-entitlement", "entitlement": entitlementJson, "signature": signature}),
  };
  console.log("goToWallet options", options);

  let resp = "";
  await fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log('Ok:', data);
      resp = JSON.stringify(data);
    })
    .catch(error => {
      console.error('Error:', error);
      resp = JSON.stringify(error);
    });

  console.log("goToWallet not yet redirecting to wallet", (walletUrl + "/marketplace/" + marketplace));
  //res.redirect(walletUrl + "/marketplace/" + marketplaceObjectId);

  // XXX
  res.send(`
      <html>
        <head>
          <title>Wallet</title>
          <link rel="stylesheet" type="text/css" href="/styles.css">
        </head>
        <body>
          <div class="container">
            <h3>Entitlement submitted to wallet (XXX authd)</h3>
            <p>Entitlement: ${JSON.stringify(entitlementJson)}</p>
            <p>Signature: ${signature}</p>
            <p>Response: ${resp}</p>
          </div>
          <div class="container">
            <a href="/">Return to login</a>
          </div>
        </body>
      </html>
    `);
});

app.post('/submitPurchaseId', async (req, res) => {
  const purchaseId = req.body.inputText || '';
  console.log("purchaseId", purchaseId);

  const e = await GenerateMintEntitlement(purchaseId);
  entitlementJson = e.entitlementJson;
  signature = e.signature;

  res.send(`
      <html>
        <head>
          <title>Entitlement</title>
          <link rel="stylesheet" type="text/css" href="/styles.css">
        </head>
        <body>
          <div class="container">
             <h3>Signed entitlement for the purchase</h3>
             <p>PurchaseId: ${purchaseId}</p>
             <p>Entitlement: ${JSON.stringify(entitlementJson)}</p>
             <p>Signature: ${signature}</p>
          </div>
          <div class="container">
              <a href="/goToWallet"><button>Go to item</button></a>
          </div>
          <div class="container">
              <a href="/">Return to login</a>
          </div>
        </body>
      </html>
      `);
});

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);
