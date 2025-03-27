import * as StellarSdk from '@stellar/stellar-sdk';
// Eliminando node-fetch y usando fetch nativo del navegador
// Eliminando fs y path que no son compatibles con navegador

import { TokenContract } from '../models/TokenContract';
import { StellarNetworkService } from './network.service';
import { TokenInfo, TokenBalance } from '../interfaces/token.interface';
import { KeyPair, AccountInfo, TransactionOptions, TransactionResult, PaymentResult, FriendbotResponse } from '../interfaces/wallet.interface';
import { NetworkProvider, NetworkType } from '../interfaces/network.interface';

/**
 * Kit completo para wallet Stellar, con soporte tanto para operaciones nativas como tokens SEP-41
 */
export class StellarWalletKit {
    private readonly MAX_MEMO_LENGTH = 28; // Stellar tiene un límite de 28 bytes para memos de texto
    private networkProvider: NetworkProvider;
    private server: StellarSdk.Horizon.Server;
    private networkPassphrase: string;
    private explorerBaseUrl: string;
    private tokenContracts: Map<string, TokenContract> = new Map();

    /**
     * Constructor
     * @param isTestnet Si es true, se conecta a la testnet, si es false, a la mainnet
     * @param networkProvider Proveedor de red personalizado (opcional)
     */
    constructor(isTestnet: boolean = true, networkProvider?: NetworkProvider) {
        // Crear o usar el proveedor de red
        this.networkProvider = networkProvider || new StellarNetworkService(isTestnet ? 'testnet' : 'mainnet');
        
        // Obtener la configuración de red
        const config = this.networkProvider.getNetworkConfig();
        
        // Configurar servidor Horizon
        this.server = new StellarSdk.Horizon.Server(
            isTestnet ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
        );
        
        // Guardar información de red
        this.networkPassphrase = config.networkPassphrase;
        this.explorerBaseUrl = config.explorerBaseUrl;
    }

    /**
     * Obtiene el servidor Horizon
     */
    getServer(): StellarSdk.Horizon.Server {
        return this.server;
    }

    /**
     * Obtiene la red actual
     */
    getNetwork(): NetworkType {
        return this.networkProvider.getNetworkConfig().isTestnet ? 'testnet' : 'mainnet';
    }

    /**
     * Genera un nuevo par de claves (keypair)
     * @returns La información de la cuenta generada
     */
    generateKeypair(): KeyPair {
        const keypair = StellarSdk.Keypair.random();
        return {
            publicKey: keypair.publicKey(),
            secretKey: keypair.secret()
        };
    }

