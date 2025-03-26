import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// Interfaz para la información de cuentas almacenadas
interface StoredAccount {
    publicKey: string;
    secretKey: string;
    name?: string;
    dateCreated: string;
    network: 'testnet' | 'public';
}

// Interfaz para la información del contrato
interface ContractInfo {
    deploymentDate: string;
    network: 'testnet' | 'public';
    contractId: string;
    admin: {
        publicKey: string;
        secretKey: string;
        name?: string;
    };
    token: {
        name: string;
        symbol: string;
        decimals: number;
        initialSupply: string;
    };
    initialHolders: Array<{
        publicKey: string;
        name?: string;
        balance: string;
    }>;
    transactions: Array<{
        type: string;
        hash: string;
        date: string;
        description: string;
    }>;
}

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para preguntar al usuario
function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

// Configuración de la red
const isTestnet = true; 
const networkPassphrase = isTestnet ? 
    "Test SDF Network ; September 2015" : 
    "Public Global Stellar Network ; September 2015";
const rpcUrl = isTestnet ? 
    "https://soroban-testnet.stellar.org" : 
    "https://soroban.stellar.org";

// Ruta a los archivos importantes
const ACCOUNTS_PATH = path.resolve(__dirname, '../accounts.json');
const WASM_PATH = path.resolve(__dirname, '../../target/wasm32-unknown-unknown/release/stellar_token.wasm');
const CONTRACT_INFO_PATH = path.resolve(__dirname, '../../token_deployment_info.json');

// Configuración del token (se podrá modificar durante la ejecución)
let TOKEN_CONFIG = {
    name: 'MyTestToken',
    symbol: 'MTT',
    decimal: 7, // Igual que XLM
    initialSupply: '1000000', // 1,000,000 tokens
};

