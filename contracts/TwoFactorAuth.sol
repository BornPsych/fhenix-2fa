// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Console} from "@fhenixprotocol/contracts/utils/debug/Console.sol";
import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

/**
 * @title TwoFactorAuth
 * @dev A smart contract for implementing a two-factor authentication (2FA) system.
 * This contract allows users to register, request login, approve login, and verify temporary passwords.
 */
contract TwoFactorAuth is Permissioned {
  // Constants for time intervals
  uint256 public constant TIME_INTERVAL = 300; // 5 minutes
  uint256 public constant PASSWORD_VALIDITY_DURATION = 300; // 5 minutes

  // Struct to hold authentication data for each user
  struct AuthData {
    uint256 lastRequestTime; // Timestamp of the last login request
    address secondarySigner; // Address of the secondary signer
    bool isApproved; // Indicates if the login request is approved
    uint256 lastApprovalTime; // Timestamp of the last approval
    euint256 encryptedPassword; // Encrypted temporary password
    bytes32 userPublicKey; // Public key of the user for encryption
    uint256 validUntil; // Timestamp until which the password is valid
    uint8 passwordAttempts; // Number of attempts to enter the password
    bool passwordUsed; // Indicates if the password has been used
  }

  // State variables
  address owner;
  mapping(address => AuthData) public authData; // Mapping of user addresses to their authentication data
  mapping(address => bool) public whitelistedServices; // Mapping of whitelisted services

  // Events
  event Registered(address indexed user, address indexed secondarySigner); // Emitted when a user registers
  event LoginRequested(address indexed user); // Emitted when a login request is made
  event LoginApproved(address indexed user, address indexed secondarySigner); // Emitted when a login is approved

  // Constructor to set the owner
  constructor(address _owner) Permissioned() {
    owner = _owner;
  }

  /**
   * @dev Registers a user with a secondary signer and user public key.
   * @param perm The permission object for access control.
   * @param _secondarySigner The address of the secondary signer.
   */
  function register(
    Permission calldata perm,
    address _secondarySigner
  ) external onlySender(perm) {
    require(_secondarySigner != address(0), "Invalid secondary signer address");
    require(
      _secondarySigner != msg.sender,
      "Secondary signer cannot be the same as the primary user"
    );

    // Store authentication data for the user
    authData[msg.sender] = AuthData({
      lastRequestTime: 0,
      secondarySigner: _secondarySigner,
      isApproved: false,
      lastApprovalTime: 0,
      encryptedPassword: FHE.asEuint256(0),
      userPublicKey: perm.publicKey,
      validUntil: 0,
      passwordAttempts: 0,
      passwordUsed: false
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

    // Update request time and reset approval status
    data.lastRequestTime = block.timestamp;
    data.isApproved = false;
    data.passwordAttempts = 0;
    data.passwordUsed = false;

    emit LoginRequested(msg.sender);
  }

  /**
   * @dev Approves a login request from the secondary signer.
   * @param _user The address of the user requesting login.
   */
  function approveLogin(
    address _user,
    inEuint256 calldata _tempPassword
  ) external {
    AuthData storage data = authData[_user];
    require(msg.sender == data.secondarySigner, "Not authorized");
    require(
      block.timestamp <= data.lastRequestTime + TIME_INTERVAL,
      "Time interval expired"
    );

    // Update approval status and generate a temporary password
    data.isApproved = true;
    data.lastApprovalTime = block.timestamp;

    data.encryptedPassword = FHE.asEuint256(_tempPassword);
    data.validUntil = block.timestamp + PASSWORD_VALIDITY_DURATION; // Set validity duration

    emit LoginApproved(_user, msg.sender);
  }

  /**
   * @dev Retrieves the encrypted password for a user.
   * @return encryptedPassword The sealed encrypted password.
   */
  function getEncryptedPassword()
    external
    view
    returns (string memory encryptedPassword)
  {
    AuthData storage data = authData[msg.sender];

    // Check if the user is registered and approved
    require(data.secondarySigner != address(0), "User not registered");
    require(data.isApproved, "Login not approved");

    return data.encryptedPassword.seal(data.userPublicKey);
  }

  /**
   * @dev Verifies the temporary password for a user by a whitelisted service.
   * @param perm The permission object for access control.
   * @param _service The address of the service verifying the password.
   * @param _user The address of the user.
   * @param _encryptedTempPassword The encrypted temporary password provided by the service.
   * @return True if the password is valid, false otherwise.
   */
  function verifyTempPassword(
    Permission calldata perm,
    address _service,
    address _user,
    inEuint256 calldata _encryptedTempPassword
  ) external onlyPermitted(perm, _service) returns (bool) {
    require(whitelistedServices[_service], "Service not whitelisted"); // Check if the service is whitelisted

    AuthData storage data = authData[_user];
    require(data.isApproved, "Login not approved");
    require(block.timestamp <= data.validUntil, "Password has expired"); // Check if the password is still valid
    require(!data.passwordUsed, "Password has been used"); // Check if the password has been used too many times
    require(data.passwordAttempts < 3, "Too many attempts"); // Check if the password has been used too many times

    // Compare the decrypted passwords
    euint256 encryptedTempPassword = FHE.asEuint256(_encryptedTempPassword);
    ebool encryptedIsValid = FHE.eq(
      encryptedTempPassword,
      data.encryptedPassword
    );
    bool isValid = FHE.decrypt(encryptedIsValid);

    if (!isValid) {
      data.passwordUsed = true;
      data.passwordAttempts = 0;
    } else {
      data.passwordAttempts++;
    }

    return isValid;
  }

  /**
   * @dev Adds a service to the whitelist.
   * @param perm The permission object for access control.
   * @param service The address of the service to be added.
   */
  function addServiceToWhitelist(
    Permission calldata perm,
    address service
  ) external onlyPermitted(perm, owner) {
    whitelistedServices[service] = true;
  }

  /**
   * @dev Removes a service from the whitelist.
   * @param perm The permission object for access control.
   * @param service The address of the service to be removed.
   */
  function removeServiceFromWhitelist(
    Permission calldata perm,
    address service
  ) external onlyPermitted(perm, owner) {
    whitelistedServices[service] = false;
  }
}
