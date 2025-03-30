import { StellarWalletKit } from '../lib';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import * as StellarSdk from '@stellar/stellar-sdk';
import { TokenInfo } from '../lib/interfaces/token.interface';

/**
 * Interfaz para leer la entrada del usuario
 */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Función para preguntar al usuario de forma asíncrona
 */
function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

/**
 * Prueba el uso de tokens personalizados SEP-41 con StellarWalletKit
 */
async function testTokenWallet() {
    console.log('🚀 Prueba de tokens personalizados (SEP-41) con StellarWalletKit');
    
    // Crear una instancia del StellarWalletKit (usando testnet)
    const walletKit = new StellarWalletKit(true);
    
    try {
        // Preguntar si cargar desde archivo o especificar contract ID
        const loadMethod = await question('\n¿Cómo deseas cargar el token?\n1. Desde archivo de despliegue local\n2. Usando Contract ID\nSelecciona (1-2): ');
        
        let tokenInfo;
        
        if (loadMethod === '1') {
            // 1. Cargar el token desde el archivo de despliegue
            console.log('\n1️⃣ Cargando token desde archivo de despliegue...');
            
            // Ruta al archivo de despliegue del token
            const deploymentInfoPath = path.resolve(__dirname, '../../soroban_contract/token_deployment_info.json');
            
            if (!fs.existsSync(deploymentInfoPath)) {
                console.error(`No se encontró el archivo de despliegue en ${deploymentInfoPath}`);
                rl.close();
                return;
            }
            
            tokenInfo = await walletKit.loadTokenFromFile(deploymentInfoPath);
        } else {
            // 2. Cargar el token usando Contract ID
            console.log('\n1️⃣ Cargando token desde la blockchain...');
            const contractId = await question('Ingresa el ID del contrato del token: ');
            
            // Opcional: solicitar cuenta de origen para consultas
            const useSourceAccount = await question('¿Deseas especificar una cuenta de origen para las consultas? (S/N): ');
            
            let sourceAccount = undefined;
            if (useSourceAccount.toUpperCase() === 'S') {
                sourceAccount = await question('Ingresa la clave pública de la cuenta de origen: ');
            }
            
            tokenInfo = await walletKit.loadToken(contractId, sourceAccount);
        }
        
        console.log('✅ Token cargado con éxito:');
        console.log(`   📝 Contract ID: ${tokenInfo.contractId}`);
        console.log(`   🏷️ Nombre: ${tokenInfo.name} (${tokenInfo.symbol})`);
        console.log(`   🔢 Decimales: ${tokenInfo.decimals}`);
        
        // 2. Obtener el balance del token para una dirección
        console.log('\n2️⃣ Consultar balance del token');
        const address = await question('Ingresa la dirección para consultar el balance: ');
        
        if (!address.trim()) {
            console.log('❌ Se requiere una dirección válida para consultar el balance');
            rl.close();
            return;
        }
        
        const addressBalance = await walletKit.getTokenBalance(tokenInfo.contractId, address);
        
        console.log(`✅ Balance de ${address}: ${addressBalance.formattedBalance} ${tokenInfo.symbol}`);
        
        // 3. Interfaz interactiva para probar operaciones con tokens
        const performOperations = await question('\n¿Deseas realizar operaciones con este token? (S/N): ');
        
        if (performOperations.toUpperCase() === 'S') {
            console.log('\n3️⃣ Para realizar operaciones, necesitas la clave secreta del administrador u otra cuenta con tokens');
            const secretKey = await question('Ingresa la clave secreta de la cuenta a usar para las operaciones: ');
            
            // Obtener la clave pública correspondiente
            const keypair = StellarSdk.Keypair.fromSecret(secretKey);
            const publicKey = keypair.publicKey();
            
            console.log('\nOperaciones disponibles:');
            console.log('   1. Enviar tokens a otra dirección');
            console.log('   2. Acuñar nuevos tokens (requiere ser administrador)');
            console.log('   3. Quemar tokens');
            console.log('   4. Aprobar tokens para gasto por otra cuenta');
            console.log('   5. Cambiar administrador del token (requiere ser administrador)');
            console.log('   6. Salir');
            
            let exit = false;
            while (!exit) {
                const option = await question('\nSelecciona una operación (1-6): ');
                
                switch (option) {
                    case '1': // Enviar tokens
                        await sendTokens(walletKit, tokenInfo.contractId, secretKey, publicKey);
                        break;
                    case '2': // Acuñar tokens
                        await mintTokens(walletKit, tokenInfo.contractId, secretKey);
                        break;
                    case '3': // Quemar tokens
                        await burnTokens(walletKit, tokenInfo.contractId, secretKey, publicKey);
                        break;
                    case '4': // Aprobar tokens
                        await approveTokens(walletKit, tokenInfo.contractId, secretKey);
                        break;
                    case '5': // Cambiar admin
                        await changeAdmin(walletKit, tokenInfo.contractId, secretKey);
                        break;
                    case '6': // Salir
                        exit = true;
                        break;
                    default:
                        console.log('❌ Opción no válida. Intenta de nuevo.');
                }
            }
        }
    } catch (error: any) {
        console.error('❌ Error durante la prueba:', error.message || error);
    }
    
    console.log('\n🏁 Prueba completada.');
    rl.close();
}

