import { randomBytes, scrypt } from "node:crypto";

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  process.stderr.write("Ejecuta este comando en una terminal interactiva.\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Contraseña del administrador: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let password = "";

  process.stdin.on("data", (chunk) => {
    const input = chunk.toString();
    for (const char of input) {
      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        if (password.length < 12) {
          process.stderr.write("Usa al menos 12 caracteres.\n");
          process.exitCode = 1;
          return;
        }
        const salt = randomBytes(32);
        scrypt(
          password,
          salt,
          64,
          { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
          (error, derived) => {
            password = "";
            if (error) {
              process.stderr.write("No se pudo generar el hash.\n");
              process.exitCode = 1;
              return;
            }
            process.stdout.write(
              `ADMIN_PASSWORD_HASH=scrypt:32768:8:1:${salt.toString("base64url")}:${derived.toString("base64url")}\n`,
            );
          },
        );
        return;
      }
      if (char === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        process.exitCode = 130;
        return;
      }
      if (char === "\u007f") password = password.slice(0, -1);
      else password += char;
    }
  });
}
