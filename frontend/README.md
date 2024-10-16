# Fhenix 2 Factor Authentication

## Getting Started

Make sure the follwoing point

1.  Your docker comtainer should be up and running

```bash
cd .. && pnpm run localfhenix:start
```

2. Your program is compiled and deployed (If not please the folllwoing commands in the main repo)

```bash
pnpm run compile
pnpm run deploy
```

### Run the app

First, copy the example env to .env

```bash
cp .env.example .env
```

- WALLET_PRIMARY = Primary admin who is also teh deployer of the contract
- WALLET_SECONDARY = Secondary signer in 2 factor authentication
- WALLET_RANDOM_SERVICE = Random 3rd party service
- WALLET_PRIMARY_PRIVATE_KEY = Private key for primary admin

Second, run the development server:

```bash
pnpm dev
```

## Flow for the app

The flow is similar to that of main app

It is divided into three screens or routes or simplicity

1. **Register**: It registers teh secondary signer for teh admin
2. **Home**: Here we can request for login and after request gets approved, we can get the encrypted password and can decrypt it. We can also add services to whitelist andverify temperory password
3. **Approve**: Here, the secondary signer can approve the incoming request, it is also called approvers dashboard

```text
All the three apps are mutually exclusive to each other and do not share any state other than login state. which can be changed anytime.
```
