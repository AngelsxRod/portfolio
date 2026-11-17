/** Clave de `sessionStorage` que recuerda que el arranque ya se mostró. */
export const BOOT_KEY = "angel-os-boot";

type SessionStore = Pick<Storage, "getItem" | "setItem">;

/** `true` si el arranque ya se vio en esta sesión. Sin almacenamiento, se considera visto. */
export function bootSeen(storage: () => SessionStore | undefined) {
  try {
    const store = storage();
    return !store || store.getItem(BOOT_KEY) === "1";
  } catch {
    return true;
  }
}

/** Marca el arranque como visto; ignora navegadores sin almacenamiento. */
export function markBootSeen(storage: () => SessionStore | undefined) {
  try {
    storage()?.setItem(BOOT_KEY, "1");
  } catch {
    // Ventana privada o almacenamiento bloqueado: el arranque no se recuerda.
  }
}

/**
 * Script que corre antes del primer pintado: oculta el arranque si ya se vio,
 * para que no parpadee al volver al inicio en la misma sesión.
 */
export const bootGateScript = `try{if(sessionStorage.getItem(${JSON.stringify(BOOT_KEY)})==="1")document.documentElement.dataset.booted="1"}catch(e){document.documentElement.dataset.booted="1"}`;
