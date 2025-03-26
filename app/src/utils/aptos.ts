import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk"; //esto es aptos

// Initialize the Aptos SDK with Devnet configuration
//esto es aptos
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

/**
 * Create an Aptos account from a private key
 * @param privateKey - The private key from Web3Auth
 * @returns The Aptos account and address
 */
//esto es aptos
export const getAptosAccount = (privateKey: string, legacy: boolean = true) => {
    
    // Convert hex string to Uint8Array
    const privateKeyUint8Array = new Uint8Array(
      privateKey.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
    );
    
    // Create Ed25519PrivateKey from Uint8Array
    //esto es aptos
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKeyUint8Array);
    
    // Create Aptos account from private key with specified scheme
    // Legacy = true ensures backwards compatibility with previous address derivation
    //esto es aptos
    const aptosAccount = Account.fromPrivateKey({ 
      privateKey: ed25519PrivateKey,
      legacy
    });
    const aptosAccountAddress = aptosAccount.accountAddress.toString();
    
    return { aptosAccount, aptosAccountAddress };
  };

/**
 * Get the balance of an Aptos account
 * @param accountAddress - The account address
 * @returns The account balance
 */
//esto es aptos
export const getAptosBalance = async (accountAddress: string) => {
  try {
    //esto es aptos
    const resources = await aptos.account.getAccountResources({ 
      accountAddress 
    });
    
    //esto es aptos
    const coinResource = resources.find(
      (resource) => resource.type.includes("0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>")
    );
    
    if (!coinResource) {
      return 0;
    }
    
    // @ts-ignore - We know the structure of the coin resource
    return parseInt(coinResource.data.coin.value);
  } catch (error) {
    console.error("Error getting Aptos balance:", error);
    return 0;
  }
};

/**
 * Request an airdrop of test tokens (only works on Devnet)
 * @param accountAddress - The account address to receive tokens
 * @param amount - The amount in APT (only whole numbers work, decimals will be rounded down)
 */
//esto es aptos
export const requestAirdrop = async (accountAddress: string, amount: string = "1") => {
  try {
    // Parse amount to ensure it's a valid number and round to integer
    // Note: The faucet only works with whole APT amounts
    const parsedAmount = parseFloat(amount);
    const requestedAmount = Math.max(1, parsedAmount);
    const requestCount = Math.floor(requestedAmount);
    
    console.log(`Requesting ${requestCount} APT through faucet (${parsedAmount} requested, rounded to ${requestCount})`);
    
    // Faucet may have limitations per request, so we'll make multiple requests if needed
    let successCount = 0;
    
    // Make sequential requests to the faucet
    for (let i = 0; i < requestCount; i++) {
      // Call the Devnet faucet API (fixed at 1 APT per request)
      //esto es aptos
      const response = await fetch(
        `https://faucet.devnet.aptoslabs.com/mint?amount=100000000&address=${accountAddress}`,
        { method: "POST" }
      );
      
      if (response.ok) {
        successCount++;
        console.log(`Faucet request ${i + 1}/${requestCount} successful`);
        // Add small delay between requests to prevent rate limiting
        if (i < requestCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        console.error(`Faucet request ${i + 1}/${requestCount} failed`);
      }
    }
    
    // Return true if at least one request was successful
    return successCount > 0;
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    return false;
  }
};

/**
 * Send a transaction on Aptos
 * @param aptosAccount - The sender's Aptos account
 * @param recipientAddress - The recipient's address
 * @param amount - The amount to send
 * @returns The transaction hash
 */
//esto es aptos
export const sendTransaction = async (
  aptosAccount: Account,
  recipientAddress: string,
  amount: string
) => {
  try {
    //esto es aptos
    const transaction = await aptos.transaction.build.simple({
      sender: aptosAccount.accountAddress.toString(),
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipientAddress, amount],
      },
    });

    //esto es aptos
    const senderAuthenticator = await aptos.transaction.sign({
      signer: aptosAccount,
      transaction,
    });

    //esto es aptos
    const committedTxn = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    //esto es aptos
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    
    return committedTxn.hash;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
};

/**
 * Simulate purchasing APT with a credit card
 * This is for demo purposes - in a real app you would integrate with a payment processor
 * @param accountAddress - The account address to receive tokens
 * @param amount - The amount of APT to purchase
 * @param paymentMethod - The payment method ID
 * @returns Success status and transaction details
 */
//esto es aptos
export const simulatePurchaseAPT = async (
  accountAddress: string, 
  amount: string,
  paymentMethod: string
) => {
  try {
    // Hardcoded APT price in USD
    //esto es aptos
    const APT_PRICE_USD = 6.34;
    
    // Calculate total cost
    const aptAmount = parseFloat(amount);
    const totalCost = (aptAmount * APT_PRICE_USD).toFixed(2);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment
    
    // Now use faucet to actually add tokens to account (for demo purposes)
    const result = await requestAirdrop(accountAddress, amount);
    
    if (result) {
      return {
        success: true,
        amount: aptAmount,
        cost: totalCost,
        currency: 'USD',
        paymentMethod,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error("Failed to process token transfer after payment");
    }
  } catch (error) {
    console.error("Error simulating purchase:", error);
    return { success: false };
  }
};

/**
 * Send a transaction to an email address (will be resolved to an Aptos address)
 * @param aptosAccount - The sender's Aptos account
 * @param recipientEmail - The recipient's email address
 * @param amount - The amount to send
 * @returns The transaction hash
 */
//esto es aptos
export const sendTransactionByEmail = async (
  aptosAccount: Account,
  recipientEmail: string,
  amount: string
) => {
  try {
    // First check if email exists in system
    const response = await fetch(
      `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL || 'http://localhost:3001'}/api/user/check-email/${encodeURIComponent(recipientEmail)}`
    );
    
    const data = await response.json();
    
    if (!data.success || !data.data.exists) {
      throw new Error("El correo electrónico no está registrado en el sistema");
    }
    
    // Make POST request to the Move Agent Service
    //esto es aptos - Move Agent integration
    const sendResponse = await fetch(
      `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL || 'http://localhost:3001'}/api/wallet/send-by-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress: aptosAccount.accountAddress.toString(),
          toEmail: recipientEmail,
          amount: parseFloat(amount) / 100000000, // Convert octas to APT
          tokenType: "0x1::aptos_coin::AptosCoin", //esto es aptos
          privateKeyHalf: "", // This would come from Web3Auth in a real implementation
        }),
      }
    );
    
    const sendResult = await sendResponse.json();
    
    if (!sendResult.success) {
      throw new Error(sendResult.message || "Error sending tokens");
    }
    
    return sendResult.data.txHash;
  } catch (error) {
    console.error("Error sending transaction by email:", error);
    throw error;
  }
};