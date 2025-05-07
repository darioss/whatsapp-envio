FROM node:14-slim

# Instala dependências necessárias para o Chromium funcionar com Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libdrm2 \
    libxext6 \
    libxfixes3 \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgbm1 \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copia arquivos e instala dependências
COPY package*.json ./
RUN npm install

COPY . .

# Cria pasta para uploads
RUN mkdir -p /app/upload

# Expõe a porta
EXPOSE 3000

# Comando para iniciar o app
CMD ["node", "server.js"]
