# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json .
COPY package-lock.json .

# Install dependencies
RUN npm install

# Build TypeScript (se existir tsconfig.json)
RUN if [ -f tsconfig.json ]; then npm run build; fi

# Copy the rest of the backend code
COPY . .

# Expose the port (ajuste se usar outra porta)
EXPOSE 3000

# Start the server (ajuste se o entrypoint for diferente)
CMD ["node", "dist/app.js"]
