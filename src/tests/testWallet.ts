import { StellarWalletKit } from '../lib';
import { AccountStorage } from '../lib';
import * as readline from 'readline';
import { StoredAccount } from '../lib/interfaces/wallet.interface';

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
 * Función principal de prueba
 */
async function testStellarWallet() {
    console.log('📱 Iniciando pruebas de StellarWalletKit...\n');
    
    // Crear una instancia del kit (usando testnet)
    const walletKit = new StellarWalletKit(true);
    
    // Inicializar el almacenamiento de cuentas
    const accountStorage = new AccountStorage('src/tests/test-accounts.json');
    
    // Obtener cuentas existentes en testnet
    const existingAccounts = accountStorage.getAccounts('testnet');
    
    let account;
    let secondAccount;
    
    // Comprobar si hay cuentas almacenadas
    if (existingAccounts.length >= 2) {
        // Preguntar al usuario si quiere reutilizar cuentas existentes
        console.log('Se encontraron cuentas existentes:');
        
        existingAccounts.forEach((acc: StoredAccount, index: number) => {
            console.log(`${index + 1}. ${acc.name || 'Sin nombre'} - ${acc.publicKey} (creada el ${new Date(acc.dateCreated).toLocaleString()})`);
        });
        
        const useExisting = await question('\n¿Deseas usar cuentas existentes? (s/n): ');
        
        if (useExisting.toLowerCase() === 's') {
            let mainAccountIndex = parseInt(await question('Índice de la cuenta principal: ')) - 1;
            if (isNaN(mainAccountIndex) || mainAccountIndex < 0 || mainAccountIndex >= existingAccounts.length) {
                console.log('❌ Índice inválido. Usando la primera cuenta.');
                mainAccountIndex = 0;
            }
            
            let secondAccountIndex = parseInt(await question('Índice de la cuenta secundaria: ')) - 1;
            if (isNaN(secondAccountIndex) || secondAccountIndex < 0 || secondAccountIndex >= existingAccounts.length || secondAccountIndex === mainAccountIndex) {
                console.log('❌ Índice inválido. Usando la segunda cuenta disponible.');
                secondAccountIndex = mainAccountIndex === 0 ? 1 : 0;
            }
            
            account = existingAccounts[mainAccountIndex];
            secondAccount = existingAccounts[secondAccountIndex];
            
            console.log('\n✅ Usando cuentas existentes:');
            console.log(`   📋 Cuenta principal: ${account.publicKey}`);
            console.log(`   📋 Cuenta secundaria: ${secondAccount.publicKey}`);
        } else {
            // Crear nuevas cuentas
            await createAndTestAccounts(walletKit, accountStorage);
            rl.close();
            return;
        }
    } else {
        // No hay suficientes cuentas almacenadas, crear nuevas
        await createAndTestAccounts(walletKit, accountStorage);
        rl.close();
        return;
    }
    
    // Obtener información de las cuentas
    console.log('\n3️⃣ Obteniendo información de las cuentas...');
    
    const accountInfo = await walletKit.getAccountInfo(account.publicKey);
    const secondAccountInfo = await walletKit.getAccountInfo(secondAccount.publicKey);
    
    if (accountInfo && secondAccountInfo) {
        console.log('✅ Información de la cuenta principal:');
        console.log('   💰 Balance:', accountInfo.balance, 'XLM');
        console.log('   🔢 Sequence:', accountInfo.sequence);
        console.log('   🔗 Explorer:', walletKit.getExplorerUrl('account', account.publicKey));
        
        console.log('\n✅ Información de la cuenta secundaria:');
        console.log('   💰 Balance:', secondAccountInfo.balance, 'XLM');
        console.log('   🔢 Sequence:', secondAccountInfo.sequence);
        console.log('   🔗 Explorer:', walletKit.getExplorerUrl('account', secondAccount.publicKey));
        
        // Preguntar si quiere enviar un pago
        const sendPayment = await question('\n¿Deseas enviar un pago entre estas cuentas? (s/n): ');
        
        if (sendPayment.toLowerCase() === 's') {
            const amount = await question('Cantidad a enviar (XLM): ');
            const direction = await question('Dirección (1: principal->secundaria, 2: secundaria->principal): ');
            
            let sourceAccount, destinationAccount;
            if (direction === '2') {
                sourceAccount = secondAccount;
                destinationAccount = account;
                console.log(`\n7️⃣ Enviando ${amount} XLM de la cuenta secundaria a la principal...`);
            } else {
                sourceAccount = account;
                destinationAccount = secondAccount;
                console.log(`\n7️⃣ Enviando ${amount} XLM de la cuenta principal a la secundaria...`);
            }
            
            const memo = await question('Memo (opcional): ');
            
            const paymentResult = await walletKit.sendPayment(
                sourceAccount.secretKey,
                destinationAccount.publicKey,
                amount,
                { memo }
            );
            
            if (paymentResult.success) {
                console.log('✅ Pago enviado exitosamente!');
                console.log('   📝 Hash de la transacción:', paymentResult.hash);
                console.log('   🔗 Explorer:', walletKit.getExplorerUrl('transaction', paymentResult.hash!));
                
                // 8. Verificar los balances finales
                console.log('\n8️⃣ Verificando los balances finales...');
                const finalAccount1 = await walletKit.getAccountInfo(account.publicKey);
                const finalAccount2 = await walletKit.getAccountInfo(secondAccount.publicKey);
                
                console.log('✅ Balance final de la cuenta principal:', finalAccount1?.balance, 'XLM');
                console.log('✅ Balance final de la cuenta secundaria:', finalAccount2?.balance, 'XLM');
            } else {
                console.log('❌ Error al enviar el pago:', paymentResult.error);
            }
        }
    } else {
        console.log('❌ No se pudo obtener información de las cuentas. Es posible que no estén activas en la red.');
    }
    
    console.log('\n🏁 Pruebas completadas!');
    rl.close();
}

