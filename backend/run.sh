#!/bin/zsh
# run.sh — Inicia o backend Flux com Java 21 via Homebrew
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="$JAVA_HOME/bin:$PATH"

echo "☕ Java: $(java -version 2>&1 | head -1)"
echo "🚀 Iniciando Flux Backend na porta 8080..."
./gradlew bootRun
