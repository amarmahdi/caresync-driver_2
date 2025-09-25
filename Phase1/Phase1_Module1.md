Of course. Here is a thorough, step-by-step markdown (`.md`) file for **Module 1 of Phase 1**. This document is designed to be given directly to a developer. It clearly outlines the goals, tasks, and validation steps, ensuring they build the foundation exactly as required.

Using SQLite is a great choice for initial development as it's serverless and easy to set up. We'll specify `better-sqlite3` as the driver for TypeORM for optimal performance in a Node.js environment. We'll also note that PostGIS features will be emulated or deferred.

---

# Phase 1, Module 1: Project Setup & Backend Foundation

## 1. Objective

The goal of this module is to establish the complete foundational structure for our backend application. By the end of this module, we will have a running Node.js server built with TypeScript, connected to a local SQLite database via TypeORM, and exposing a basic GraphQL endpoint. This setup will be the bedrock for all future development.

## 2. Technical Stack

-   **Runtime:** Node.js (LTS version)
-   **Language:** TypeScript
-   **Framework:** Express.js
-   **API Layer:** Apollo Server
-   **Database:** SQLite
-   **ORM:** TypeORM
-   **Node Driver for SQLite:** `better-sqlite3`

## 3. Step-by-Step Instructions

Follow these instructions in order. Each step includes a checklist item to be marked as complete.

### ☐ **Step 1: Initialize the Node.js Project**

First, create the project directory and initialize it as a Node.js project.

1.  Create a new directory for the project (e.g., `daycare-routing-api`).
2.  Navigate into the directory: `cd daycare-routing-api`
3.  Initialize the project with npm:
    ```bash
    npm init -y
    ```
4.  Install TypeScript and its Node.js type definitions as development dependencies:
    ```bash
    npm install --save-dev typescript @types/node ts-node-dev
    ```
5.  Create a `tsconfig.json` file in the root directory. You can generate a default one with `npx tsc --init`. Then, modify it to match the following configuration for a modern Node.js project:

    ```json
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "emitDecoratorMetadata": true, // Required for TypeORM
        "experimentalDecorators": true // Required for TypeORM
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules"]
    }
    ```

### ☐ **Step 2: Set Up Project Structure and Basic Server**

Create a clean directory structure and a minimal Express server.

1.  Create a `src` directory in the project root. This is where all your source code will live.
2.  Inside `src`, create a file named `index.ts`.
3.  Install Express and its type definitions:
    ```bash
    npm install express
    npm install --save-dev @types/express
    ```
4.  Add the following code to `src/index.ts` to create a basic Express server:

    ```typescript
    import express from 'express';

    const main = async () => {
      const app = express();
      const PORT = process.env.PORT || 4000;

      app.get('/', (_, res) => {
        res.send('Server is healthy!');
      });

      app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}`);
      });
    };

    main().catch((err) => {
      console.error(err);
    });
    ```

5.  Update `package.json` to add a `dev` script for running the server with `ts-node-dev`, which provides live reloading.

    ```json
    "scripts": {
      "dev": "ts-node-dev --respawn --transpile-only src/index.ts"
    }
    ```

6.  **Validate:** Run `npm run dev`. You should see "🚀 Server ready at http://localhost:4000". Open your browser and navigate to that URL to see "Server is healthy!".

### ☐ **Step 3: Integrate Apollo Server (GraphQL)**

Now, let's add the GraphQL layer on top of Express.

1.  Install Apollo Server and GraphQL dependencies:
    ```bash
    npm install @apollo/server express graphql
    ```
2.  Modify `src/index.ts` to integrate Apollo Server as middleware for Express.

    ```typescript
    import express from 'express';
    import http from 'http';
    import { ApolloServer } from '@apollo/server';
    import { expressMiddleware } from '@apollo/server/express4';
    import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

    const main = async () => {
      const app = express();
      const httpServer = http.createServer(app);
      const PORT = process.env.PORT || 4000;

      // Define a basic GraphQL schema
      const typeDefs = `#graphql
        type Query {
          hello: String
        }
      `;

      // Define a resolver for the schema
      const resolvers = {
        Query: {
          hello: () => 'Hello, world!',
        },
      };

      // Set up Apollo Server
      const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      });
      await server.start();

      app.use('/graphql', express.json(), expressMiddleware(server));

      await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
      console.log(`🚀 GraphQL server ready at http://localhost:${PORT}/graphql`);
    };

    main().catch((err) => {
      console.error(err);
    });
    ```

3.  **Validate:** Run `npm run dev`. Navigate to `http://localhost:4000/graphql`. You should see the Apollo Studio sandbox, where you can run the `{ hello }` query and get "Hello, world!" as a response.

### ☐ **Step 4: Integrate TypeORM with SQLite**

This is the final step: connecting our server to the database.

1.  Install TypeORM and the `better-sqlite3` driver:
    ```bash
    npm install typeorm better-sqlite3
    npm install --save-dev @types/better-sqlite3
    ```

2.  Import `reflect-metadata`. This is a required polyfill for TypeORM's decorators. Add this as the **very first line** of your `src/index.ts`:
    ```typescript
    import 'reflect-metadata';
    ```

3.  Create a new file `src/data-source.ts` to define your database connection. This keeps your configuration clean and separate.

    ```typescript
    import { DataSource } from 'typeorm';

    export const AppDataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'database.sqlite', // This file will be created in the root directory
      synchronize: true, // `true` is okay for development, we will use migrations later
      logging: true, // See SQL queries in the console
      entities: [], // We will add entities in the next module
      migrations: [],
      subscribers: [],
    });
    ```

4.  Modify `src/index.ts` to initialize this data source when the server starts.

    ```typescript
    // ... other imports
    import { AppDataSource } from './data-source';

    const main = async () => {
      // Initialize the database connection
      try {
        await AppDataSource.initialize();
        console.log('✅ Data Source has been initialized!');
      } catch (err) {
        console.error('❌ Error during Data Source initializati on', err);
        return;
      }
      // ... rest of the server setup code (Express, Apollo, etc.)
    };

    // ... main().catch()
    ```

5.  **Important Note on Geospatial Data:** Add a note for the developer.
    > **Developer Note:** SQLite does not have native support for PostGIS. For Phase 1, we will store `latitude` and `longitude` as simple `float` columns. The advanced geospatial queries will be implemented in a later phase when we migrate to PostgreSQL.

6.  **Validate:** Run `npm run dev`. You should now see two success messages in your console:
    -   `✅ Data Source has been initialized!`
    -   `🚀 GraphQL server ready at http://localhost:4000/graphql`
    -   A new file named `database.sqlite` should have been created in the root of your project directory.

## 4. Final Deliverables for this Module

-   A Git repository containing the project structure as outlined.
-   A `package.json` with all the correct dependencies and scripts.
-   A `tsconfig.json` file configured for the project.
-   A `src/index.ts` file that successfully starts an Express/Apollo server.
-   A `src/data-source.ts` file that defines the TypeORM connection to a local SQLite database.
-   The application must start without errors when running `npm install` followed by `npm run dev`.
-   A `database.sqlite` file is created upon the first successful run.