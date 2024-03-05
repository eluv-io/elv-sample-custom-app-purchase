
let purchaseButton = document.getElementById("purchase");
purchaseButton.addEventListener("click", purchase);

function purchase() {

    console.log("purcahse");
    var sku = document.getElementById("sku").value;

    // Purchase flow here
    // TODO

    purchaseResult.innerText = "Purchased product: " + sku;

}