/**
 * Envía tokens de una dirección a otra
 */
async function sendTokens(walletKit: StellarWalletKit, contractId: string, senderSecretKey: string, senderPublicKey: string) {
    try {
        // Mostrar balance actual
        const balance = await walletKit.getTokenBalance(contractId, senderPublicKey);
        const tokenInfo = (await walletKit.getLoadedTokens()).find((t: TokenInfo) => t.contractId === contractId);
        
        console.log(`\nBalance actual: ${balance.formattedBalance} ${tokenInfo?.symbol || ''}`);
        
        // Solicitar datos para la transferencia
        const destinationPublicKey = await question('Dirección de destino: ');
        const amount = await question('Cantidad a enviar: ');
        
        console.log('\nEnviando tokens...');
        const result = await walletKit.sendToken(contractId, senderSecretKey, destinationPublicKey, amount);
        
        if (result.success) {
            console.log('✅ Tokens enviados con éxito!');
            console.log(`   📝 Hash de la transacción: ${result.hash}`);
            
            // Mostrar balances actualizados
            const newSenderBalance = await walletKit.getTokenBalance(contractId, senderPublicKey);
            const newReceiverBalance = await walletKit.getTokenBalance(contractId, destinationPublicKey);
            
            console.log(`\nBalance actualizado del remitente: ${newSenderBalance.formattedBalance} ${tokenInfo?.symbol || ''}`);
            console.log(`Balance actualizado del destinatario: ${newReceiverBalance.formattedBalance} ${tokenInfo?.symbol || ''}`);
        } else {
            console.log(`❌ Error al enviar tokens: ${result.error}`);
        }
    } catch (error: any) {
        console.error('❌ Error en la operación:', error.message || error);
    }
}

/**
 * Acuña nuevos tokens
 */
async function mintTokens(walletKit: StellarWalletKit, contractId: string, adminSecretKey: string) {
    try {
        // Solicitar datos para el mint
        const toAddress = await question('Dirección que recibirá los tokens: ');
        const amount = await question('Cantidad a acuñar: ');
        
        console.log('\nAcuñando tokens...');
        const result = await walletKit.mintToken(contractId, adminSecretKey, toAddress, amount);
        
        if (result.success) {
            console.log('✅ Tokens acuñados con éxito!');
            console.log(`   📝 Hash de la transacción: ${result.hash}`);
            
            // Mostrar balance actualizado
            const tokenInfo = (await walletKit.getLoadedTokens()).find((t: TokenInfo) => t.contractId === contractId);
            const newBalance = await walletKit.getTokenBalance(contractId, toAddress);
            
            console.log(`\nBalance actualizado: ${newBalance.formattedBalance} ${tokenInfo?.symbol || ''}`);
        } else {
            console.log(`❌ Error al acuñar tokens: ${result.error}`);
        }
    } catch (error: any) {
        console.error('❌ Error en la operación:', error.message || error);
    }
}

/**
 * Quema tokens
 */
async function burnTokens(walletKit: StellarWalletKit, contractId: string, ownerSecretKey: string, ownerPublicKey: string) {
    try {
        // Obtener información del token
        const tokenInfo = (await walletKit.getLoadedTokens()).find((t: TokenInfo) => t.contractId === contractId);
        if (!tokenInfo) {
            throw new Error('No se pudo obtener información del token');
        }
        
        // Mostrar balance actual
        const balance = await walletKit.getTokenBalance(contractId, ownerPublicKey);
        console.log(`\nBalance actual: ${balance.formattedBalance} ${tokenInfo?.symbol || ''}`);
        
        // Solicitar cantidad a quemar
        const amount = await question('Cantidad a quemar: ');
        
        console.log('\nQuemando tokens...');
        const result = await walletKit.burnToken(contractId, ownerSecretKey, amount);
        
        if (result.success) {
            console.log('✅ Tokens quemados con éxito!');
            console.log(`   📝 Hash de la transacción: ${result.hash}`);
            
            // Mostrar balance actualizado
            const newBalance = await walletKit.getTokenBalance(contractId, ownerPublicKey);
            console.log(`\nBalance actualizado: ${newBalance.formattedBalance} ${tokenInfo?.symbol || ''}`);
        } else {
            console.log(`❌ Error al quemar tokens: ${result.error}`);
        }
    } catch (error: any) {
        console.error('❌ Error en la operación:', error.message || error);
    }
}

