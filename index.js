const express = require('express');
const bodyParser = require('body-parser');
const { ElvClient } = require("@eluvio/elv-client-js");
const { Utils } = require("@eluvio/elv-client-js/src/Utils");
const fetch = require('node-fetch');
const { GenerateEntitlement, GenerateDefaultEntitlement, GetWalletItemPath } = require('./src/Entitlement');

const networkName = "main"; // "main" or "demov3"
const walletUrl = (networkName === "demov3") ? "https://media-wallet-dv3.dev.app.eluv.io" : "https://media-wallet.dev.app.eluv.io";

let entitlementJson, signature;
let code; // oauth callback "code", which is exchanged to get the access token
let idToken; // id token from the oauth2/token endpoint that accepts "code"
let user; // user id extracted from the decoded accesssToken 'sub' field

const port = process.env.PORT || 8081;
const host = '127.0.0.1';

let serviceUrl;
const app = express();
app.use(express.static('src'));
app.use(express.static('public'));
// form encoding by default
app.use(bodyParser.urlencoded({ extended: false }));
// json for this endpoint
app.use("/gen-entitlement", bodyParser.json());

app.get('/', (req, res) => {

  let baseUrl = "https://ory.svc.contentfabric.io/oauth2/auth?" +
    "audience=https%3A%2F%2Fwltd.stg.svc.eluv.io&client_id=57c24a6c-0954-411b-849c-2e89a33991da&max_age=0&prompt=&redirect_uri=" +
    encodeURIComponent(serviceUrl) + "%2Fapp&response_type=code&scope=openid";
  const nonce = "0001-0002-0003";
  const state = "SAMPLE-0001-0002";

  const loginUrl = baseUrl + "&nonce=" + nonce + "&state=" + state;

  console.log("loginUrl", loginUrl);
  res.send(`
  <html>
    <head>
      <title>Login</title>
      <link rel="stylesheet" type="text/css" href="styles.css">
    </head>
    <body>
      <div class="container">
        <a href="" id="login">Log In via Third Party Provider</a>
      </div>
      <div class="container">
        <a href="` + GetWalletItemPath(walletUrl) + `" id="login">Log In via Media Wallet</a>
      </div>
    </body>

    <script>
      const login = document.getElementById("login");
      login.href = "` + loginUrl + `";
    </script>
  </html> `);
});

app.get('/app', (req, res) => {
  console.log("login callback req.query", req.query);
  code = req.query.code;

  const url = "https://ory.svc.contentfabric.io/oauth2/auth?" +
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
      redirect_uri: serviceUrl + '/app',
    })
  };
  console.log("fetch options", options);

  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      const { access_token, id_token, refresh_token } = data;
      console.log('Success:', data);
      idToken = id_token;

      // update the user from the id token
      const second = id_token.split('.')[1] + "=";
      const decoded = Buffer.from(second, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      parsed.amr = []; // just to avoid logging this
      console.log('Ok, decoded id_token', parsed);
      user = parsed.sub;
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
      res.send(body.replaceAll("{{idToken}}", idToken));
    });

  let body = `
  <html>
    <head>
      <title>App</title>
      <link rel="stylesheet" type="text/css" href="styles.css">
      <script>
        function showHide() {
          const x = document.getElementById("token");
          if (x.style.display === "none") {
            x.style.display = "block";
          } else {
            x.style.display = "none";
          }
        }
      </script>
    </head>
    <body>
      <div class="container">
        <h1>Welcome!</h1>
        <p>
          <h3>Create Entitlement</h3>
          <p>Enter a product purchase ID:</p>
          <form action="submitPurchaseId" method="post">
            <input type="text" name="inputText" placeholder="Type something..." required>
            <button type="submit">Create entitlement</button>
          </form>
        </p>
      </div>
      <div class="container">
        <button onclick="showHide();">Show/Hide ID token</button>
        <div id="token" style="display: none">
          <p><b>ID token:</b> {{idToken}} </p>
        </div>
      </div>
      <div class="container">
        <p></p><a href="` + serviceUrl + `">Return to login</a></p>
      </div>
    </body>
  </html>`;
})

