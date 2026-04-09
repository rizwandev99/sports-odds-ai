FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Vite requires the --host flag to be accessible from outside the Docker container
CMD ["npm", "run", "dev", "--", "--host"]