/**
 * Aprueba tokens para ser gastados por otra cuenta
 */
async function approveTokens(walletKit: StellarWalletKit, contractId: string, ownerSecretKey: string) {
    try {
        // Solicitar datos para la aprobación
        const spenderPublicKey = await question('Dirección autorizada a gastar: ');
        const amount = await question('Cantidad autorizada: ');
        const expirationLedger = await question('Número de ledger en el que expira (0 para usar ledger actual + 10000): ');
        
        // Determinar el ledger de expiración
        let expiration = parseInt(expirationLedger);
        if (expiration <= 0) {
            // Obtener el ledger actual y añadir 10,000
            expiration = 10000; // Valor por defecto para testnet
        }
        
        console.log('\nAprobando tokens...');
        const result = await walletKit.approveTokenSpending(
            contractId,
            ownerSecretKey,
            spenderPublicKey,
            amount,
            expiration
        );
        
        if (result.success) {
            console.log('✅ Tokens aprobados con éxito!');
            console.log(`   📝 Hash de la transacción: ${result.hash}`);
            
            // Intentar obtener el balance de la asignación
            try {
                const allowance = await walletKit.getTokenAllowance(
                    contractId,
                    StellarSdk.Keypair.fromSecret(ownerSecretKey).publicKey(),
                    spenderPublicKey
                );
                console.log(`\nAsignación actual: ${allowance}`);
            } catch (err) {
                console.log('\nNo se pudo obtener la asignación actual.');
            }
        } else {
            console.log(`❌ Error al aprobar tokens: ${result.error}`);
        }
    } catch (error: any) {
        console.error('❌ Error en la operación:', error.message || error);
    }
}

/**
 * Cambia el administrador del token
 */
async function changeAdmin(walletKit: StellarWalletKit, contractId: string, adminSecretKey: string) {
    try {
        // Solicitar la nueva dirección de administrador
        const newAdminPublicKey = await question('Nueva dirección de administrador: ');
        
        console.log('\nCambiando administrador...');
        const result = await walletKit.changeTokenAdmin(contractId, adminSecretKey, newAdminPublicKey);
        
        if (result.success) {
            console.log('✅ Administrador cambiado con éxito!');
            console.log(`   📝 Hash de la transacción: ${result.hash}`);
            
            // Actualizar la información del token
            const tokenInfo = (await walletKit.getLoadedTokens()).find((t: TokenInfo) => t.contractId === contractId);
            if (tokenInfo) {
                console.log(`\nNuevo administrador: ${newAdminPublicKey}`);
                
                // Si estamos cargando desde un archivo de despliegue, preguntar si actualizarlo
                const updateFile = await question('¿Deseas actualizar el archivo de despliegue con el nuevo administrador? (S/N): ');
                
                if (updateFile.toUpperCase() === 'S') {
                    const deploymentInfoPath = path.resolve(__dirname, '../../soroban_contract/token_deployment_info.json');
                    
                    if (fs.existsSync(deploymentInfoPath)) {
                        try {
                            const deploymentData = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
                            
                            // Actualizar el administrador en los datos de despliegue
                            if (deploymentData.admin) {
                                deploymentData.admin.publicKey = newAdminPublicKey;
                                // Nota: No podemos actualizar la clave secreta aquí
                                console.log('⚠️ Solo se actualizó la clave pública del administrador. La clave secreta debe ser actualizada manualmente.');
                            } else {
                                deploymentData.admin = { publicKey: newAdminPublicKey };
                            }
                            
                            // Guardar los datos actualizados
                            fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentData, null, 2));
                            console.log('✅ Archivo de despliegue actualizado con éxito.');
                        } catch (err) {
                            console.error('❌ Error al actualizar el archivo de despliegue:', err);
                        }
                    } else {
                        console.log('❌ No se encontró el archivo de despliegue.');
                    }
                }
            }
        } else {
            console.log(`❌ Error al cambiar administrador: ${result.error}`);
        }
    } catch (error: any) {
        console.error('❌ Error en la operación:', error.message || error);
    }
}

// Exportar la función para uso externo
export { testTokenWallet };

// Si este archivo se ejecuta directamente, ejecutar la prueba
if (require.main === module) {
    testTokenWallet().catch(error => {
        console.error('Error general:', error);
        process.exit(1);
    });
} 