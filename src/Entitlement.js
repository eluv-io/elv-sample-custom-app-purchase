const fs = require('fs');
const { ElvClient } = require("@eluvio/elv-client-js");
const bs58 = require("bs58");
const { CreateSignedMessageJSON } = require("./SignedMessage");


const networkName = "demov3"; // or "main"

let client;
/* Sample configuration */
let tenant = "iten4TXq2en3qtu3JREnE5tSLRf9zLod"; // paladin
let marketplaceObjectId = "iq__2dXeKyUVhpcsd1RM6xaC1jdeZpyr"; // A Place for Goats
let sku = "C9Zct19CoEAZYWug9tyavX"; // Goat Pack One
let amount = 1;
let nonce = "nonce_6f9f53ecc09a7e223cf7d47f";


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
  const sig = await CreateSignedMessageJSON({client, obj: message});

  return { entitlementJson: message, signature: sig };
};


async function GenerateMintEntitlement(purchaseId) {
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

module.exports = {
  Entitlement,
  GenerateMintEntitlement
};
