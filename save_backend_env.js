const fs = require('fs');

const serviceAccount = {
  "type": "service_account",
  "project_id": "marriage-expense-manager",
  "private_key_id": "4f9a84316cf703cc9e9021e94de7a40c86016d34",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvVaDih10GwGon\nhGaO+t7NF2vZ5PCo/TvuZGTBAMR9Lrv4KopnGEmJVHKXMtgh5x6X3XBWVOxVWqTZ\nlD2bCd4st75793RCNbiWREsVyvAULR+yf+sM9JBo7LDgNaa8QuUfIR8deZkGkUjk\nWf2Y/F+ooZvV3koc0nPNAAcsJlSmM8YDN8enbJWvQn7OFPIGM1WM/d8OdcFnBsQ6\nyS8r87KzFrvyFfrT1XVZqhuc0vvBai+K5Y8O+y8zYAES0eBbXnUCMHn8OolTYvfY\niUmisrpE5U90EHCVmSAcCILLJXfuGoHPViHnjkLfEi2vnuiEoH1XW0zJcD6T/kxR\neOF+tKl7AgMBAAECggEAFd3VVWsRrFM4P1AWhPkUlaS4y/vuvPntYisdxamVgmc0\nWhw0FpduKbULytTfJPCbXXqTFVvnUt3Idrozf1puXaACHu5wOVxUdlPIvsxdv1EW\nsD7zztx8BhnpaozxC8RBVEM1NjUsDdL2Bu883rowKT++cksUGHQcAme2fUhqgNpP\nQzssY4PyaQwyktQh+sLXygPActzI3YqByNw/p3Md/a6CVevFdzuA0DIk6Pg813nE\n1/Rk9SnaoHq/8JbEy5Ifm9GGSjcDKo7QcGrs4inRDB4HKOBKsKXaE0xUsU1jC0TE\n1pLvhkGYnBfFMtESwE81ExsvseK0At4Egr0ICsjyQQKBgQDZKiGJF8mnflbpl6kq\nWtGUZK/rfjikAoZ+TpkHCB1CboQIG9OlnGAeVs61kWYSjhCzNm2gioo1kLfDxag5\n+8ij/0pbD4prXjRgKi2ZV4sZPbUmLwBl3dRlDpxEGUw4WijxfvPA0N4MWgU85b3S\n1K08FzUABig7VPPxXhqgbI2FDwKBgQDOsIBqM5U2yKSOz8+bb8MQL4suPY2ukT9l\nePywqznpb4fCpiAQzNoRZ1OuByvqINnPTGlUCIeIeKS35KGr+s5YjRhWBD4bEZn+\nWxAvLHV0veIhiVGUaz5sQOxe14lDe6Tiuw0T4By+5xhtKGYMCe1oGaMUed9XA1dM\nz70iLEPM1QKBgQCPEnO/p11irRjDkviPf//9vQwtoR3d6BAFnPCyskTcpIT19qdM\nv6aPtm8/LgjKhrA38c7t6vg9bBe1sj4v3VMFwMaTEb0HGax2ArPCB+wLeB0lh+fC\nNRCed666KtSNd9DrsdETokf4aUJ0KYQTJ6zuHvf7CRNua3y/81ilgn8GPwKBgAcm\nTdrem+vANwkFoT3UOOAndN4NnQgL2DCPZdZKpf8wL3cJPhS2sVhmxZtAfkFkD4S/\nNOmGPgH3gmMmEn2beGXRw6S+EtPm4PfOeJnZJNr78oWMdXj32Lnv6P1C4WmnLkX1\niHdGilgEMHEeM6F4+nBeaqi7qoEdCXkLupQjCdldAoGAdi64gJ3fslfmOaAX/12a\nURUqaPZJFP0tPMRO9ugF8pHTCvkm++u5fOVWeUm0I80Wag7CEjgobUYI0+XMF7rO\nfu2M0paRaHGGr5ScL3mXplB35wN3mAbzzmryRdNkFAFfGLZHPX4r4QYu7MWgips5\nBDjaQHpxEskUMbFb9NdSrSo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@marriage-expense-manager.iam.gserviceaccount.com",
  "client_id": "100070423694393228255",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40marriage-expense-manager.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const envPath = '.env';
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const envVar = `\nFIREBASE_SERVICE_ACCOUNT='${JSON.stringify(serviceAccount)}'\n`;

if (envContent.includes('FIREBASE_SERVICE_ACCOUNT')) {
  envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT=.*(\n|$)/g, envVar);
} else {
  envContent += envVar;
}

fs.writeFileSync(envPath, envContent);
console.log('.env updated successfully with backend Service Account');
