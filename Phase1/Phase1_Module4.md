Of course. Here is the detailed, step-by-step markdown file for **Module 4 of Phase 1**. This module focuses on securing your API, which is a critical step before building any user-facing applications.

---

# Phase 1, Module 4: Admin Authentication

## 1. Objective

The goal of this module is to secure our GraphQL API. We will implement a complete authentication flow: creating an `Admin` user, handling secure login, generating JSON Web Tokens (JWT), and protecting our resolvers so that only authenticated admins can perform data-management operations.

## 2. Technical Stack

-   **Primary Tools:**
    -   **TypeORM:** For the `Admin` entity.
    -   **bcrypt.js:** For securely hashing and comparing passwords.
    -   **jsonwebtoken:** For creating and verifying JWTs.
    -   **Apollo Server:** For context management and middleware.

## 3. Step-by-Step Instructions

### ☐ **Step 1: Install and Configure Authentication Libraries**

1.  Install the necessary npm packages for handling authentication:
    ```bash
    npm install bcryptjs jsonwebtoken
    npm install --save-dev @types/bcryptjs @types/jsonwebtoken
    ```
    *Note: We use `bcryptjs` as it's a pure JavaScript implementation and requires no extra system dependencies.*

### ☐ **Step 2: Create the `Admin` Entity and Migration**