/**
 * Función para crear y probar nuevas cuentas
 */
async function createAndTestAccounts(walletKit: StellarWalletKit, accountStorage: AccountStorage) {
    // 1. Generar una nueva cuenta
    console.log('1️⃣ Generando un nuevo par de claves (keypair)...');
    const newAccount = walletKit.generateKeypair();
    console.log('✅ Par de claves generado:');
    console.log('   📋 Public Key:', newAccount.publicKey);
    console.log('   🔑 Secret Key:', newAccount.secretKey);
    console.log('   🔗 Explorer:', walletKit.getExplorerUrl('account', newAccount.publicKey));
    console.log('\nNota: La cuenta aún no existe en la blockchain hasta que reciba fondos.');
    
    // Guardar la cuenta en el almacenamiento
    const accountName = await question('Nombre para esta cuenta (opcional): ');
    accountStorage.addAccount(newAccount, accountName || 'Cuenta principal', 'testnet');
    console.log('✅ Cuenta guardada en el almacenamiento.');
    
    // 2. Fondear la cuenta con Friendbot
    console.log('\n2️⃣ Fondeando la cuenta con Friendbot...');
    const fundResult = await walletKit.fundAccountWithFriendbot(newAccount.publicKey);
    
    if (fundResult.success) {
        console.log('✅ Cuenta fondeada exitosamente!');
        console.log('   📝 Hash de la transacción:', fundResult.hash);
        console.log('   🔗 Explorer:', walletKit.getExplorerUrl('transaction', fundResult.hash!));
        
        // 3. Obtener información de la cuenta
        console.log('\n3️⃣ Obteniendo información de la cuenta...');
        const accountInfo = await walletKit.getAccountInfo(newAccount.publicKey);
        
        if (accountInfo) {
            console.log('✅ Información de la cuenta:');
            console.log('   💰 Balance:', accountInfo.balance, 'XLM');
            console.log('   🔢 Sequence:', accountInfo.sequence);
            
            // 4. Crear una segunda cuenta para pruebas
            console.log('\n4️⃣ Generando una segunda cuenta para pruebas...');
            const newSecondAccount = walletKit.generateKeypair();
            console.log('✅ Segunda cuenta generada:');
            console.log('   📋 Public Key:', newSecondAccount.publicKey);
            console.log('   🔑 Secret Key:', newSecondAccount.secretKey);
            
            // Guardar la segunda cuenta en el almacenamiento
            const secondAccountName = await question('Nombre para la segunda cuenta (opcional): ');
            accountStorage.addAccount(newSecondAccount, secondAccountName || 'Cuenta secundaria', 'testnet');
            console.log('✅ Segunda cuenta guardada en el almacenamiento.');
            
            // 5. Crear y fondear la segunda cuenta
            console.log('\n5️⃣ Creando la segunda cuenta en la blockchain...');
            const createResult = await walletKit.createAccount(
                newAccount.secretKey,
                newSecondAccount.publicKey,
                '100',
                { memo: 'New account' }
            );
            
            if (createResult.success) {
                console.log('✅ Segunda cuenta creada exitosamente!');
                console.log('   📝 Hash de la transacción:', createResult.hash);
                console.log('   🔗 Explorer:', walletKit.getExplorerUrl('transaction', createResult.hash!));
                
                // 6. Verificar el balance de la segunda cuenta
                console.log('\n6️⃣ Verificando el balance de la segunda cuenta...');
                const secondAccountInfo = await walletKit.getAccountInfo(newSecondAccount.publicKey);
                
                if (secondAccountInfo) {
                    console.log('✅ Balance de la segunda cuenta:', secondAccountInfo.balance, 'XLM');
                    
                    // 7. Enviar un pago entre cuentas
                    console.log('\n7️⃣ Enviando un pago de 50 XLM de la primera cuenta a la segunda...');
                    const paymentResult = await walletKit.sendPayment(
                        newAccount.secretKey,
                        newSecondAccount.publicKey,
                        '50',
                        { memo: 'Test payment' }
                    );
                    
                    if (paymentResult.success) {
                        console.log('✅ Pago enviado exitosamente!');
                        console.log('   📝 Hash de la transacción:', paymentResult.hash);
                        console.log('   🔗 Explorer:', walletKit.getExplorerUrl('transaction', paymentResult.hash!));
                        
                        // 8. Verificar los balances finales
                        console.log('\n8️⃣ Verificando los balances finales...');
                        const finalAccount1 = await walletKit.getAccountInfo(newAccount.publicKey);
                        const finalAccount2 = await walletKit.getAccountInfo(newSecondAccount.publicKey);
                        
                        console.log('✅ Balance final de la primera cuenta:', finalAccount1?.balance, 'XLM');
                        console.log('✅ Balance final de la segunda cuenta:', finalAccount2?.balance, 'XLM');
                    } else {
                        console.log('❌ Error al enviar el pago:', paymentResult.error);
                    }
                } else {
                    console.log('❌ No se pudo obtener información de la segunda cuenta');
                }
            } else {
                console.log('❌ Error al crear la segunda cuenta:', createResult.error);
            }
        } else {
            console.log('❌ No se pudo obtener información de la cuenta');
        }
    } else {
        console.log('❌ Error al fondear la cuenta:', fundResult.error);
    }
}

// Ejecutar las pruebas
testStellarWallet().catch(error => {
    console.error('Error en las pruebas:', error);
    rl.close();
}); 