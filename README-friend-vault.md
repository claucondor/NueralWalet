# Friend Vault - Shared Functionality for NeuralWallet

## Overview
Friend Vault is a feature that allows users to create and manage shared wallets (vaults) with friends and family. Each vault requires approval from all members to make withdrawals, providing an additional layer of security for shared funds.

## Implemented Components

### Main Screens
1. **FriendVaultScreen.tsx**: Main component that displays the list of vaults and handles navigation between screens.
2. **CreateVaultScreen.tsx**: Allows creation of a new vault by specifying name, description, and members.
3. **VaultDetailsScreen.tsx**: Shows the details of a specific vault, including balance, members, and withdrawal requests.
4. **DepositVaultScreen.tsx**: Interface for depositing funds into a vault.
5. **WithdrawVaultScreen.tsx**: Interface for requesting withdrawals from a vault, which will require approval.

### Integration
- A new "Vaults" tab has been added to the wallet's main screen.
- A dedicated route `/friend-vault` has been created to access the functionality.
- The `FriendVaultContext` has been implemented to handle the global state.

## Features

### Vault Management
- Create new vaults with multiple members
- View list of existing vaults
- View details of each vault (balance, members, history)

### Financial Operations
- Deposit funds into vaults
- Request withdrawals that require approval
- Vote to approve or reject withdrawal requests
- Execute approved withdrawals

### Approval System
- Any member can request a withdrawal
- All members must approve each request
- Funds are only released when everyone approves
- Any rejection cancels the request

## Security
- All withdrawals require multiple approvals
- A complete transaction history is maintained
- Operations are secured by the Stellar network
- A minimum reserve of 1 XLM is required in each vault

## Technologies Used
- React for the user interface
- Stellar SDK for blockchain operations
- Supabase for persistent storage
- Context API for state management

## Next Steps
- Implement notifications to alert members about new requests
- Add support for more tokens besides XLM
- Improve member management (add/remove)
- Implement customizable spending limits 