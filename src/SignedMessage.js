const { ElvClient } = require("@eluvio/elv-client-js");
const Utils = require("@eluvio/elv-client-js/src/Utils");

const SampleSignedMessageJSON = async ({}) => {

    const client = await ElvClient.FromNetworkName({networkName: "demov3"});
    let wallet = client.GenerateWallet();
    let signer = wallet.AddAccount({
      privateKey: process.env.PRIVATE_KEY
    });
    client.SetSigner({signer});

    const obj = {
        addr: "0x111",
        purchase_id: "1000",
        items: [
            {
                sku: "TEST",
                qty: 1
            }
        ]
    };

    const signedMessage = await CreateSignedMessageJSON({client, obj});
    console.log(`SIGNED MESSAGE\n${signedMessage}\n`);

    const res = await DecodeSignedMessageJSON({client, signedMessage});
    console.log(`DECODED MESSAGE\n${JSON.stringify(res, "", 2)}\n`);
}

// Create a signed JSON message
const CreateSignedMessageJSON = async ({
    client,
    obj,
}) => {

    // Only one kind of signature supported currently
    const type = "mje_" // JSON message, EIP192 signature
    const msg = JSON.stringify(obj);

    const signature = await client.PersonalSign({message: msg, addEthereumPrefix: true});
    return `${type}${Utils.B58(
      Buffer.concat([
        Buffer.from(signature.replace(/^0x/, ""), "hex"),
        Buffer.from(msg)
      ])
    )}`;
}

// Decode a signed JSON message
const DecodeSignedMessageJSON = async ({
    signedMessage
}) => {
    const type = signedMessage.slice(0,4);
    let res = {};
    switch(type) {
        case "mje_":
            const msgBytes = Utils.FromB58(signedMessage.slice(4));
            const signature = msgBytes.slice(0, 65);
            const msg = msgBytes.slice(65);
            const obj = JSON.parse(msg);
            res = {
                type: type,
                obj: obj,
                signature: "0x" + signature.toString("hex")
            }
            break;
        default:
            throw new Error(`Bad message type: ${type}`);
    }

    return res;
}

module.exports = {
    CreateSignedMessageJSON,
    DecodeSignedMessageJSON
}