    /**
     * Crea una cuenta con Friendbot (solo en testnet)
     * @param publicKey La clave pública de la cuenta a fondear
     * @returns Resultado de la operación
     */
    async fundAccountWithFriendbot(publicKey: string): Promise<PaymentResult> {
        try {
            const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
            const responseJSON = await response.json() as FriendbotResponse;
            
            if (response.ok) {
                return {
                    success: true,
                    hash: responseJSON.hash || responseJSON._links?.transaction?.href.split('/').pop()
                };
            } else {
                return {
                    success: false,
                    error: responseJSON.detail || 'Error desconocido al fondear cuenta'
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al conectar con friendbot'
            };
        }
    }

    /**
     * Obtiene la información de una cuenta
     * @param publicKey La clave pública de la cuenta
     * @returns La información de la cuenta
     */
    async getAccountInfo(publicKey: string): Promise<AccountInfo | null> {
        try {
            const account = await this.server.loadAccount(publicKey);
            
            // Obtener el balance de XLM
            const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
            const balance = xlmBalance ? xlmBalance.balance : '0';
            
            return {
                publicKey,
                secretKey: '', // No podemos recuperar la clave secreta
                balance,
                sequence: account.sequence,
                subentryCount: account.subentry_count
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Valida y trunca el texto del memo si es necesario
     * @param memo Texto del memo
     * @returns Texto validado (truncado si es necesario)
     */
    private validateMemo(memo: string): string {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(memo);
        
        if (bytes.length > this.MAX_MEMO_LENGTH) {
            console.warn(`Advertencia: El memo "${memo}" excede el límite de ${this.MAX_MEMO_LENGTH} bytes. Será truncado.`);
            // Truncar el memo a un número de caracteres que probablemente cumpla con el límite de bytes
            // Este enfoque es simple pero puede no ser perfecto con caracteres multibyte
            return memo.substring(0, this.MAX_MEMO_LENGTH - 3) + '...';
        }
        
        return memo;
    }

    /**
     * Crea una nueva cuenta en la red Stellar
     * @param sourceSecretKey Clave secreta de la cuenta que creará la nueva cuenta
     * @param destinationPublicKey Clave pública de la cuenta a crear
     * @param startingBalance Balance inicial en XLM
     * @param options Opciones adicionales para la transacción
     * @returns Resultado de la transacción
     */
    async createAccount(
        sourceSecretKey: string,
        destinationPublicKey: string,
        startingBalance: string,
        options: TransactionOptions = {}
    ): Promise<TransactionResult> {
        try {
            const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
            const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());
            
            // Configurar el constructor de transacciones
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase
            })
                // Agregar la operación para crear la cuenta
                .addOperation(
                    StellarSdk.Operation.createAccount({
                        destination: destinationPublicKey,
                        startingBalance
                    })
                );
            
            // Agregar un memo si se proporciona
            if (options.memo) {
                const validatedMemo = this.validateMemo(options.memo);
                transaction.addMemo(StellarSdk.Memo.text(validatedMemo));
            }
            
            // Establecer el timeout de la transacción
            const timeoutInSeconds = options.timeoutInSeconds || 30;
            transaction.setTimeout(timeoutInSeconds);
            
            // Construir y firmar la transacción
            const builtTransaction = transaction.build();
            builtTransaction.sign(sourceKeypair);
            
            // Enviar la transacción
            const transactionResult = await this.server.submitTransaction(builtTransaction);
            
            return {
                success: true,
                hash: transactionResult.hash
            };
        } catch (error) {
            console.error('Error al crear cuenta:', error);
            return {
                success: false,
                error
            };
        }
    }

    /**
     * Obtiene todos los tokens cargados
     * @returns Lista de tokens cargados
     */
    async getLoadedTokens(): Promise<TokenInfo[]> {
        const tokensInfo: TokenInfo[] = [];
        
        for (const [contractId, contract] of this.tokenContracts.entries()) {
            try {
                const metadata = await contract.getTokenMetadata();
                tokensInfo.push({
                    contractId,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    decimals: metadata.decimals,
                    admin: metadata.admin
                });
            } catch (error) {
                console.error(`Error al obtener información del token ${contractId}:`, error);
            }
        }
        
        return tokensInfo;
    }

    /**
     * Carga un token desde su ID en la blockchain
     * @param contractId ID del contrato del token
     * @param sourceAccount Cuenta de origen para consultas (opcional)
     * @returns Información del token
     */
    async loadToken(contractId: string, sourceAccount?: string): Promise<TokenInfo> {
        const isTestnet = this.networkPassphrase === StellarSdk.Networks.TESTNET;
        const network = isTestnet ? 'testnet' : 'mainnet';
        
        // Crear una instancia del contrato del token
        const tokenContract = new TokenContract(contractId, network, sourceAccount, this.networkProvider);
        
        // Obtener metadatos del token
        const metadata = await tokenContract.getTokenMetadata();
        
        // Guardar el contrato en el mapa
        this.tokenContracts.set(contractId, tokenContract);
        
        return {
            contractId,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            admin: metadata.admin
        };
    }

    /**
     * Método de compatibilidad para navegador - No compatible con carga de archivos locales
     * Nota: En un entorno de navegador, cargar desde archivo no es posible directamente.
     * @param deploymentFilePath Path al archivo (no funcionará en navegador)
     * @returns Información del token
     */
    async loadTokenFromFile(deploymentFilePath: string): Promise<TokenInfo> {
        console.warn('loadTokenFromFile no está disponible en el navegador. Utilice loadToken en su lugar.');
        throw new Error('loadTokenFromFile no es compatible con el entorno del navegador. Use loadToken con el ID del contrato.');
    }

    /**
     * Obtiene el balance de tokens para una dirección
     * @param contractId ID del contrato del token
     * @param address Dirección para consultar el balance
     * @returns Información del balance
     */
    async getTokenBalance(contractId: string, address: string): Promise<TokenBalance> {
        // Verificar si el contrato está cargado
        const tokenContract = this.tokenContracts.get(contractId);
        if (!tokenContract) {
            throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
        }
        
        // Obtener el balance
        return tokenContract.getBalance(address);
    }

    /**
     * Transfiere tokens entre cuentas
     * @param contractId ID del contrato del token
     * @param sourceSecretKey Clave secreta de la cuenta origen
     * @param destinationPublicKey Clave pública de la cuenta destino
     * @param amount Cantidad a transferir
     * @returns Resultado de la operación
     */
    async sendToken(
        contractId: string,
        sourceSecretKey: string,
        destinationPublicKey: string,
        amount: string
    ): Promise<PaymentResult> {
        try {
            // Verificar si el contrato está cargado
            const tokenContract = this.tokenContracts.get(contractId);
            if (!tokenContract) {
                throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
            }
            
            // Realizar la transferencia
            const result = await tokenContract.transfer(sourceSecretKey, destinationPublicKey, amount);
            
            return {
                success: true,
                hash: result.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al transferir tokens'
            };
        }
    }

    /**
     * Aprueba una cantidad de tokens para ser gastada por otra cuenta
     * @param contractId ID del contrato del token
     * @param ownerSecretKey Clave secreta del propietario de los tokens
     * @param spenderPublicKey Clave pública de la cuenta autorizada a gastar
     * @param amount Cantidad autorizada
     * @param expirationLedger Número de ledger en el que expira la autorización
     * @returns Resultado de la operación
     */
    async approveTokenSpending(
        contractId: string,
        ownerSecretKey: string,
        spenderPublicKey: string,
        amount: string,
        expirationLedger: number
    ): Promise<PaymentResult> {
        try {
            // Verificar si el contrato está cargado
            const tokenContract = this.tokenContracts.get(contractId);
            if (!tokenContract) {
                throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
            }
            
            // Realizar la aprobación
            const result = await tokenContract.approve(
                ownerSecretKey,
                spenderPublicKey,
                amount,
                expirationLedger
            );
            
            return {
                success: true,
                hash: result.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al aprobar gasto de tokens'
            };
        }
    }

    /**
     * Acuña nuevos tokens (solo puede ser realizado por el administrador)
     * @param contractId ID del contrato del token
     * @param adminSecretKey Clave secreta del administrador
     * @param toAddress Dirección que recibirá los tokens
     * @param amount Cantidad a acuñar
     * @returns Resultado de la operación
     */
    async mintToken(
        contractId: string,
        adminSecretKey: string,
        toAddress: string,
        amount: string
    ): Promise<PaymentResult> {
        try {
            // Verificar si el contrato está cargado
            const tokenContract = this.tokenContracts.get(contractId);
            if (!tokenContract) {
                throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
            }
            
            // Realizar el mint
            const result = await tokenContract.mint(adminSecretKey, toAddress, amount);
            
            return {
                success: true,
                hash: result.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al acuñar tokens'
            };
        }
    }

    /**
     * Quema tokens de una cuenta
     * @param contractId ID del contrato del token
     * @param ownerSecretKey Clave secreta del propietario de los tokens
     * @param amount Cantidad a quemar
     * @returns Resultado de la operación
     */
    async burnToken(
        contractId: string,
        ownerSecretKey: string,
        amount: string
    ): Promise<PaymentResult> {
        try {
            // Verificar si el contrato está cargado
            const tokenContract = this.tokenContracts.get(contractId);
            if (!tokenContract) {
                throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
            }
            
            // Realizar el burn
            const result = await tokenContract.burn(ownerSecretKey, amount);
            
            return {
                success: true,
                hash: result.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al quemar tokens'
            };
        }
    }

    /**
     * Cambia el administrador del token
     * @param contractId ID del contrato del token
     * @param adminSecretKey Clave secreta del administrador actual
     * @param newAdminPublicKey Clave pública del nuevo administrador
     * @returns Resultado de la operación
     */
    async changeTokenAdmin(
        contractId: string,
        adminSecretKey: string,
        newAdminPublicKey: string
    ): Promise<PaymentResult> {
        try {
            // Verificar si el contrato está cargado
            const tokenContract = this.tokenContracts.get(contractId);
            if (!tokenContract) {
                throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
            }
            
            // Cambiar el administrador
            const result = await tokenContract.setAdmin(adminSecretKey, newAdminPublicKey);
            
            return {
                success: true,
                hash: result.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error al cambiar el administrador del token'
            };
        }
    }

    /**
     * Obtiene la cantidad de tokens que una cuenta puede gastar en nombre de otra
     * @param contractId ID del contrato del token
     * @param ownerPublicKey Clave pública del propietario de los tokens
     * @param spenderPublicKey Clave pública de la cuenta autorizada a gastar
     * @returns Cantidad aprobada
     */
    async getTokenAllowance(
        contractId: string,
        ownerPublicKey: string,
        spenderPublicKey: string
    ): Promise<string> {
        // Verificar si el contrato está cargado
        const tokenContract = this.tokenContracts.get(contractId);
        if (!tokenContract) {
            throw new Error(`El token con ID ${contractId} no está cargado. Usa loadToken primero.`);
        }
        
        // Obtener el allowance
        return tokenContract.getAllowance(ownerPublicKey, spenderPublicKey);
    }

    /**
     * Obtiene la URL del explorador para una cuenta o transacción
     * @param type Tipo de entidad ('account', 'transaction', 'operation', 'ledger')
     * @param id ID de la entidad
     * @returns URL del explorador
     */
    getExplorerUrl(type: 'account' | 'transaction' | 'operation' | 'ledger', id: string): string {
        let path = '';
        
        switch (type) {
            case 'account':
                path = 'account';
                break;
            case 'transaction':
                path = 'tx';
                break;
            case 'operation':
                path = 'op';
                break;
            case 'ledger':
                path = 'ledger';
                break;
        }
        
        return `${this.explorerBaseUrl}/${path}/${id}`;
    }

    /**
     * Envía un pago en XLM a otra cuenta
     * @param sourceSecretKey Clave secreta de la cuenta origen
     * @param destinationPublicKey Clave pública de la cuenta destino
     * @param amount Cantidad a enviar
     * @param options Opciones adicionales
     * @returns Resultado de la operación
     */
    async sendPayment(
        sourceSecretKey: string,
        destinationPublicKey: string,
        amount: string,
        options: TransactionOptions = {}
    ): Promise<PaymentResult> {
        try {
            const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
            const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());
            
            // Configurar el constructor de transacciones
            const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase
            })
                // Agregar la operación de pago
                .addOperation(
                    StellarSdk.Operation.payment({
                        destination: destinationPublicKey,
                        asset: StellarSdk.Asset.native(),
                        amount
                    })
                );
            
            // Agregar un memo si se proporciona
            if (options.memo) {
                const validatedMemo = this.validateMemo(options.memo);
                transaction.addMemo(StellarSdk.Memo.text(validatedMemo));
            }
            
            // Establecer el timeout de la transacción
            const timeoutInSeconds = options.timeoutInSeconds || 30;
            transaction.setTimeout(timeoutInSeconds);
            
            // Construir y firmar la transacción
            const builtTransaction = transaction.build();
            builtTransaction.sign(sourceKeypair);
            
            // Enviar la transacción
            const transactionResult = await this.server.submitTransaction(builtTransaction);
            
            return {
                success: true,
                hash: transactionResult.hash
            };
        } catch (error: any) {
            console.error('Error al enviar pago:', error);
            return {
                success: false,
                error: error.message || 'Error desconocido'
            };
        }
    }
} 