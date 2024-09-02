# Fhenix Two-Factor Authentication (2FA) Example [![Open in Gitpod][gitpod-badge]][gitpod]

[gitpod]: https://gitpod.io/#https://github.com/fhenixprotocol/fhenix-hardhat-example
[gitpod-badge]: https://img.shields.io/badge/Gitpod-Open%20in%20Gitpod-FFB45B?logo=gitpod

This repository contains a Two-Factor Authentication (2FA) smart contract example built using the Fhenix framework. This project serves as a demonstration of how to implement a secure 2FA mechanism for decentralized applications.

## Features

- **User Registration**: Users can register with a secondary signer and a public key.
- **Login Requests**: Users can request login, which requires approval from the secondary signer.
- **Temporary Password Generation**: A secure temporary password is generated and encrypted for each login request.
- **Password Verification**: The temporary password can be verified, and it is invalidated after use.

## Quick Start

To get started with this project, clone the repository and install its dependencies:
