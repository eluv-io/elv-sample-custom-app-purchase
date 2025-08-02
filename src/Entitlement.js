const { ElvClient } = require("@eluvio/elv-client-js");

const networkName = "main"; // "demov3" or "main"
let client;

/* Sample dv3 configuration */
// let tenant = "iten4TXq2en3qtu3JREnE5tSLRf9zLod";
// let media_property = "goats-media-property";
// let permission_item = "prmoTWPcwpnjSkMRwK4fQs5TrH";


/* Sample main configuration */
let tenant = "iten34Y7Tzso2mRqhzZ6yJDZs2Sqf8L";
let media_property = "entitlement-sample";
let permission_item = "prmo7RbfTFK7vCqNssKcBAXBJ2";

/**
 * Generate a mint entitlement
 *
 * @param {string} tenant - tenant ID in 'iten' format
 * @param {string} media_property - media_property slug
 * @param {string} permission_item - permission_item of the item in 'prm__' format
 * @param {string} user - user ID in any format, usually the 'sub' of the id/access token; an email, username, address, etc.
 * @param {string} purchase_id - ID for the purchase, can be any string, but should be unique for each purchase
 * @returns {Promise<Object>} - the entitlement JSON and signature
 */
const Entitlement = async({tenant, media_property, permission_item, user, purchase_id}) => {
  const message = {
    id: "entitlement-" + purchase_id,
    gate: false,
    type: "entitlement",
    tenant_id: tenant,
    media_property: media_property,
    permissionItemIds: [permission_item],
    user: user,
    purchase_id: purchase_id,
    purchaseId: purchase_id,
  };
  let sig;
  try {
    sig = await client.CreateSignedMessageJSON({message: message});
  } catch (e) {
    console.error("ERROR signing", "message", m, "error", e);
  }

  return { entitlementJson: message, signature: sig };
};

async function GenerateEntitlement(tenant, media_property, permission_item, user, purchase_id) {
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
      await Entitlement({tenant, media_property, permission_item, user, purchase_id});
    console.log("ENTITLEMENT", entitlementJson);
    console.log("ENTITLEMENT_SIGNATURE", signature);

    return {entitlementJson, signature};

  } catch (e) {
    console.error("ERROR:", e);
    return {};
  }
}

async function GenerateDefaultEntitlement(user, purchaseId) {
  return GenerateEntitlement(tenant, media_property, permission_item, user, purchaseId);
}

function GetWalletItemPath(walletUrl) {
     return walletUrl + "/marketplace/" + media_property + "?p=";
}

module.exports = {
  Entitlement,
  GenerateEntitlement,
  GenerateDefaultEntitlement,
  GetWalletItemPath
};
