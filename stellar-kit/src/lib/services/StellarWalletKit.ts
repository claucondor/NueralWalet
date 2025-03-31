import * as StellarSdk from '@stellar/stellar-sdk';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

import { TokenContract } from '../models/TokenContract';
import { StellarNetworkService } from './network.service';
import { TokenInfo, TokenBalance } from '../interfaces/token.interface';
import { KeyPair, AccountInfo, TransactionOptions, TransactionResult, PaymentResult, FriendbotResponse, TransactionHistoryOptions, TransactionInfo, OperationInfo } from '../interfaces/wallet.interface';
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
                    decimals: metadata.decimals
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
            decimals: metadata.decimals
        };
    }

    /**
     * Carga un token desde un archivo de despliegue
     * @param deploymentFilePath Ruta al archivo de despliegue
     * @returns Información del token
     */
    async loadTokenFromFile(deploymentFilePath: string): Promise<TokenInfo> {
        // Cargar el contrato desde el archivo
        const tokenContract = TokenContract.fromDeploymentFile(deploymentFilePath, this.networkProvider);
        
        // Obtener metadatos del token
        const metadata = await tokenContract.getTokenMetadata();
        
        // Guardar el contrato en el mapa
        this.tokenContracts.set(tokenContract.contractId, tokenContract);
        
        return {
            contractId: tokenContract.contractId,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals
        };
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
            // Verificar formato de clave secreta Stellar (debe empezar con 'S')
            if (!sourceSecretKey.startsWith('S')) {
                throw new Error(`invalid version byte. expected 144, got ${sourceSecretKey.charCodeAt(0)}`);
            }
            
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

    /**
     * Obtiene el historial de transacciones de una cuenta
     * @param publicKey Clave pública de la cuenta
     * @param options Opciones para la consulta
     * @returns Lista de transacciones
     */
    async getTransactionHistory(
        publicKey: string,
        options: TransactionHistoryOptions = {}
    ): Promise<{ transactions: TransactionInfo[], nextCursor?: string }> {
        try {
            // Configurar la consulta
            let query = this.server.transactions().forAccount(publicKey);
            
            // Aplicar opciones
            if (options.limit) {
                query = query.limit(options.limit);
            } else {
                query = query.limit(10); // Valor predeterminado
            }
            
            if (options.order) {
                query = query.order(options.order);
            } else {
                query = query.order('desc'); // Más recientes primero por defecto
            }
            
            if (options.cursor) {
                query = query.cursor(options.cursor);
            }
            
            if (options.includeFailedTransactions === false) {
                query = query.includeFailed(false);
            } else {
                query = query.includeFailed(true); // Incluir fallidas por defecto
            }
            
            // Ejecutar la consulta
            const transactionsResponse = await query.call();
            const transactions: TransactionInfo[] = [];
            
            // Procesar los resultados
            for (const record of transactionsResponse.records) {
                // Obtener operaciones de la transacción
                const operations: OperationInfo[] = [];
                
                try {
                    // Solo cargar operaciones si hay menos de 10 para evitar muchas llamadas
                    if (record.operation_count < 10) {
                        const opsResponse = await this.server
                            .operations()
                            .forTransaction(record.hash)
                            .call();
                        
                        for (const op of opsResponse.records) {
                            const operation: OperationInfo = {
                                id: op.id,
                                type: op.type,
                                sourceAccount: op.source_account,
                                createdAt: op.created_at,
                                transactionHash: op.transaction_hash,
                                pagingToken: op.paging_token
                            };
                            
                            // Añadir campos específicos según el tipo de operación
                            if (op.type === 'payment' || op.type === 'create_account') {
                                operation.from = op.source_account;
                                operation.to = op.type === 'payment' ? op.to : op.account;
                                operation.amount = op.type === 'payment' ? op.amount : op.starting_balance;
                                
                                if (op.type === 'payment' && op.asset_type !== 'native') {
                                    operation.assetType = op.asset_type;
                                    operation.assetCode = op.asset_code;
                                    operation.assetIssuer = op.asset_issuer;
                                } else {
                                    operation.assetType = 'native';
                                }
                            }
                            
                            operations.push(operation);
                        }
                    }
                } catch (error) {
                    console.warn(`No se pudieron cargar las operaciones para la transacción ${record.hash}:`, error);
                }
                
                // Crear objeto de transacción
                const transaction: TransactionInfo = {
                    id: record.id,
                    hash: record.hash,
                    createdAt: record.created_at,
                    sourceAccount: record.source_account,
                    fee: String(record.fee_charged),
                    operationCount: record.operation_count,
                    successful: record.successful,
                    pagingToken: record.paging_token
                };
                
                // Añadir memo si existe
                if (record.memo) {
                    transaction.memo = record.memo;
                    transaction.memoType = record.memo_type;
                }
                
                // Añadir operaciones si se cargaron
                if (operations.length > 0) {
                    transaction.operations = operations;
                }
                
                transactions.push(transaction);
            }
            
            // Determinar el cursor para la siguiente página
            let nextCursor: string | undefined;
            if (transactions.length > 0 && transactionsResponse.records.length === (options.limit || 10)) {
                nextCursor = transactions[transactions.length - 1].pagingToken;
            }
            
            // Analizar patrones de transacciones
            const analysis = await StellarWalletKit.analyzeTransactionPatterns(transactions, publicKey);
            
            return {
                transactions,
                nextCursor
            };
        } catch (error: any) {
            console.error('Error al obtener historial de transacciones:', error);
            throw new Error(`Error al obtener historial de transacciones: ${error.message || 'Error desconocido'}`);
        }
    }

    /**
     * Analiza patrones de transacciones para evaluar comportamientos financieros
     * @param transactions Transacciones a analizar
     * @param publicKey Clave pública de la cuenta a analizar
     * @returns Análisis de patrones de transacciones
     */
    private static async analyzeTransactionPatterns(transactions: any[], publicKey: string) {
        console.log(`🔍 [ANALYZE PATTERNS] Iniciando análisis de patrones para ${transactions.length} transacciones`);
        
        // Inicializar variables para el análisis
        let totalIncoming = 0;
        let totalOutgoing = 0;
        let largestTransaction = 0;
        let incomingCount = 0;
        let outgoingCount = 0;
        
        // Calcular la fecha más antigua y más reciente
        const dates = transactions
            .map(tx => new Date(tx.createdAt).getTime())
            .sort((a, b) => a - b);
        
        const startDate = dates.length > 0 ? new Date(dates[0]) : new Date();
        const endDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : new Date();
        
        // Calcular días entre la primera y última transacción
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        console.log(`📅 [ANALYZE PATTERNS] Periodo de análisis: ${daysDiff} días (${startDate.toISOString()} - ${endDate.toISOString()})`);
        
        // Analizar cada transacción
        console.log(`🔄 [ANALYZE PATTERNS] Procesando transacciones...`);
        transactions.forEach(tx => {
            const operations = tx.operations || [];
            
            operations.forEach((op: any) => {
                // Solo analizar operaciones de pago y creación de cuenta
                if (op.type === 'payment' || op.type === 'create_account') {
                    const amount = parseFloat(op.amount);
                    
                    // Si la operación es recibida por la cuenta analizada
                    if (op.to === publicKey) {
                        totalIncoming += amount;
                        incomingCount++;
                        console.log(`  📥 Entrada: ${amount} XLM de ${op.from || 'desconocido'}`);
                    } 
                    // Si la operación es enviada por la cuenta analizada
                    else if (op.from === publicKey) {
                        totalOutgoing += amount;
                        outgoingCount++;
                        console.log(`  📤 Salida: ${amount} XLM a ${op.to || 'desconocido'}`);
                    }
                    
                    // Actualizar transacción más grande
                    if (amount > largestTransaction) {
                        largestTransaction = amount;
                    }
                }
            });
        });
        
        // Calcular métricas
        const totalVolume = totalIncoming + totalOutgoing;
        const netFlow = totalIncoming - totalOutgoing;
        const frequency = transactions.length / daysDiff;
        const debtRatio = totalOutgoing > 0 ? totalIncoming / totalOutgoing : 0;
        
        console.log(`📊 [ANALYZE PATTERNS] Análisis completado:`);
        console.log(`  💰 Volumen total: ${totalVolume.toFixed(2)} XLM`);
        console.log(`  🔄 Transacciones: ${transactions.length} (${incomingCount} entradas, ${outgoingCount} salidas)`);
        console.log(`  📈 Flujo neto: ${netFlow.toFixed(2)} XLM`);
        console.log(`  💹 Ratio deuda: ${debtRatio.toFixed(2)}`);
        console.log(`  ⚡ Frecuencia: ${frequency.toFixed(2)} tx/día`);
        console.log(`  🔝 Mayor transacción: ${largestTransaction.toFixed(2)} XLM`);
        
        return {
            totalVolume,
            transactionCount: transactions.length,
            frequency,
            averageAmount: totalVolume / Math.max(1, transactions.length),
            largestTransaction,
            netFlow,
            debtRatio,
            incomingCount,
            outgoingCount
        };
    }

    /**
     * Genera un score crediticio basado en el análisis de transacciones
     * @param transactionAnalysis Resultado del análisis de transacciones
     * @param transactionsSummary Resumen de transacciones recientes (opcional)
     * @param language Idioma para la respuesta
     * @returns Score crediticio y evaluación
     */
    public async generateCreditScore(
        transactionAnalysis: any,
        transactionsSummary: string = '',
        language: string = 'es'
    ) {
        try {
            console.log(`🔄 [GENERATE SCORE] Iniciando generación de score crediticio`);
            console.log(`🌐 [GENERATE SCORE] Idioma solicitado: ${language}`);
            
            // Importaciones necesarias para LLM
            console.log(`📚 [GENERATE SCORE] Importando dependencias LLM...`);
            const { LLMService } = await import('./llm.service');
            const { ChatPromptTemplate } = await import('@langchain/core/prompts');
            const { JsonOutputParser } = await import('@langchain/core/output_parsers');
            
            console.log(`🤖 [GENERATE SCORE] Inicializando modelo LLM...`);
            const llm = LLMService.getLLM();
            const promptTemplate = ChatPromptTemplate.fromTemplate(`
                Eres un analista de crédito experto evaluando la reputación crediticia en un sistema descentralizado.
                
                Datos de transacciones:
                - Volumen total: {totalVolume} XLM
                - Número de transacciones: {transactionCount}
                - Frecuencia: {frequency} transacciones/día
                - Flujo neto: {netFlow} XLM
                - Transacción más grande: {largestTransaction} XLM
                - Relación deuda/pagos: {debtRatio}
                
                Historial de transacciones recientes:
                {transactionsSummary}
                
                Genera un score de crédito (0-1000) considerando:
                1. Consistencia en pagos
                2. Volumen de actividad
                3. Balance entre deuda y crédito
                4. Patrones de comportamiento
                5. Historial completo
                
                Explica brevemente el razonamiento en menos de 100 palabras.
                Incluye sugerencias para mejorar el score si es menor a 700.
                
                IMPORTANTE: Responde en {language} con este formato JSON:
                {{
                    "score": 0-1000,
                    "reason": "razón breve",
                    "improvementTips": ["sugerencia1", "sugerencia2"]
                }}
            `);

            console.log(`🔄 [GENERATE SCORE] Creando cadena de procesamiento LLM con parser JSON...`);
            const chain = promptTemplate.pipe(llm).pipe(new JsonOutputParser());
            
            console.log(`⏳ [GENERATE SCORE] Invocando LLM para cálculo de score...`);
            const result = await chain.invoke({
                ...transactionAnalysis,
                transactionsSummary,
                language
            });
            
            console.log(`✅ [GENERATE SCORE] Score generado exitosamente:`, result);
            
            return result;
        } catch (error) {
            console.error(`❌ [GENERATE SCORE] Error al generar score crediticio:`, error);
            // Devolver un valor por defecto en caso de error
            return {
                score: 0,
                reason: "Error al calcular el score crediticio",
                improvementTips: ["Intentar más tarde con más historial de transacciones"]
            };
        }
    }

    /**
     * Evalúa la reputación crediticia de una cuenta basada en su historial de transacciones
     * @param publicKey Clave pública de la cuenta a evaluar
     * @param language Idioma para la respuesta
     * @returns Evaluación crediticia con score y recomendaciones
     */
    async evaluateCreditReputation(publicKey: string, language: string = 'es') {
        try {
            console.log(`🔄 [CREDIT REPUTATION] Iniciando evaluación para ${publicKey} en idioma: ${language}`);
            
            // Verificar la red que estamos usando
            const networkType = this.getNetwork();
            console.log(`🌐 [CREDIT REPUTATION] Red utilizada: ${networkType}`);
            
            // Obtener historial de transacciones (últimos 30 días o 100 transacciones)
            console.log(`📜 [CREDIT REPUTATION] Obteniendo historial de transacciones...`);
            const historyResult = await this.getTransactionHistory(publicKey, {
                limit: 100,
                order: 'desc'
            });
            
            const { transactions } = historyResult;
            console.log(`✅ [CREDIT REPUTATION] Transacciones obtenidas: ${transactions.length}`);
            
            if (transactions.length === 0) {
                console.warn(`⚠️ [CREDIT REPUTATION] No hay transacciones disponibles para analizar`);
                return {
                    success: false,
                    error: 'No hay historial de transacciones suficiente para evaluar la reputación crediticia'
                };
            }
            
            // Crear un resumen de las transacciones más recientes para el LLM
            console.log(`📝 [CREDIT REPUTATION] Creando resumen de transacciones recientes...`);
            const transactionsSummary = transactions.slice(0, 10).map(tx => {
                const operations = tx.operations || [];
                const opSummaries = operations.map(op => {
                    if (op.type === 'payment' || op.type === 'create_account') {
                        const direction = op.to === publicKey ? 'RECIBIDO' : 'ENVIADO';
                        return `${op.createdAt}: ${direction} ${op.amount} XLM ${direction === 'RECIBIDO' ? 'de' : 'a'} ${direction === 'RECIBIDO' ? op.from : op.to}`;
                    }
                    return `${op.createdAt}: Operación ${op.type}`;
                }).join('\n  ');
                
                return `- ID: ${tx.id}\n  Fecha: ${tx.createdAt}\n  ${opSummaries || 'Sin detalles de operaciones'}`;
            }).join('\n\n');
            
            // Analizar patrones de transacciones
            console.log(`📊 [CREDIT REPUTATION] Analizando patrones de transacciones...`);
            const analysis = await StellarWalletKit.analyzeTransactionPatterns(transactions, publicKey);
            
            console.log(`📈 [CREDIT REPUTATION] Resumen del análisis: 
                Volumen total: ${analysis.totalVolume} XLM
                Transacciones: ${analysis.transactionCount}
                Frecuencia: ${analysis.frequency} tx/día
                Flujo neto: ${analysis.netFlow} XLM
                Ratio deuda: ${analysis.debtRatio}
            `);
            
            // Generar score crediticio
            console.log(`🧮 [CREDIT REPUTATION] Generando score crediticio con LLM...`);
            const creditScore = await this.generateCreditScore(
                analysis,
                transactionsSummary,
                language
            );
            console.log(`🏆 [CREDIT REPUTATION] Score crediticio generado:`, creditScore);
            
            return {
                success: true,
                analysis,
                creditScore
            };
            
        } catch (error: any) {
            console.error('❌ [CREDIT REPUTATION] Error al evaluar reputación crediticia:', error);
            console.error('Stack trace:', error.stack);
            return {
                success: false,
                error: error.message || 'Error desconocido al evaluar reputación crediticia'
            };
        }
    }
}