1.  Create a new entity file: `src/entities/Admin.ts`.
    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
    import * as bcrypt from 'bcryptjs';

    @Entity()
    export class Admin {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column({ unique: true })
      email: string;

      @Column()
      password: string;
      
      // A TypeORM hook to hash the password before it's saved to the database.
      @BeforeInsert()
      async hashPassword() {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }
    ```
2.  **Update the Data Source:** Add the new `Admin` entity to your `src/data-source.ts` file.
    ```typescript
    // in src/data-source.ts
    // ... other imports
    import { Admin } from './entities/Admin';

    export const AppDataSource = new DataSource({
        // ...
        entities: [Child, Driver, Vehicle, Admin], // <-- Add Admin here
        // ...
    });
    ```
3.  **Generate and Run Migration:** Create a new migration to add the `admin` table to your database.
    ```bash
    npm run typeorm migration:generate src/migrations/CreateAdminTable
    npm run typeorm migration:run
    ```
4.  **Validate:** Check your `database.sqlite` file. A new `admin` table should now exist.

### ☐ **Step 3: Update GraphQL Schema for Authentication**

1.  Open `src/graphql/schema.ts`.
2.  Add mutations for `registerAdmin` and `login`.
3.  Add a new `AuthPayload` type to return the token and user information upon successful login.

    ```typescript
    export const typeDefs = `#graphql
      # ... (existing enums and types) ...

      # ====== NEW: AUTH TYPES ======
      type Admin {
        id: ID!
        email: String!
      }

      type AuthPayload {
        token: String!
        admin: Admin!
      }

      type Query {
        # ... (existing queries) ...
        me: Admin # A new query to check who is currently logged in
      }

      type Mutation {
        # ... (existing mutations) ...

        # ====== NEW: AUTH MUTATIONS ======
        # This is typically only run once or from a secure CLI
        registerAdmin(email: String!, password: String!): Admin!
        login(email: String!, password: String!): AuthPayload!
      }
    `;
    ```

### ☐ **Step 4: Implement Authentication Resolvers**

1.  Create a new resolver file: `src/graphql/resolvers/adminResolvers.ts`.
2.  Implement the logic for registering and logging in an admin.
    ```typescript
    import { AppDataSource } from '../../data-source';
    import { Admin } from '../../entities/Admin';
    import { GraphQLError } from 'graphql';
    import * as bcrypt from 'bcryptjs';
    import * as jwt from 'jsonwebtoken';

    // It's critical to store your JWT secret in environment variables in a real app
    const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

    const adminRepository = AppDataSource.getRepository(Admin);

    export const adminResolvers = {
      Query: {
        // The `me` query will rely on the context we set up in the next step
        me: (_: any, __: any, context: any) => {
          if (!context.admin) {
            throw new GraphQLError('User is not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            });
          }
          return context.admin;
        },
      },
      Mutation: {
        registerAdmin: async (_: any, { email, password }: any) => {
          // In a real app, you'd add validation and more checks
          const newAdmin = adminRepository.create({ email, password });
          await adminRepository.save(newAdmin);
          return newAdmin;
        },
        login: async (_: any, { email, password }: any) => {
          const admin = await adminRepository.findOneBy({ email });
          if (!admin) {
            throw new GraphQLError('Invalid credentials', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }

          const isValidPassword = await bcrypt.compare(password, admin.password);
          if (!isValidPassword) {
            throw new GraphQLError('Invalid credentials', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }

          const token = jwt.sign(
            { adminId: admin.id, email: admin.email },
            JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
          );

          return {
            token,
            admin,
          };
        },
      },
    };
    ```
3.  **Merge Resolvers:** Update `src/graphql/resolvers/index.ts` to include the new `adminResolvers`.
    ```typescript
    // in src/graphql/resolvers/index.ts
    // ...
    import { adminResolvers } from './adminResolvers';

    export const resolvers = {
      Query: {
        ...childResolvers.Query,
        ...driverResolvers.Query,
        ...vehicleResolvers.Query,
        ...adminResolvers.Query, // <-- Add this
      },
      Mutation: {
        ...childResolvers.Mutation,
        ...driverResolvers.Mutation,
        ...vehicleResolvers.Mutation,
        ...adminResolvers.Mutation, // <-- Add this
      },
    };
    ```

### ☐ **Step 5: Implement Context and Authorization**

The "context" is an object shared across all resolvers for a single request. We'll use it to hold the authenticated user's data.

1.  **Create a Context Function:** This function will run before your resolvers. It will inspect the incoming request headers for a token, verify it, and attach the user to the context if the token is valid.
2.  Update `src/index.ts` to use this new context function.

    ```typescript
    // in src/index.ts
    // ... other imports ...
    import * as jwt from 'jsonwebtoken';
    import { Admin } from './entities/Admin';

    // Same secret as in your resolvers
    const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

    const main = async () => {
      // ... database initialization ...

      // ...
      const server = new ApolloServer({
        typeDefs,
        resolvers,
        // ... plugins
      });
      await server.start();

      app.use(
        '/graphql',
        express.json(),
        expressMiddleware(server, {
          // ====== NEW: CONTEXT FUNCTION ======
          context: async ({ req }) => {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
            
            if (token) {
              try {
                const payload = jwt.verify(token, JWT_SECRET) as any;
                // You could fetch the full user from the DB here if needed
                return { admin: payload }; 
              } catch (err) {
                // Token is invalid or expired
                return {};
              }
            }
            return {};
          },
        })
      );
      // ... rest of the server setup ...
    };
    ```
3.  **Protect Your Resolvers:** Go back to your existing resolvers (e.g., `childResolvers.ts`) and add a check for `context.admin` at the beginning of each mutation and sensitive query.

    **Example in `src/graphql/resolvers/childResolvers.ts`:**
    ```typescript
    // ...
    export const childResolvers = {
      Query: {
        children: async (_: any, __: any, context: any) => {
          if (!context.admin) throw new GraphQLError('Not authenticated');
          return await childRepository.find();
        },
        // ...
      },
      Mutation: {
        createChild: async (_: any, { input }: any, context: any) => {
          if (!context.admin) throw new GraphQLError('Not authenticated');
          const newChild = childRepository.create(input);
          return await childRepository.save(newChild);
        },
        // Add the same check to updateChild and deleteChild
      },
    };
    ```
    *Apply this authorization check to **all** CRUD operations in `childResolvers.ts`, `driverResolvers.ts`, and `vehicleResolvers.ts`.*

### ☐ **Step 6: Validate the Authentication Flow**

1.  Restart the server (`npm run dev`).
2.  **Test Protection:** Try to run the `{ children }` query. It should now fail with a "Not authenticated" error.
3.  **Test Registration:** Run the `registerAdmin` mutation.
    ```graphql
    mutation {
      registerAdmin(email: "admin@daycare.com", password: "securepassword123") {
        id
        email
      }
    }
    ```
4.  **Test Login:** Use the credentials you just created to log in.
    ```graphql
    mutation {
      login(email: "admin@daycare.com", password: "securepassword123") {
        token
        admin {
          id
          email
        }
      }
    }
    ```
    Copy the returned `token`.
5.  **Test Authenticated Request:** In the Apollo Studio sandbox, go to the "Headers" tab and add an `Authorization` header. The value should be `Bearer <YOUR_COPIED_TOKEN>`.
    ```
    {
      "Authorization": "Bearer eyJhbGciOiJI..."
    }
    ```
6.  Now, re-run the `{ children }` query. It should succeed. Run a `createChild` mutation. It should also succeed.
7.  **Test `me` query:** Run the `{ me }` query. It should return your admin user's information.

## 4. Final Deliverables for this Module

-   An `Admin` entity and a corresponding migration file.
-   Updated GraphQL schema with authentication types, queries, and mutations.
-   Functional `registerAdmin` and `login` resolvers.
-   An Apollo Server context function that validates JWTs and attaches the user payload.
-   All existing data-management resolvers (for Children, Drivers, Vehicles) are now protected and require a valid JWT to be executed.
-   Successful validation of the entire authentication flow as described in Step 6.