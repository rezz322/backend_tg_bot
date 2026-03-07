# --- Етап 1: Збірка (Builder) ---
FROM node:22-slim AS builder

# Встановлюємо необхідні бібліотеки для Prisma
RUN apt-get update -y && apt-get install -y openssl python3 make g++

WORKDIR /app

# Спочатку копіюємо лише файли залежностей (це пришвидшує кешування)
COPY package*.json ./
COPY prisma ./prisma/

# Встановлюємо всі залежності (включаючи devDependencies для Prisma)
RUN npm install

# Копіюємо решту коду
COPY . .

# Генеруємо Prisma Client та збираємо додаток (якщо у вас TypeScript/NestJS)
RUN npx prisma generate
RUN npm run build

# --- Етап 2: Запуск (Runner) ---
FROM node:22-slim AS runner

# Встановлюємо openssl (обов'язково для Prisma в runtime)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копіюємо лише необхідне з етапу builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist 
# Якщо у вас чистий JS без папки dist, копіюйте просто код:
# COPY --from=builder /app/src ./src

# Налаштовуємо змінні оточення
# Відкриваємо порти
EXPOSE 3000

# Запуск
CMD ["npm", "run", "start:prod"]
