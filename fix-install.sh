#!/bin/bash

echo "Limpiando instalación..."

# Remover node_modules y lockfiles
rm -rf node_modules
rm -rf .next
rm -f pnpm-lock.yaml

# Si estamos en el directorio dental-apibackend, remover el conflicto del padre
if [ -f "../package-lock.json" ]; then
  echo "Removiendo package-lock.json del directorio padre..."
  rm ../package-lock.json
fi

echo "Instalando dependencias con pnpm..."
pnpm install

echo "Listo! Ahora ejecuta: pnpm dev"
