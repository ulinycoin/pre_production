/**
 * StorageService provides a redundant storage layer for subscription tokens.
 * It uses localStorage as primary and IndexedDB as a backup to prevent data loss 
 * when the browser clears local storage.
 */
class StorageService {
    private static readonly TOKEN_KEY = 'lp_sub_token';
    private static readonly LICENSE_KEY = 'lp_license_key';
    private static readonly DB_NAME = 'LocalPDF_Storage';
    private static readonly STORE_NAME = 'subscription';

    /**
     * Initialize IndexedDB and sync with localStorage
     */
    static async init(): Promise<void> {
        try {
            const dbToken = await this.getFromIndexedDB('token');
            const lsToken = localStorage.getItem(this.TOKEN_KEY);

            if (lsToken && !dbToken) {
                await this.saveToIndexedDB('token', lsToken);
            } else if (!lsToken && dbToken) {
                localStorage.setItem(this.TOKEN_KEY, dbToken);
            }

            const dbLicense = await this.getFromIndexedDB('licenseKey');
            const lsLicense = localStorage.getItem(this.LICENSE_KEY);

            if (lsLicense && !dbLicense) {
                await this.saveToIndexedDB('licenseKey', lsLicense);
            } else if (!lsLicense && dbLicense) {
                localStorage.setItem(this.LICENSE_KEY, dbLicense);
            }
        } catch (e) {
            console.warn('StorageService init failed:', e);
        }
    }

    static async setToken(token: string): Promise<void> {
        localStorage.setItem(this.TOKEN_KEY, token);
        await this.saveToIndexedDB('token', token);
    }

    static async setLicenseKey(key: string): Promise<void> {
        localStorage.setItem(this.LICENSE_KEY, key);
        await this.saveToIndexedDB('licenseKey', key);
    }

    static async getToken(): Promise<string | null> {
        // Try primary first
        let token = localStorage.getItem(this.TOKEN_KEY);

        // Fallback to secondary
        if (!token) {
            token = await this.getFromIndexedDB('token');
            if (token) {
                localStorage.setItem(this.TOKEN_KEY, token);
            }
        }

        return token;
    }

    static async getLicenseKey(): Promise<string | null> {
        let key = localStorage.getItem(this.LICENSE_KEY);
        if (!key) {
            key = await this.getFromIndexedDB('licenseKey');
            if (key) {
                localStorage.setItem(this.LICENSE_KEY, key);
            }
        }
        return key;
    }

    static async clearToken(): Promise<void> {
        localStorage.removeItem(this.TOKEN_KEY);
        await this.removeFromIndexedDB('token');
    }

    static async clearLicenseKey(): Promise<void> {
        localStorage.removeItem(this.LICENSE_KEY);
        await this.removeFromIndexedDB('licenseKey');
    }

    private static openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private static async saveToIndexedDB(key: string, value: string): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put(value, key);
            return new Promise((res) => { tx.oncomplete = () => res(); });
        } catch (e) {
            console.error('IndexedDB save error:', e);
        }
    }

    private static async getFromIndexedDB(key: string): Promise<string | null> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).get(key);
            return new Promise((res) => {
                request.onsuccess = () => res(request.result || null);
                request.onerror = () => res(null);
            });
        } catch (e) {
            return null;
        }
    }

    private static async removeFromIndexedDB(key: string): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).delete(key);
        } catch (e) {
            // Ignore
        }
    }
}

export default StorageService;
