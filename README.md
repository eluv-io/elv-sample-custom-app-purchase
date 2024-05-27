# elv-sample-custom-app-purchase
Sample app illustrating custom auth and media wallet entitlement flows

https://appsvc.svc.eluv.io/sample-purchase/

## Overview

Install with:

```bash
npm install
```

Run with:

```bash
export PRIVATE_KEY=0x111...     # The purchasing/entitlement authority's key, not a user key
export SERVICE_URL=https://...  # The base url where this is deployed, for use in callbacks
node index.js
```

and then open your browser to `http://localhost:8081`.
