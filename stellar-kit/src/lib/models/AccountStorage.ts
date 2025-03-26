import * as fs from 'fs';
import * as path from 'path';
import { StoredAccount } from '../interfaces/wallet.interface';

/**
 * Clase para gestionar el almacenamiento de cuentas
 */
export class AccountStorage {
    private filePath: string;
    private accounts: StoredAccount[] = [];

    /**
     * Constructor
     * @param fileName Nombre del archivo donde se almacenarán las cuentas
     */
    constructor(fileName: string = 'stellar-accounts.json') {
        this.filePath = path.resolve(process.cwd(), fileName);
        this.loadAccounts();
    }

    /**
     * Carga las cuentas desde el archivo
     */
    private loadAccounts(): void {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                this.accounts = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error al cargar las cuentas:', error);
            this.accounts = [];
        }
    }

    /**
     * Guarda las cuentas en el archivo
     */
    private saveAccounts(): void {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.accounts, null, 2), 'utf8');
        } catch (error) {
            console.error('Error al guardar las cuentas:', error);
        }
    }

    /**
     * Agrega una nueva cuenta al almacenamiento
     * @param account Cuenta a agregar
     * @param name Nombre opcional para identificar la cuenta
     * @param network Red en la que se creó la cuenta
     * @returns La cuenta almacenada
     */
    addAccount(
        account: { publicKey: string; secretKey: string },
        name?: string,
        network: 'testnet' | 'public' = 'testnet'
    ): StoredAccount {
        // Comprobar si la cuenta ya existe
        const existingAccount = this.accounts.find(a => a.publicKey === account.publicKey);
        if (existingAccount) {
            return existingAccount;
        }

        // Crear la nueva cuenta
        const storedAccount: StoredAccount = {
            publicKey: account.publicKey,
            secretKey: account.secretKey,
            name,
            dateCreated: new Date().toISOString(),
            network
        };

        // Añadir la cuenta al array y guardar
        this.accounts.push(storedAccount);
        this.saveAccounts();

        return storedAccount;
    }

    /**
     * Obtiene todas las cuentas almacenadas
     * @param network Filtrar por red (opcional)
     * @returns Array de cuentas
     */
    getAccounts(network?: 'testnet' | 'public'): StoredAccount[] {
        if (network) {
            return this.accounts.filter(account => account.network === network);
        }
        return [...this.accounts];
    }

    /**
     * Obtiene una cuenta por su clave pública
     * @param publicKey Clave pública de la cuenta
     * @returns La cuenta encontrada o null
     */
    getAccountByPublicKey(publicKey: string): StoredAccount | null {
        const account = this.accounts.find(a => a.publicKey === publicKey);
        return account || null;
    }

    /**
     * Obtiene una cuenta por su nombre
     * @param name Nombre de la cuenta
     * @returns La cuenta encontrada o null
     */
    getAccountByName(name: string): StoredAccount | null {
        const account = this.accounts.find(a => a.name === name);
        return account || null;
    }

    /**
     * Elimina una cuenta por su clave pública
     * @param publicKey Clave pública de la cuenta a eliminar
     * @returns true si se eliminó correctamente, false en caso contrario
     */
    removeAccount(publicKey: string): boolean {
        const initialLength = this.accounts.length;
        this.accounts = this.accounts.filter(a => a.publicKey !== publicKey);
        
        if (initialLength !== this.accounts.length) {
            this.saveAccounts();
            return true;
        }
        
        return false;
    }

    /**
     * Actualiza los datos de una cuenta
     * @param publicKey Clave pública de la cuenta a actualizar
     * @param data Nuevos datos para la cuenta
     * @returns La cuenta actualizada o null si no se encontró
     */
    updateAccount(
        publicKey: string,
        data: Partial<Omit<StoredAccount, 'publicKey' | 'dateCreated'>>
    ): StoredAccount | null {
        const accountIndex = this.accounts.findIndex(a => a.publicKey === publicKey);
        
        if (accountIndex !== -1) {
            this.accounts[accountIndex] = {
                ...this.accounts[accountIndex],
                ...data
            };
            
            this.saveAccounts();
            return this.accounts[accountIndex];
        }
        
        return null;
    }
} 