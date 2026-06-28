FROM node:18-alpine

# Install git, required by some Baileys dependencies or git-based dependencies
RUN apk add --no-cache git

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "index.js"]
