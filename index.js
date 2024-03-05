const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { ElvClient } = require("@eluvio/elv-client-js");
const bs58 = require("bs58");
const fetch = require('node-fetch');

let client;
let code, scope, state;

/* Sample configuration */
let tenant = "iten4TXq2en3qtu3JREnE5tSLRf9zLod"; // paladin
let marketplaceObjectId = "iq__2dXeKyUVhpcsd1RM6xaC1jdeZpyr"; // A Place for Goats
let sku = "C9Zct19CoEAZYWug9tyavX"; // Goat Pack One
let amount = 1;
let nonce = "nonce_6f9f53ecc09a7e223cf7d47f";

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

app.get('/ory', (req, res) => {
  console.log("ory req", req.url);
  console.log("ory req.query", req.query);
  res.send("ory");
});

app.post('/submitPurchaseId', async (req, res) => {
  const purchaseId = req.body.inputText || '';
  console.log("purchaseId", purchaseId);

  const { entitlementJson, signature } = await generateMintEntitlement(purchaseId);

  res.send(`
        <html>
        <head>
          <title>Entitlement</title>
          <link rel="stylesheet" type="text/css" href="/styles.css">
        </head>
        <body>
          <div class="container">
            <h3>Entitlement</h3>
              <p>PurchaseId: ${purchaseId}</p>
              <p>Entitlement: ${JSON.stringify(entitlementJson)}</p>
              <p>Signature: ${signature}</p>
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



/**
 * Generate a mint entitlement
 *
 * @param {string} tenant - tenant ID in 'iten' format
 * @param {string} marketplaceObjectId - marketplace object ID in 'iq__' format
 * @param {string} sku - SKU of the item
 * @param {number} amount - number of items of that SKU
 * @returns {Promise<Object>} - the entitlement JSON and signature
 */
const Entitlement = async({tenant, marketplaceObjectId, sku, amount, nonce, purchaseId}) => {
  const message = {
    tenant_id: tenant,
    marketplace_id: marketplaceObjectId,
    items: [ { sku: sku, amount: amount } ],
    nonce: nonce,
    purchase_id: purchaseId,
  };

  const jsonString = JSON.stringify(message);
  console.log("ENTITLEMENT TO SIGN", jsonString);
  const sig = await client.Sign(jsonString);

  return { entitlementJson: message, signature: sig };
};


async function generateMintEntitlement(purchaseId) {
  try {
    // Initialize client using environment variable PRIVATE_KEY
    client = await ElvClient.FromNetworkName({networkName: "demov3"});

    let wallet = client.GenerateWallet();
    let signer = wallet.AddAccount({
      privateKey: process.env.PRIVATE_KEY
    });
    client.SetSigner({signer});
    client.ToggleLogging(false);
    console.log("SIGNER", client.CurrentAccountAddress());

    tenant = process.argv[2] ?? tenant;
    marketplaceObjectId = process.argv[3] ?? marketplaceObjectId;
    sku = process.argv[4] ?? sku;
    if (process.argv[5]) { amount = parseInt(process.argv[5]); };
    nonce = process.argv[6] ?? nonce;
    purchaseId = process.argv[7] ?? purchaseId;

    const { entitlementJson, signature } =
      await Entitlement({tenant, marketplaceObjectId, sku, amount, nonce, purchaseId});
    console.log("ENTITLEMENT", entitlementJson);
    console.log("ENTITLEMENT_SIGNATURE", signature);

    return {entitlementJson, signature};

  } catch (e) {
    console.error("ERROR:", e);
    return {};
  }
}
