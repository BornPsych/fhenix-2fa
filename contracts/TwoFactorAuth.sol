// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

/**
 * @title TwoFactorAuth
 * @dev A smart contract for implementing a two-factor authentication (2FA) system.
 * This contract allows users to register, request login, approve login, and verify temporary passwords.
 */
contract TwoFactorAuth is Permissioned {
    uint256 public constant TIME_INTERVAL = 300; // 5 minutes
    uint256 public constant PASSWORD_VALIDITY_DURATION = 300; // 5 minutes

    struct AuthData {
        uint256 lastRequestTime; // Timestamp of the last login request
        address secondarySigner; // Address of the secondary signer
        bool isApproved; // Indicates if the login request is approved
        uint256 lastApprovalTime; // Timestamp of the last approval
        euint256 encryptedPassword; // Encrypted temporary password
        bytes32 userPublicKey; // Public key of the user for encryption
        bool passwordUsed; // Indicates if the temporary password has been used
        uint256 validUntil; // Timestamp until which the password is valid
    }

    mapping(address => AuthData) public authData; // Mapping of user addresses to their authentication data

    event Registered(address indexed user, address indexed secondarySigner); // Event emitted when a user registers
    event LoginRequested(address indexed user); // Event emitted when a login request is made
    event LoginApproved(address indexed user, address indexed secondarySigner); // Event emitted when a login is approved
    event PasswordVerified(address indexed user); // Event emitted when a password is verified

    /**
     * @dev Registers a user with a secondary signer and user public key.
     * @param _secondarySigner The address of the secondary signer.
     * @param _userPublicKey The public key of the user for encryption.
     */
    function register(address _secondarySigner, bytes32 _userPublicKey) external {
        require(_secondarySigner != address(0), "Invalid secondary signer address");
        require(
            _secondarySigner != msg.sender,
            "Secondary signer cannot be the same as the primary user"
        );
        authData[msg.sender] = AuthData({
            lastRequestTime: 0,
            secondarySigner: _secondarySigner,
            isApproved: false,
            lastApprovalTime: 0,
            encryptedPassword: FHE.asEuint256(0),
            userPublicKey: _userPublicKey,
            passwordUsed: false,
            validUntil: 0
        });

        emit Registered(msg.sender, _secondarySigner);
    }

    /**
     * @dev Requests a login, resetting the approval status.
     */
    function requestLogin() external {
        AuthData storage data = authData[msg.sender];
        require(data.secondarySigner != address(0), "User not registered");
        require(
            block.timestamp > data.lastRequestTime + TIME_INTERVAL || data.isApproved,
            "Previous login request still pending"
        );

        data.lastRequestTime = block.timestamp;
        data.isApproved = false;
        data.passwordUsed = false;

        emit LoginRequested(msg.sender);
    }

    /**
     * @dev Approves a login request from the secondary signer.
     * @param _user The address of the user requesting login.
     */
    function approveLogin(address _user) external {
        AuthData storage data = authData[_user];
        require(msg.sender == data.secondarySigner, "Not authorized");
        require(
            block.timestamp <= data.lastRequestTime + TIME_INTERVAL,
            "Time interval expired"
        );

        data.isApproved = true;
        data.lastApprovalTime = block.timestamp;
        data.passwordUsed = false;

        // Generate and encrypt a temporary password
        // Note: This is not a perfect way to generate a password as it's not completely random.
        // In a production environment, a more secure random number generation method should be used.
        uint256 tempPassword = uint256(
            keccak256(abi.encodePacked(_user, data.lastApprovalTime))
        );
        data.encryptedPassword = FHE.asEuint256(tempPassword);
        data.validUntil = block.timestamp + PASSWORD_VALIDITY_DURATION; // Set validity duration

        emit LoginApproved(_user, msg.sender);
    }

    /**
     * @dev Retrieves the encrypted password for a user.
     * @param _user The address of the user.
     * @param permission The permission object for access control.
     * @return encryptedPassword The sealed encrypted password.
     */
    function getEncryptedPassword(
        address _user,
        Permission memory permission
    ) external view onlySender(permission) returns (string memory encryptedPassword) {
        AuthData storage data = authData[_user];
        require(data.isApproved, "Login not approved");
        require(!data.passwordUsed, "Password has already been used");

        return data.encryptedPassword.seal(data.userPublicKey);
    }

    /**
     * @dev Verifies the temporary password for a user by a whitelisted service.
     * @param _user The address of the user.
     * @param encryptedTempPassword The encrypted temporary password provided by the service.
     * @param permission The permission object for access control.
     * @return True if the password is valid, false otherwise.
     */
    function verifyTempPassword(
        address _user,
        inEuint256 calldata encryptedTempPassword,
        Permission memory permission
    ) external onlySender(permission) returns (bool) {
        AuthData storage data = authData[_user];
        require(data.isApproved, "Login not approved");
        require(!data.passwordUsed, "Password has already been used");
        require(block.timestamp <= data.validUntil, "Password has expired"); // Check if the password is still valid

        // Decrypt the stored password
        uint256 storedPassword = FHE.decrypt(data.encryptedPassword);
        
        // Decrypt the provided temporary password
        uint256 providedPassword = FHE.decrypt(FHE.asEuint256(encryptedTempPassword));

        // Compare the decrypted passwords
        bool isValid = (providedPassword == storedPassword);

        if (isValid) {
            data.passwordUsed = true;
            emit PasswordVerified(_user);
        }

        return isValid;
    }
}
