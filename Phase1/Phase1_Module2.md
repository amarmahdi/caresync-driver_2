Of course. Here is the detailed, step-by-step markdown file for **Module 2 of Phase 1**, building directly on the foundation established in Module 1.

---

# Phase 1, Module 2: Data Modeling & GraphQL Schema

## 1. Objective

The goal of this module is to define the core data structures of our application using TypeORM entities. We will then expose these structures through a GraphQL schema, creating the API "contract" for our frontend. Finally, we will set up and run our first database migration to create the necessary tables in our SQLite database.

## 2. Technical Stack

-   **Primary Tools:** TypeORM, GraphQL Schema Definition Language (SDL)
-   **Database:** SQLite (as configured in Module 1)

## 3. Step-by-Step Instructions

### ☐ **Step 1: Create the TypeORM Entities**

Entities are TypeScript classes that map directly to your database tables. We will create a dedicated folder for them.

1.  Create a new folder `src/entities`.
2.  Inside `src/entities`, create the following three files: `Child.ts`, `Driver.ts`, and `Vehicle.ts`.
3.  **Populate `src/entities/Child.ts`:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

    export enum ChildCategory {
      INFANT = 'infant',
      TODDLER = 'toddler',
      PRESCHOOL = 'preschool',
      OOSC = 'out_of_school_care', // Out of School Care
    }

    @Entity()
    export class Child {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      name: string;

      @Column()
      addressStreet: string;

      @Column()
      addressCity: string;

      // As noted, we use simple floats for SQLite.
      // This will be a PostGIS point in a later phase.
      @Column('float', { nullable: true })
      latitude: number;

      @Column('float', { nullable: true })
      longitude: number;

      @Column({
        type: 'simple-enum',
        enum: ChildCategory,
      })
      category: ChildCategory;
    }
    ```
4.  **Populate `src/entities/Driver.ts`:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

    export enum DriverCapability {
      INFANT_CERTIFIED = 'infant_certified',
      TODDLER_TRAINED = 'toddler_trained',
      SPECIAL_NEEDS = 'special_needs',
    }

    @Entity()
    export class Driver {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      name: string;

      @Column({
        type: 'simple-array', // Stores as a comma-separated string
        nullable: true,
      })
      capabilities: DriverCapability[];
    }
    ```
