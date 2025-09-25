Of course. Here is the detailed, step-by-step markdown file for **Module 3 of Phase 1**. This module brings the application to life by implementing the logic that connects your GraphQL API to the database.

---

# Phase 1, Module 3: Core API Logic - CRUD Resolvers

## 1. Objective

The goal of this module is to implement the "business logic" for our API. We will create GraphQL resolvers that handle Create, Read, Update, and Delete (CRUD) operations for our `Child`, `Driver`, and `Vehicle` entities. By the end of this module, our GraphQL API will be fully functional for data management, allowing us to add, view, modify, and remove records from our database.

## 2. Technical Stack

-   **Primary Tools:** TypeORM (Repository Pattern), Apollo Server (Resolvers), GraphQL
-   **Database:** SQLite (as configured in Module 1 & 2)

## 3. Step-by-Step Instructions

### ☐ **Step 1: Update GraphQL Schema with Mutations and Inputs**

Before we can implement the logic, we need to define the API "contract" for creating and updating data.

1.  Open `src/graphql/schema.ts`.
2.  Add `input` types for creating and updating each entity. Inputs are strongly-typed objects used as arguments for mutations. This keeps our mutations clean and organized.
3.  Add `Mutation` types for all CRUD operations.
4.  Update the file to match the following:

    ```typescript
    export const typeDefs = `#graphql
      # ENUMS (from previous module)
      enum ChildCategory { INFANT, TODDLER, PRESCHOOL, OOSC }
      enum DriverCapability { INFANT_CERTIFIED, TODDLER_TRAINED, SPECIAL_NEEDS }
      enum VehicleEquipment { INFANT_SEAT, TODDLER_SEAT, BOOSTER_SEAT, WHEELCHAIR_LIFT }

      # TYPES (from previous module)
      type Child { id: ID!, name: String!, addressStreet: String!, addressCity: String!, latitude: Float, longitude: Float, category: ChildCategory! }
      type Driver { id: ID!, name: String!, capabilities: [DriverCapability!] }
      type Vehicle { id: ID!, name: String!, capacity: Int!, equipment: [VehicleEquipment!] }
      
      # ====== NEW: INPUT TYPES ======
      input CreateChildInput {
        name: String!
        addressStreet: String!
        addressCity: String!
        category: ChildCategory!
      }
      
      input UpdateChildInput {
        name: String
        addressStreet: String
        addressCity: String
        category: ChildCategory
        latitude: Float
        longitude: Float
      }
      
      input CreateDriverInput {
        name: String!
        capabilities: [DriverCapability!]
      }
      
      input UpdateDriverInput {
        name: String
        capabilities: [DriverCapability!]
      }
      
      input CreateVehicleInput {
        name: String!
        capacity: Int!
        equipment: [VehicleEquipment!]
      }
      
      input UpdateVehicleInput {
        name: String
        capacity: Int
        equipment: [VehicleEquipment!]
      }

      type Query {
        # READ operations
        children: [Child!]!
        child(id: ID!): Child
        
        drivers: [Driver!]!
        driver(id: ID!): Driver
        
        vehicles: [Vehicle!]!
        vehicle(id: ID!): Vehicle
      }

      # ====== NEW: MUTATION TYPES ======
      type Mutation {
        # CREATE operations
        createChild(input: CreateChildInput!): Child!
        createDriver(input: CreateDriverInput!): Driver!
        createVehicle(input: CreateVehicleInput!): Vehicle!
        
        # UPDATE operations
        updateChild(id: ID!, input: UpdateChildInput!): Child!
        updateDriver(id: ID!, input: UpdateDriverInput!): Driver!
        updateVehicle(id: ID!, input: UpdateVehicleInput!): Vehicle!
        
        # DELETE operations
        deleteChild(id: ID!): Boolean!
        deleteDriver(id: ID!): Boolean!
        deleteVehicle(id: ID!): Boolean!
      }
    `;
    ```

### ☐ **Step 2: Create Resolver Files and Structure**

To keep the code organized, we will create separate resolver files for each entity.

1.  Inside the `src/graphql` folder, create a new folder named `resolvers`.
2.  Inside `src/graphql/resolvers`, create three files: `childResolvers.ts`, `driverResolvers.ts`, and `vehicleResolvers.ts`.
3.  Create an `index.ts` file inside `src/graphql/resolvers` to merge and export all resolvers together.

    **`src/graphql/resolvers/index.ts`:**
    ```typescript
    import { childResolvers } from './childResolvers';
    import { driverResolvers } from './driverResolvers';
    import { vehicleResolvers } from './vehicleResolvers';

    // In a real app, you'd use a library like lodash to deep merge.
    // For now, a simple merge is fine as there are no overlapping keys.
    export const resolvers = {
      Query: {
        ...childResolvers.Query,
        ...driverResolvers.Query,
        ...vehicleResolvers.Query,
      },
      Mutation: {
        ...childResolvers.Mutation,
        ...driverResolvers.Mutation,
        ...vehicleResolvers.Mutation,
      },
    };
    ```
