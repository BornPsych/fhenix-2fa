# Two-Factor Authentication (2FA) Smart Contract

## Overview

This project implements a Two-Factor Authentication (2FA) system using smart contracts on the Fhenix FHE blockchain. The contract allows users to register with a secondary signer, request login approvals, and verify temporary passwords securely. The system enhances security by requiring a secondary signer to approve login requests, making unauthorized access significantly more difficult.

## Features

- **User Registration**: Users can register with a secondary signer.
- **Login Requests**: Users can request a login, which resets their approval status.
- **Login Approval**: Secondary signers can approve login requests, generating a temporary password.
- **Password Verification**: Whitelisted services can verify the temporary password for users.
- **Service Whitelisting**: Admins can add or remove services from a whitelist to control which services can verify passwords.

## Smart Contract Structure

### Key Components

- **AuthData Struct**: Holds authentication data for each user, including the secondary signer, approval status, and encrypted password.
- **Events**: Emits events for registration, login requests, approvals, and password verifications.
- **Functions**:
  - `register`: Registers a user with a secondary signer.
  - `requestLogin`: Allows users to request a login.
  - `approveLogin`: Approves a login request from the secondary signer.
  - `getEncryptedPassword`: Retrieves the encrypted password for a user.
  - `verifyTempPassword`: Verifies the temporary password provided by a whitelisted service.
  - `addServiceToWhitelist`: Adds a service to the whitelist.
  - `removeServiceFromWhitelist`: Removes a service from the whitelist.

## Prerequisites

- Node.js (v14 or later)
- Hardhat
- FhenixJS library for encryption and decryption

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/shreyas-londhe/fhenix-2fa.git
   cd fhenix-2fa
   ```

2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Next, you need to create a `.env` file containing your mnemonics or keys. You can use the provided `.env.example` file that comes with a predefined mnemonic, or you can create your own.

   ```sh
   cp .env.example .env
   ```

4. Once the `.env` file exists, you can run a LocalFhenix instance:

   ```sh
   pnpm localfhenix:start
   ```

   This command will start a LocalFhenix instance in a Docker container. If successful, you should see a message indicating `Started LocalFhenix successfully` in your console.

   If you encounter any issues, please ensure that you have Docker installed and running on your machine. You can find instructions on how to install Docker [here](https://docs.docker.com/get-docker/).

## Testing the Contract

To run the tests for the Two-Factor Authentication contract, follow these steps after setting up the local Fhenix instance:

**Run the Tests**:

```bash
pnpm test
```

This command will execute the tests defined in the `test/TwoFactorAuth/behavior.ts` file. The tests cover the following scenarios:

- User registration with a secondary signer.
- Login request functionality.
- Approval of login requests by the secondary signer.
- Retrieval of the encrypted password.
- Adding a service to the whitelist.
- Verifying the temporary password using a whitelisted service.

**Check the Output**: Ensure all tests pass successfully. If any tests fail, review the error messages for debugging.

## Usage

Once the contract is deployed, you can interact with it using a frontend application or directly through Hardhat scripts. The contract functions can be called to register users, request logins, approve logins, and verify passwords as needed.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.
