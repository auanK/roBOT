import dns from "dns";

// Verifica se há conexão com a internet
export function waitForInternet(timeout = 15000) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      dns.lookup("google.com", (err) => {
        if (!err) {
          clearInterval(interval);
          resolve(true);
        }
      });
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      resolve(false);
    }, timeout);
  });
}
