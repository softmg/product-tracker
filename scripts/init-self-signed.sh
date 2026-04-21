#!/usr/bin/env sh
set -eu

umask 077

CERTS_DIR="${CERTS_DIR:-./config/certs}"
CA_DAYS="${CA_DAYS:-3650}"
CERT_DAYS="${CERT_DAYS:-90}"
ENV_FILE="${ENV_FILE:-.env}"
CNF_FILE="$(mktemp)"
CSR_FILE="${CERTS_DIR}/server.csr"

read_env_var() {
  key="$1"
  if [ -f "${ENV_FILE}" ]; then
    grep -E "^${key}=" "${ENV_FILE}" | tail -n1 | cut -d '=' -f2- || true
  fi
}

PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-}"
if [ -z "${PRIMARY_DOMAIN}" ]; then
  PRIMARY_DOMAIN="$(read_env_var APP_DOMAIN)"
fi
if [ -z "${PRIMARY_DOMAIN}" ]; then
  PRIMARY_DOMAIN="app.local"
fi

API_DOMAIN="${API_DOMAIN:-}"
if [ -z "${API_DOMAIN}" ]; then
  API_DOMAIN="$(read_env_var API_DOMAIN)"
fi
if [ -z "${API_DOMAIN}" ]; then
  API_DOMAIN="api.local"
fi

cleanup() {
  rm -f "${CNF_FILE}" "${CSR_FILE}"
}
trap cleanup EXIT

mkdir -p "${CERTS_DIR}"

if [ ! -f "${CERTS_DIR}/rootCA.key" ]; then
  openssl genrsa -out "${CERTS_DIR}/rootCA.key" 4096
fi

if [ ! -f "${CERTS_DIR}/rootCA.crt" ]; then
  openssl req -x509 -new -nodes -key "${CERTS_DIR}/rootCA.key" -sha256 -days "${CA_DAYS}" -out "${CERTS_DIR}/rootCA.crt" -subj "/CN=Product Tracker Internal CA"
fi

cat > "${CNF_FILE}" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = ${PRIMARY_DOMAIN}

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${PRIMARY_DOMAIN}
DNS.2 = ${API_DOMAIN}
EOF

openssl req -new -newkey rsa:2048 -nodes -keyout "${CERTS_DIR}/server.key" -out "${CSR_FILE}" -config "${CNF_FILE}"

openssl x509 -req -in "${CSR_FILE}" -CA "${CERTS_DIR}/rootCA.crt" -CAkey "${CERTS_DIR}/rootCA.key" -CAcreateserial -out "${CERTS_DIR}/server.crt" -days "${CERT_DAYS}" -sha256 -extensions req_ext -extfile "${CNF_FILE}"

if [ -f "./config/traefik/dynamic.yml" ]; then
  touch "./config/traefik/dynamic.yml"
fi

echo "Generated certificates in ${CERTS_DIR}"
echo "Install CA certificate on clients: ${CERTS_DIR}/rootCA.crt"