// Función para cargar cuentas almacenadas
function loadStoredAccounts(): StoredAccount[] {
    try {
        if (fs.existsSync(ACCOUNTS_PATH)) {
            const data = fs.readFileSync(ACCOUNTS_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error al cargar las cuentas almacenadas:', error);
    }
    return [];
}

// Función para ejecutar comandos de la CLI de Stellar
function execStellarCommand(command: string): string {
    try {
        return execSync(command, { encoding: 'utf8' });
    } catch (error) {
        console.error('Error al ejecutar comando de Stellar CLI:', error);
        throw error;
    }
}

// Función para verificar el balance de una cuenta
async function checkAccountBalance(publicKey: string): Promise<boolean> {
    try {
        console.log(`Verificando si la cuenta ${publicKey} ya existe y tiene fondos...`);
        
        // Usamos el comando curl para consultar a Horizon directamente
        const command = `curl -s "https://horizon-testnet.stellar.org/accounts/${publicKey}"`;
        
        try {
            const response = execSync(command, { encoding: 'utf8' });
            
            // Si no hay error en el comando, intentamos parsear la respuesta
            try {
                const accountData = JSON.parse(response);
                
                // Buscar el balance de XLM nativo
                const nativeBalance = accountData.balances.find((b: any) => b.asset_type === 'native');
                
                if (nativeBalance) {
                    const balance = parseFloat(nativeBalance.balance);
                    console.log(`La cuenta existe en la red.`);
                    console.log(`Balance actual: ${balance} XLM`);
                    return balance > 0;
                }
                
                return true; // La cuenta existe pero no pudimos determinar el balance
            } catch (parseError) {
                console.error('Error al analizar la respuesta de Horizon:', parseError);
                return false;
            }
        } catch (error) {
            // Si hay un error, verificamos si es porque la cuenta no existe (error 404)
            const errorOutput = (error as any).stderr?.toString() || '';
            if (errorOutput.includes('404') || errorOutput.includes('Not Found')) {
                console.log('La cuenta no existe en la red.');
            } else {
                console.error('Error al comunicarse con Horizon:', error);
            }
            return false;
        }
    } catch (error) {
        console.error('Error al verificar el balance de la cuenta:', error);
        return false;
    }
}

// Función para fondear una cuenta con la Friendbot (solo testnet)
async function fundWithFriendbot(publicKey: string): Promise<string | null> {
    try {
        // Primero verificamos si la cuenta ya tiene fondos
        const hasBalance = await checkAccountBalance(publicKey);
        
        if (hasBalance) {
            console.log('La cuenta ya tiene fondos. No es necesario usar Friendbot.');
            return null;
        }
        
        console.log(`Fondeando cuenta ${publicKey} con Friendbot...`);
        // Usamos un comando más directo que muestra todo el detalle
        const command = `curl -X POST "https://friendbot.stellar.org?addr=${publicKey}" -s`;
        
        const responseText = execSync(command, { encoding: 'utf8' });
        
        try {
            // Intentamos parsear como JSON
            const response = JSON.parse(responseText);
            
            // La respuesta de Friendbot ha cambiado con el tiempo, intentamos diferentes formatos
            let txHash = 'desconocido';
            
            if (response && response.hash) {
                txHash = response.hash;
            } else if (response && response._links && response._links.transaction && response._links.transaction.href) {
                // Extraer el hash de la URL de la transacción
                const txUrl = response._links.transaction.href;
                const hashMatch = txUrl.match(/tx\/([a-zA-Z0-9]+)/);
                txHash = hashMatch ? hashMatch[1] : 'desconocido';
            } else if (response && response.successful && response.id) {
                // Nuevo formato posible
                txHash = response.id;
            }
            
            console.log('Cuenta fondeada exitosamente!');
            console.log('Hash de transacción:', txHash);
            return txHash;
            
        } catch (parseError) {
            console.log('La respuesta no es un JSON válido. Verificando si la cuenta fue fondeada...');
            
            // Verificamos si la cuenta se fondeó correctamente, incluso sin poder extraer el hash
            const hasBalanceAfter = await checkAccountBalance(publicKey);
            if (hasBalanceAfter) {
                console.log('Cuenta fondeada exitosamente! (Hash no disponible)');
                return 'txhash-no-disponible';
            } else {
                console.error('Error al fondear la cuenta. Respuesta de Friendbot:', responseText);
                return null;
            }
        }
    } catch (error) {
        console.error('Error al fondear la cuenta:', error);
        return null;
    }
}

// Función para generar una nueva cuenta
function generateNewAccount(name: string): { publicKey: string, secretKey: string } {
    try {
        console.log(`Generando nueva cuenta con nombre: ${name}...`);
        const outputSecret = execStellarCommand(`stellar keys generate ${name} --as-secret --no-fund`);
        console.log('Cuenta generada exitosamente.');
        
        const secretKey = outputSecret.trim();
        const outputPublic = execStellarCommand(`stellar keys public-key ${name}`);
        const publicKey = outputPublic.trim();
        
        return {
            publicKey,
            secretKey
        };
    } catch (error) {
        console.error('Error al generar cuenta:', error);
        throw error;
    }
}

// Función para verificar el balance de un token
async function checkTokenBalance(contractId: string, publicKey: string): Promise<string> {
    try {
        console.log(`Verificando balance del token para la cuenta ${publicKey}...`);
        
        const command = `stellar contract invoke \
            --id ${contractId} \
            --source ${publicKey} \
            --rpc-url ${rpcUrl} \
            --network-passphrase "${networkPassphrase}" \
            -- \
            balance \
            --id ${publicKey}`;
        
        const result = execStellarCommand(command).trim();
        return result;
    } catch (error) {
        console.error('Error al verificar el balance del token:', error);
        return 'Error al verificar balance';
    }
}

// Función para acuñar tokens al admin (opcional)
async function mintTokens(contractId: string, adminSecretKey: string, adminPublicKey: string, amount: string): Promise<void> {
    try {
        console.log(`Acuñando ${amount} tokens a la cuenta ${adminPublicKey}...`);
        
        const command = `stellar contract invoke \
            --id ${contractId} \
            --source ${adminSecretKey} \
            --rpc-url ${rpcUrl} \
            --network-passphrase "${networkPassphrase}" \
            -- \
            mint \
            --to ${adminPublicKey} \
            --amount ${amount}`;
        
        execStellarCommand(command);
        console.log(`✅ Tokens acuñados exitosamente.`);
    } catch (error) {
        console.error('Error al acuñar tokens:', error);
    }
}

// Función principal para desplegar el contrato
async function deployContract(): Promise<void> {
    console.log('🚀 Iniciando despliegue de contrato SEP-20 en Soroban...\n');
    
    // Cargar cuentas almacenadas
    const storedAccounts = loadStoredAccounts();
    let contractInfo: ContractInfo = {
        deploymentDate: new Date().toISOString(),
        network: isTestnet ? 'testnet' : 'public',
        contractId: '',
        admin: {
            publicKey: '',
            secretKey: ''
        },
        token: {
            name: TOKEN_CONFIG.name,
            symbol: TOKEN_CONFIG.symbol,
            decimals: TOKEN_CONFIG.decimal,
            initialSupply: TOKEN_CONFIG.initialSupply
        },
        initialHolders: [],
        transactions: []
    };
    
    // Verificar si hay cuentas almacenadas
    let adminPublicKey = '';
    let adminSecretKey = '';
    let adminName = '';
    
    if (storedAccounts.length > 0) {
        console.log('Se encontraron cuentas existentes:');
        
        storedAccounts.forEach((acc, index) => {
            console.log(`${index + 1}. ${acc.name || 'Sin nombre'} - ${acc.publicKey} (creada el ${new Date(acc.dateCreated).toLocaleString()})`);
        });
        
        const useExisting = await question('\n¿Deseas usar una cuenta existente como administrador? (s/n): ');
        
        if (useExisting.toLowerCase() === 's') {
            const accountIndex = parseInt(await question('Índice de la cuenta: ')) - 1;
            
            if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= storedAccounts.length) {
                console.log('❌ Índice inválido. Se creará una nueva cuenta.');
                // Generamos una nueva cuenta usando el comando actualizado
                const accountName = `admin-${Date.now()}`;
                try {
                    // Generar la cuenta primero
                    const generateOutput = execStellarCommand(`stellar keys generate ${accountName} --as-secret --no-fund`);
                    adminSecretKey = generateOutput.trim();
                    
                    // Obtener la clave pública
                    const publicKeyOutput = execStellarCommand(`stellar keys public-key ${accountName}`);
                    adminPublicKey = publicKeyOutput.trim();
                    
                    adminName = await question('Nombre para esta cuenta (opcional): ') || 'Administrador del Token';
                } catch(e) {
                    console.error('Error al generar la cuenta:', e);
                    rl.close();
                    return;
                }
            } else {
                const selectedAccount = storedAccounts[accountIndex];
                adminPublicKey = selectedAccount.publicKey;
                adminSecretKey = selectedAccount.secretKey;
                adminName = selectedAccount.name || '';
                console.log(`✅ Usando cuenta "${selectedAccount.name || 'Sin nombre'}" como administrador.`);
            }
        } else {
            // Generamos una nueva cuenta usando el comando actualizado
            const accountName = `admin-${Date.now()}`;
            try {
                // Generar la cuenta primero
                const generateOutput = execStellarCommand(`stellar keys generate ${accountName} --as-secret --no-fund`);
                adminSecretKey = generateOutput.trim();
                
                // Obtener la clave pública
                const publicKeyOutput = execStellarCommand(`stellar keys public-key ${accountName}`);
                adminPublicKey = publicKeyOutput.trim();
                
                adminName = await question('Nombre para esta cuenta (opcional): ') || 'Administrador del Token';
            } catch(e) {
                console.error('Error al generar la cuenta:', e);
                rl.close();
                return;
            }
        }
    } else {
        // Generamos una nueva cuenta usando el comando actualizado
        const accountName = `admin-${Date.now()}`;
        try {
            // Generar la cuenta primero
            const generateOutput = execStellarCommand(`stellar keys generate ${accountName} --as-secret --no-fund`);
            adminSecretKey = generateOutput.trim();
            
            // Obtener la clave pública
            const publicKeyOutput = execStellarCommand(`stellar keys public-key ${accountName}`);
            adminPublicKey = publicKeyOutput.trim();
            
            adminName = await question('Nombre para esta cuenta (opcional): ') || 'Administrador del Token';
        } catch(e) {
            console.error('Error al generar la cuenta:', e);
            rl.close();
            return;
        }
    }
    
    // Guardar información del administrador
    contractInfo.admin = {
        publicKey: adminPublicKey,
        secretKey: adminSecretKey,
        name: adminName
    };
    
    console.log('\n1️⃣ Información del administrador:');
    console.log(`   Clave pública: ${adminPublicKey}`);
    console.log(`   Nombre: ${adminName || 'Sin nombre'}`);
    
    // Fondear la cuenta del administrador (en testnet)
    if (isTestnet) {
        const txHash = await fundWithFriendbot(adminPublicKey);
        if (txHash) {
            contractInfo.transactions.push({
                type: 'funding',
                hash: txHash,
                date: new Date().toISOString(),
                description: 'Fondeo inicial de la cuenta del administrador'
            });
        }
    } else {
        console.log('ADVERTENCIA: En la red principal, debes fondear manualmente esta cuenta.');
        rl.close();
        return;
    }
    
    // Personalizar el token
    console.log('\n2️⃣ Configuración del token:');
    console.log('   (Presiona Enter para mantener los valores predeterminados)');
    
    const customName = await question(`Nombre del token [${TOKEN_CONFIG.name}]: `);
    const customSymbol = await question(`Símbolo del token [${TOKEN_CONFIG.symbol}]: `);
    const customDecimals = await question(`Decimales [${TOKEN_CONFIG.decimal}]: `);
    const customInitialSupply = await question(`Suministro inicial [${TOKEN_CONFIG.initialSupply}]: `);
    
    if (customName) TOKEN_CONFIG.name = customName;
    if (customSymbol) TOKEN_CONFIG.symbol = customSymbol;
    if (customDecimals && !isNaN(parseInt(customDecimals))) TOKEN_CONFIG.decimal = parseInt(customDecimals);
    if (customInitialSupply) TOKEN_CONFIG.initialSupply = customInitialSupply;
    
    // Actualizar la información del token en el objeto contractInfo
    contractInfo.token = {
        name: TOKEN_CONFIG.name,
        symbol: TOKEN_CONFIG.symbol,
        decimals: TOKEN_CONFIG.decimal,
        initialSupply: TOKEN_CONFIG.initialSupply
    };
    
    console.log('\n✅ Configuración del token:');
    console.log(`   Nombre: ${TOKEN_CONFIG.name}`);
    console.log(`   Símbolo: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Decimales: ${TOKEN_CONFIG.decimal}`);
    console.log(`   Suministro inicial: ${TOKEN_CONFIG.initialSupply}`);
    
    try {
        // Verificar si el archivo WASM existe
        if (!fs.existsSync(WASM_PATH)) {
            console.error(`\n❌ El archivo WASM no existe en: ${WASM_PATH}`);
            console.error('Debes compilar el contrato primero usando:');
            console.error('cargo build --target wasm32-unknown-unknown --release');
            rl.close();
            return;
        }
        
        console.log(`\n3️⃣ Contrato WASM encontrado en: ${WASM_PATH}`);
        
        // Desplegar el contrato utilizando la CLI de Stellar
        console.log('\n4️⃣ Desplegando el contrato...');
        
        const deployCommand = `stellar contract deploy \
            --wasm ${WASM_PATH} \
            --source ${adminSecretKey} \
            --rpc-url ${rpcUrl} \
            --network-passphrase "${networkPassphrase}" \
            -- \
            --admin ${adminPublicKey} \
            --decimal ${TOKEN_CONFIG.decimal} \
            --name ${TOKEN_CONFIG.name} \
            --symbol ${TOKEN_CONFIG.symbol}`;
        
        const deployResult = execStellarCommand(deployCommand).trim();
        console.log(`   ✅ Contrato desplegado con éxito. ID: ${deployResult}`);
        
        // Guardar el ID del contrato
        contractInfo.contractId = deployResult;
        
        // Guardar la información del contrato
        fs.writeFileSync(CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
        
        console.log('\n✅ Información del contrato guardada exitosamente.');
        console.log(`   El contrato ya fue inicializado durante el despliegue con método '__constructor'.`);
        
        // Verificar el balance inicial
        console.log('\n6️⃣ Verificando el balance inicial del administrador...');
        const initialBalance = await checkTokenBalance(deployResult, adminPublicKey);
        console.log(`   Balance inicial: ${initialBalance}`);
        
        // Acuñar automáticamente el suministro inicial
        if (initialBalance === '0' && TOKEN_CONFIG.initialSupply !== '0') {
            console.log(`\n7️⃣ Acuñando suministro inicial de ${TOKEN_CONFIG.initialSupply} tokens para el administrador...`);
            await mintTokens(deployResult, adminSecretKey, adminPublicKey, TOKEN_CONFIG.initialSupply);
            
            // Verificar el nuevo balance
            console.log('\nVerificando el nuevo balance después de acuñar...');
            const newBalance = await checkTokenBalance(deployResult, adminPublicKey);
            console.log(`   Nuevo balance: ${newBalance}`);
            
            // Actualizar transactions en contractInfo
            contractInfo.transactions.push({
                type: 'mint',
                hash: 'acuñación_inicial',
                date: new Date().toISOString(),
                description: `Acuñación del suministro inicial de ${TOKEN_CONFIG.initialSupply} tokens al administrador`
            });
            
            // Guardar la información actualizada
            fs.writeFileSync(CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
        }
        
        // Preguntar si quiere acuñar tokens adicionales
        const mintAnswer = await question('\n¿Deseas acuñar tokens adicionales para el administrador? (s/n): ');
        
        if (mintAnswer.toLowerCase() === 's') {
            const mintAmount = await question('Cantidad de tokens adicionales a acuñar: ');
            await mintTokens(deployResult, adminSecretKey, adminPublicKey, mintAmount);
            
            // Verificar el nuevo balance
            console.log('\nVerificando el nuevo balance después de acuñar...');
            const newBalance = await checkTokenBalance(deployResult, adminPublicKey);
            console.log(`   Nuevo balance: ${newBalance}`);
            
            // Actualizar transactions en contractInfo
            contractInfo.transactions.push({
                type: 'mint',
                hash: 'acuñación_adicional',
                date: new Date().toISOString(),
                description: `Acuñación adicional de ${mintAmount} tokens al administrador`
            });
            
            // Guardar la información actualizada
            fs.writeFileSync(CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
        }
    } catch (error) {
        console.error('Error al desplegar el contrato:', error);
    }
}

deployContract();