5.  **Populate `src/entities/Vehicle.ts`:**
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

    export enum VehicleEquipment {
      INFANT_SEAT = 'infant_seat',
      TODDLER_SEAT = 'toddler_seat',
      BOOSTER_SEAT = 'booster_seat',
      WHEELCHAIR_LIFT = 'wheelchair_lift',
    }

    @Entity()
    export class Vehicle {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      name: string; // e.g., "Van 1", "Bus A"

      @Column()
      capacity: number;

      @Column({
        type: 'simple-array',
        nullable: true,
      })
      equipment: VehicleEquipment[];
    }
    ```

6.  **Update Data Source:** Open `src/data-source.ts` and tell TypeORM about your new entities.
    ```typescript
    import { DataSource } from 'typeorm';
    import { Child } from './entities/Child';
    import { Driver } from './entities/Driver';
    import { Vehicle } from './entities/Vehicle';

    export const AppDataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      synchronize: false, // IMPORTANT: Set to false now that we will use migrations
      logging: true,
      entities: [Child, Driver, Vehicle], // Add your entities here
      migrations: ['./src/migrations/*.ts'], // Point to the migrations folder
    });
    ```

### ☐ **Step 2: Define the GraphQL Schema**

Now, define the API structure that the frontend will use. This should mirror your entities.

1.  Create a new folder `src/graphql`.
2.  Inside `src/graphql`, create a file named `schema.ts`.
3.  Populate `src/graphql/schema.ts` with the GraphQL types and initial queries/mutations.
    ```typescript
    export const typeDefs = `#graphql
      # ENUMS
      enum ChildCategory {
        INFANT
        TODDLER
        PRESCHOOL
        OOSC
      }

      enum DriverCapability {
        INFANT_CERTIFIED
        TODDLER_TRAINED
        SPECIAL_NEEDS
      }

      enum VehicleEquipment {
        INFANT_SEAT
        TODDLER_SEAT
        BOOSTER_SEAT
        WHEELCHAIR_LIFT
      }

      # TYPES
      type Child {
        id: ID!
        name: String!
        addressStreet: String!
        addressCity: String!
        latitude: Float
        longitude: Float
        category: ChildCategory!
      }

      type Driver {
        id: ID!
        name: String!
        capabilities: [DriverCapability!]
      }

      type Vehicle {
        id: ID!
        name: String!
        capacity: Int!
        equipment: [VehicleEquipment!]
      }

      # We will add inputs and mutations in the next module.
      # For now, we only need queries to test our setup.
      type Query {
        # Test Query
        hello: String

        # Real Queries (to be implemented in Module 3)
        children: [Child!]!
        drivers: [Driver!]!
        vehicles: [Vehicle!]!
      }
    `;
    ```
4.  **Update Apollo Server:** Open `src/index.ts` and import your new schema. Also, create a placeholder for your resolvers.
    ```typescript
    // ... other imports
    import { typeDefs } from './graphql/schema';

    const main = async () => {
      // ... database initialization ...

      // Define resolvers (we will implement these in the next module)
      const resolvers = {
        Query: {
          hello: () => 'Hello from our defined schema!',
          // Placeholder resolvers that we'll build out later
          children: () => [],
          drivers: () => [],
          vehicles: () => [],
        },
      };

      // Set up Apollo Server
      const server = new ApolloServer({
        typeDefs,
        resolvers, // Use the new resolvers
        // ... plugins
      });
      
      // ... rest of the server setup
    };
    ```
5.  **Validate:** Restart the server (`npm run dev`). Go to the GraphQL playground (`http://localhost:4000/graphql`). The "Schema" tab should now show your new `Child`, `Driver`, and `Vehicle` types. You should be able to run the `{ children { id name } }` query and get an empty array `[]` back.

### ☐ **Step 3: Set Up and Run Database Migrations**

Using `synchronize: true` is risky. Migrations provide a safe, version-controlled way to update your database schema.

1.  **Configure `package.json` scripts:** Add scripts to your `package.json` to make working with the TypeORM CLI easier.

    ```json
    "scripts": {
      "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
      "typeorm": "ts-node ./node_modules/typeorm/cli.js -d ./src/data-source.ts"
    }
    ```
    *Note: The `-d` flag points the CLI to our `DataSource` configuration.*

2.  **Generate the Initial Migration:** Now that you've defined your entities and turned off `synchronize`, TypeORM can compare your entities to the (empty) database and generate the SQL needed to create the tables.

    Run the following command in your terminal:
    ```bash
    npm run typeorm migration:generate src/migrations/InitialSchema
    ```

3.  **Inspect the Migration File:**
    -   A new folder `src/migrations` will be created.
    -   Inside, you'll find a file with a name like `167...-InitialSchema.ts`.
    -   Open this file. It contains the `up` and `down` methods with the raw SQL to create and drop your `child`, `driver`, and `vehicle` tables. This is your schema's history.

4.  **Run the Migration:** Apply the changes to your database.
    ```bash
    npm run typeorm migration:run
    ```
5.  **Validate:**
    -   The console should show that the migration was executed successfully.
    -   Use a database inspection tool like **"DB Browser for SQLite"** (a free desktop app) to open your `database.sqlite` file. You should now see the `child`, `driver`, `vehicle`, and `migrations` tables with the correct columns. The database is now ready to hold data.

## 4. Final Deliverables for this Module

-   Three new entity files (`Child.ts`, `Driver.ts`, `Vehicle.ts`) inside `src/entities`.
-   A `src/graphql/schema.ts` file defining the corresponding GraphQL types and placeholder queries.
-   The `src/data-source.ts` file is updated to include the entities and point to the migrations folder, with `synchronize` set to `false`.
-   The `src/index.ts` file is updated to use the new schema.
-   A `src/migrations` folder containing the first migration file.
-   The `package.json` file includes the new `typeorm` script.
-   The SQLite database file (`database.sqlite`) contains the tables as defined by the entities, which can be verified with an external tool.