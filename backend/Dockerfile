FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Ensure uploads folder exists
RUN mkdir -p uploads

EXPOSE 8000

CMD ["npm", "start"]
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Ensure uploads folder exists
RUN mkdir -p uploads

EXPOSE 8000

CMD ["npm", "start"]