4.  Update the main `src/index.ts` to import the merged resolvers from this new index file.

    ```typescript
    // in src/index.ts
    // ... other imports
    import { typeDefs } from './graphql/schema';
    import { resolvers } from './graphql/resolvers'; // <-- UPDATE THIS LINE

    const main = async () => {
      // ...
      const server = new ApolloServer({
        typeDefs,
        resolvers, // <-- Use the imported merged resolvers
        // ...
      });
      // ...
    };
    ```

### ☐ **Step 3: Implement Child Resolvers**

Now for the core logic. We will use the **Repository Pattern** from TypeORM to interact with the database.

1.  Open `src/graphql/resolvers/childResolvers.ts`.
2.  Import the `Child` entity, `AppDataSource`, and any necessary types.
3.  Implement the full set of CRUD functions.

    **`src/graphql/resolvers/childResolvers.ts`:**
    ```typescript
    import { AppDataSource } from '../../data-source';
    import { Child } from '../../entities/Child';
    import { GraphQLError } from 'graphql';

    const childRepository = AppDataSource.getRepository(Child);

    export const childResolvers = {
      Query: {
        // Get all children
        children: async () => {
          return await childRepository.find();
        },
        // Get a single child by ID
        child: async (_: any, { id }: { id: string }) => {
          const child = await childRepository.findOneBy({ id });
          if (!child) {
            throw new GraphQLError('Child not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          return child;
        },
      },
      Mutation: {
        // Create a new child
        createChild: async (_: any, { input }: { input: any }) => {
          const newChild = childRepository.create(input);
          return await childRepository.save(newChild);
        },
        // Update an existing child
        updateChild: async (_: any, { id, input }: { id: string; input: any }) => {
          const child = await childRepository.findOneBy({ id });
          if (!child) {
            throw new GraphQLError('Child not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          // Merge the input into the found child entity
          Object.assign(child, input);
          return await childRepository.save(child);
        },
        // Delete a child
        deleteChild: async (_: any, { id }: { id: string }) => {
          const deleteResult = await childRepository.delete(id);
          if (deleteResult.affected === 0) {
            return false; // Or throw an error if you prefer
          }
          return true;
        },
      },
    };
    ```

### ☐ **Step 4: Implement Driver and Vehicle Resolvers**

Follow the exact same pattern as above for the `Driver` and `Vehicle` entities. This task involves some repetition, which reinforces the pattern.

1.  **Implement `driverResolvers.ts`:** Create the `Query` and `Mutation` resolvers for `Driver` using the `driverRepository`.
2.  **Implement `vehicleResolvers.ts`:** Create the `Query` and `Mutation` resolvers for `Vehicle` using the `vehicleRepository`.

    *Self-Correction/Hint for the developer: The code will look almost identical to `childResolvers.ts`, just with the entity names and repository variables changed. This is a good opportunity to practice.*

### ☐ **Step 5: Validate the Full CRUD API**

Now, thoroughly test your work in the GraphQL Playground.

1.  Start the server: `npm run dev`.
2.  Open the Apollo Studio Sandbox: `http://localhost:4000/graphql`.
3.  **Test CREATE:** Run a `createChild` mutation.
    ```graphql
    mutation {
      createChild(input: {
        name: "Jane Doe",
        addressStreet: "123 Main St",
        addressCity: "Anytown",
        category: PRESCHOOL
      }) {
        id
        name
      }
    }
    ```
    You should get back the newly created child's data.

4.  **Test READ (All):** Run the `children` query. You should see Jane Doe in the list.
    ```graphql
    query {
      children {
        id
        name
        category
      }
    }
    ```

5.  **Test READ (One):** Copy the `id` from the previous step and run the `child` query.
    ```graphql
    query {
      child(id: "paste-the-id-here") {
        id
        name
        addressStreet
      }
    }
    ```

6.  **Test UPDATE:** Use the same `id` to run an `updateChild` mutation.
    ```graphql
    mutation {
      updateChild(id: "paste-the-id-here", input: {
        name: "Jane Smith"
      }) {
        id
        name # Should now be "Jane Smith"
      }
    }
    ```

7.  **Test DELETE:** Use the same `id` to run a `deleteChild` mutation.
    ```graphql
    mutation {
      deleteChild(id: "paste-the-id-here")
    }
    ```
    You should get `true` back.

8.  **Final Verification:** Run the `children` query again. The list should now be empty.

9.  **Repeat for Drivers and Vehicles:** Perform the same full cycle of C-R-U-D tests for the `Driver` and `Vehicle` types to ensure their resolvers are working correctly.

## 4. Final Deliverables for this Module

-   An updated `src/graphql/schema.ts` file containing the necessary `input` and `Mutation` types.
-   A new `src/graphql/resolvers` directory containing `childResolvers.ts`, `driverResolvers.ts`, `vehicleResolvers.ts`, and a merging `index.ts`.
-   The main `src/index.ts` is updated to use the new merged resolvers.
-   The API is fully functional for all CRUD operations on Children, Drivers, and Vehicles. This can be demonstrated by successfully running all the test queries and mutations listed in Step 5.