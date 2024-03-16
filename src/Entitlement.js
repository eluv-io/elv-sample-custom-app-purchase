const { ElvClient } = require("@eluvio/elv-client-js");

const networkName = "main"; // "demov3" or "main"
let client;

/* Sample dv3 configuration */
// let tenant = "iten4TXq2en3qtu3JREnE5tSLRf9zLod";
// let marketplace = "iq__2dXeKyUVhpcsd1RM6xaC1jdeZpyr";
// let sku = "C9Zct19CoEAZYWug9tyavX";
// let amount = 1;

/* Sample main configuration */
let tenant = "iten34Y7Tzso2mRqhzZ6yJDZs2Sqf8L";
let marketplace = "iq__D3N77Nw1ATwZvasBNnjAQWeVLWV";
let sku = "5MmuT4t6RoJtrT9h1yTnos";
let amount = 1;

/**
 * Generate a mint entitlement
 *
 * @param {string} tenant - tenant ID in 'iten' format
 * @param {string} marketplace - marketplace object ID in 'iq__' format
 * @param {string} sku - SKU of the item
 * @param {number} amount - number of items of that SKU
 * @param {string} user - user ID in any format, usually the 'sub' of the id/access token; an email, username, address, etc.
 * @returns {Promise<Object>} - the entitlement JSON and signature
 */
const Entitlement = async({tenant, marketplace, sku, amount, user, purchaseId}) => {
  const message = {
    tenant_id: tenant,
    marketplace_id: marketplace,
    items: [ { sku: sku, amount: amount } ],
    user: user,
    purchase_id: purchaseId,
  };
  let sig;
  try {
    sig = await client.CreateSignedMessageJSON({message: message});
  } catch (e) {
    console.error("ERROR signing", "message", m, "error", e);
  }

  return { entitlementJson: message, signature: sig };
};

async function GenerateEntitlement(tenant, marketplace, sku, user, purchaseId) {
  try {
    // Initialize client using environment variable PRIVATE_KEY
    client = await ElvClient.FromNetworkName({networkName: networkName});

    let wallet = client.GenerateWallet();
    let signer = wallet.AddAccount({
      privateKey: process.env.PRIVATE_KEY
    });
    client.SetSigner({signer});
    client.ToggleLogging(false);
    console.log("SIGNER", client.CurrentAccountAddress());

    const { entitlementJson, signature } =
      await Entitlement({tenant, marketplace, sku, amount, user, purchaseId});
    console.log("ENTITLEMENT", entitlementJson);
    console.log("ENTITLEMENT_SIGNATURE", signature);

    return {entitlementJson, signature};

  } catch (e) {
    console.error("ERROR:", e);
    return {};
  }
}

async function GenerateDefaultEntitlement(user, purchaseId) {
  return GenerateEntitlement(tenant, marketplace, sku, user, purchaseId);
}

function GetWalletItemPath(walletUrl) {
     return walletUrl + "/marketplace/" + marketplace + "/store/" + sku + "?mid=" + marketplace;
}

module.exports = {
  Entitlement,
  GenerateEntitlement,
  GenerateDefaultEntitlement,
  GetWalletItemPath
};
