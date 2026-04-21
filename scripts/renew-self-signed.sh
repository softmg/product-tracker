#!/usr/bin/env sh
set -eu

umask 077

CERTS_DIR="${CERTS_DIR:-./config/certs}"
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

if [ ! -f "${CERTS_DIR}/rootCA.key" ] || [ ! -f "${CERTS_DIR}/rootCA.crt" ]; then
  echo "rootCA.key/rootCA.crt not found in ${CERTS_DIR}. Run scripts/init-self-signed.sh first."
  exit 1
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

echo "Renewed server certificate"
