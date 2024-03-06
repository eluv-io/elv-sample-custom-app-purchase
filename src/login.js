

let baseUrl = "https://frosty-sanderson-jl1xbi88ik.projects.oryapis.com/oauth2/auth?audience=https%3A%2F%2Fwltd.stg.svc.eluv.io&client_id=57c24a6c-0954-411b-849c-2e89a33991da&max_age=0&prompt=&redirect_uri=http%3A%2F%2F127.0.0.1%3A8081%2Fapp&response_type=code&scope=openid";

const nonce = "0001-0002-0003";
const state = "SAMPLE-0001-0002";

const loginUrl = `${baseUrl}&nonce=${nonce}&state=${state}`;

var login = document.getElementById("login");
login.href = loginUrl;