app.get('/entitle', (req, res) => {
  res.send(`
  <html>
    <head>
      <title>App</title>
      <link rel="stylesheet" type="text/css" href="styles.css">
    </head>
    <body>
      <div class="container">
        <h1>Welcome!</h1>
        <p>
          <h3>Create Entitlement</h3>
          <p>Enter a product purchase ID:</p>
          <form action="submitPurchaseId" method="post">
            <input type="text" name="inputText" placeholder="Type something..." required>
            <button type="submit">Create entitlement</button>
          </form>
        </p>
      </div>
          <div class="container">
            <p></p><a href="` + serviceUrl + `">Return to login</a></p>
          </div>
    </body>
  </html>`);
});

app.get('/goToWallet', async (req, res) => {
  const client = await ElvClient.FromNetworkName({networkName: networkName});
  const decode = await client.DecodeSignedMessageJSON({signedMessage: signature});
  decode?.message && console.log("EntitlementClaim message: " + JSON.stringify(decode.message));
  const {tenant_id, marketplace_id, items, user, purchase_id} = decode?.message;
  const sku = items[0].sku;

  // ?auth=<B64("{ idToken: <token>, signerURIs: <?>, user: { email: <email> } }")>
  const authInfo = {
    idToken: idToken,
    signerURIs: "https://wlt.stg.svc.eluv.io",
    user: { email: user }
  };
  const b64 = Buffer.from(JSON.stringify(authInfo)).toString('base64');

  const redirect = walletUrl + "/marketplace/" + marketplace_id + "/store/" + sku + "/entitle/" + signature + "?auth=" + b64
  console.log("goToWallet redirect", redirect);

  // this res.redirect is not working on the deployed version, so, we are using the meta refresh
  //res.redirect(redirect);
  res.send(`
  <html>
    <head> <meta http-equiv='refresh' content='0; URL=` + redirect +`'> </head>
    <body> <p>Redirecting to Media Wallet...</p>
           <p><a href="` + redirect + `">Redirect link</a></p>
           <p><a href="` + serviceUrl + `">Return to login</a></p>
    </body>
  </html>`);
});

app.post('/gen-entitlement', async (req, res) => {
  console.log("gen-entitlement", req.body)
  let { tenant_id, marketplace_id, sku, purchase_id } = req.body;

  let user;
  const authToken = req.headers.authorization;
  if (authToken) {
    try {
      const tok = authToken.split(' ')[1];
      const client = await ElvClient.FromNetworkName({networkName: networkName});
      user = client.utils.DecodeSignedToken(tok)?.payload?.adr;
    } catch (e) {
      console.error("Error decoding token", e);
      res.send({"error": "Error decoding token"});
      return;
    }
  } else {
    res.send({ "error": "No token" });
    return;
  }

  const e = await GenerateEntitlement(tenant_id, marketplace_id, sku, user, purchase_id);
  entitlementJson = e.entitlementJson;
  signature = e.signature;

  res.send({ "entitlement": entitlementJson, signature });
});

app.post('/submitPurchaseId', async (req, res) => {
  const purchaseId = req.body.inputText || '';
  console.log("purchaseId", purchaseId);

  const e = await GenerateDefaultEntitlement(user, purchaseId);
  entitlementJson = e.entitlementJson;
  signature = e.signature;

  res.send(`
      <html>
        <head>
          <title>Entitlement</title>
          <link rel="stylesheet" type="text/css" href="styles.css">
        </head>
        <body>
          <div class="container">
             <h3>Signed entitlement for the purchase</h3>
             <p>PurchaseId: ${purchaseId}</p>
             <p>Entitlement: ${JSON.stringify(entitlementJson)}</p>
             <p>Signature: ${signature}</p>
          </div>
          <div class="container">
              <a href="goToWallet"><button>Go to item in media wallet</button></a>
          </div>
          <div class="container">
            <p></p><a href="entitle">Change entitlement</a></p>
            <p></p><a href="` + serviceUrl + `">Return to login</a></p>
          </div>
        </body>
      </html>`);
});

serviceUrl = 'http://' + host + ':' + port;
if (process.env.SERVICE_URL != "") {
  serviceUrl = process.env.SERVICE_URL;
  serviceUrl = serviceUrl.replace(/\/$/, "");
}

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);
console.log("SERVICE_URL", process.env.SERVICE_URL);
console.log("walletUrl", walletUrl);
if (!process.env.PRIVATE_KEY) {
  console.log("missing PRIVATE_KEY");
}

