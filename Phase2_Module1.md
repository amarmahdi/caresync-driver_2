Of course. We are now moving into **Phase 2**, which is dedicated to implementing the core "magic" of your application: the automated route generation. This phase is backend-heavy and focuses on algorithms and optimization.

Here is the detailed, step-by-step markdown file for **Module 1 of Phase 2**.

---

# Phase 2, Module 1: Route Data Modeling & Eligibility Filter

## 1. Objective

The goal of this module is to lay the foundational data structures and the first critical piece of logic for route generation. We will model what a `Route` and a `Stop` look like in our database and API. Then, we will implement the **Eligibility Filter**, a crucial service that acts as a "matchmaker," determining which driver/vehicle pairs are qualified to transport each specific child based on their needs and the drivers' capabilities.

## 2. Technical Stack

-   **Backend:** TypeORM, TypeScript, GraphQL
-   **Database:** SQLite (Continuing from Phase 1)

## 3. Step-by-Step Instructions

### ☐ **Step 1: Create `Route` and `Stop` Entities and Migrations**

We need to define how route data will be stored in the database. A `Route` is a collection of `Stops`, and each `Stop` is linked to a specific `Child`.

1.  **Create the `Stop` Entity:** Create `src/entities/Stop.ts`. This entity will link a `Route` to a `Child` and define the order of the stop.

    ```typescript
    // src/entities/Stop.ts
    import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
    import { Route } from './Route';
    import { Child } from './Child';

    export enum StopType {
      PICKUP = 'PICKUP',
      DROPOFF = 'DROPOFF',
    }

    @Entity()
    export class Stop {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      sequence: number; // The order of this stop in the route (1, 2, 3, etc.)

      @Column({
        type: 'simple-enum',
        enum: StopType,
      })
      type: StopType;

      // A stop is associated with one specific child
      @ManyToOne(() => Child, { eager: true }) // eager loads the child data automatically
      child: Child;

      // A stop belongs to one route
      @ManyToOne(() => Route, (route) => route.stops)
      route: Route;
    }
    ```
2.  **Create the `Route` Entity:** Create `src/entities/Route.ts`. This will be the parent entity containing all information about a specific journey.

    ```typescript
    // src/entities/Route.ts
    import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
    import { Stop } from './Stop';
    import { Driver } from './Driver';
    import { Vehicle } from './Vehicle';

    export enum RouteStatus {
      PLANNING = 'PLANNING',
      ASSIGNED = 'ASSIGNED',
      IN_PROGRESS = 'IN_PROGRESS',
      COMPLETED = 'COMPLETED',
    }

    @Entity()
    export class Route {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      name: string; // e.g., "North Zone Toddlers AM"

      @Column({
        type: 'simple-enum',
        enum: RouteStatus,
        default: RouteStatus.PLANNING,
      })
      status: RouteStatus;

      @Column('date')
      date: string; // The date for which this route is planned

      // A route has many stops, and we want them to cascade on delete
      @OneToMany(() => Stop, (stop) => stop.route, { cascade: true })
      stops: Stop[];

      // A route can be assigned to one driver (optional at first)
      @ManyToOne(() => Driver, { nullable: true })
      driver: Driver;

      // A route uses one vehicle (optional at first)
      @ManyToOne(() => Vehicle, { nullable: true })
      vehicle: Vehicle;
    }
    ```
3.  **Update Data Source:** Add the `Route` and `Stop` entities to `src/data-source.ts`.
4.  **Generate and Run Migration:** Create a migration to add the `route` and `stop` tables to your database.
    ```bash
    npm run typeorm migration:generate src/migrations/AddRouteAndStopTables
    npm run typeorm migration:run
    ```
5.  **Validate:** Check your `database.sqlite` file to confirm the new tables and their relationships (foreign keys) have been created.

### ☐ **Step 2: Update GraphQL Schema**

Expose the new data models and create a mutation to trigger our future logic engine.

1.  Open `src/graphql/schema.ts` and add the new types and a `generateRoutes` mutation.
    ```typescript
    export const typeDefs = `#graphql
      # ... (existing enums and types) ...

      # ====== NEW: ROUTE & STOP ENUMS/TYPES ======
      enum StopType { PICKUP, DROPOFF }
      enum RouteStatus { PLANNING, ASSIGNED, IN_PROGRESS, COMPLETED }

      type Stop {
        id: ID!
        sequence: Int!
        type: StopType!
        child: Child!
      }

      type Route {
        id: ID!
        name: String!
        status: RouteStatus!
        date: String!
        stops: [Stop!]!
        driver: Driver
        vehicle: Vehicle
      }

      type Query {
        # ... (existing queries) ...
        routes(date: String!): [Route!]
        route(id: ID!): Route
      }

      type Mutation {
        # ... (existing mutations) ...
        
        # This mutation will kick off the entire planning process
        generateRoutes(date: String!, childrenIds: [ID!]!): [Route!]
      }
    `;
    ```

### ☐ **Step 3: Create the Logic Engine Service Structure**

We'll create a dedicated place for our complex backend logic to keep it separate from the API resolvers.

1.  Create a new top-level folder: `src/services`.
2.  Inside `src/services`, create a file named `eligibilityService.ts`.

### ☐ **Step 4: Implement the Eligibility Filter Service**

This is the core "matchmaking" logic. The service will take a list of children and determine all possible driver/vehicle combinations for each one.

1.  Open `src/services/eligibilityService.ts` and implement the filter logic.
    ```typescript
    // src/services/eligibilityService.ts
    import { Child, ChildCategory } from '../entities/Child';
    import { Driver, DriverCapability } from '../entities/Driver';
    import { Vehicle, VehicleEquipment } from '../entities/Vehicle';

    // This interface defines a valid transport option for a child
    export interface TransportOption {
      driver: Driver;
      vehicle: Vehicle;
    }
    
    // This is the main output: mapping each child to their valid options
    export type EligibilityMap = Map<Child, TransportOption[]>;

    // The main function for the service
    export function filterEligibleTransports(
      children: Child[],
      drivers: Driver[],
      vehicles: Vehicle[]
    ): EligibilityMap {
      const eligibilityMap: EligibilityMap = new Map();

      // Pair up every available driver with a vehicle
      // In a real app, this pairing might be predefined (driver is assigned a vehicle)
      // For now, we assume any driver can use any vehicle
      const allPossiblePairs: TransportOption[] = [];
      for (const driver of drivers) {
        for (const vehicle of vehicles) {
          allPossiblePairs.push({ driver, vehicle });
        }
      }

      for (const child of children) {
        const requiredCapabilities: DriverCapability[] = [];
        const requiredEquipment: VehicleEquipment[] = [];

        // Rule 1: Determine needs based on child's category
        switch (child.category) {
          case ChildCategory.INFANT:
            requiredCapabilities.push(DriverCapability.INFANT_CERTIFIED);
            requiredEquipment.push(VehicleEquipment.INFANT_SEAT);
            break;
          case ChildCategory.TODDLER:
            requiredCapabilities.push(DriverCapability.TODDLER_TRAINED);
            requiredEquipment.push(VehicleEquipment.TODDLER_SEAT);
            break;
          // Add more rules for other categories or special needs if necessary
        }

        // Filter the pairs to find who is eligible for THIS child
        const eligiblePairs = allPossiblePairs.filter(pair => {
          // Check if the driver has ALL required capabilities
          const hasAllCapabilities = requiredCapabilities.every(cap =>
            pair.driver.capabilities?.includes(cap)
          );

          // Check if the vehicle has ALL required equipment
          const hasAllEquipment = requiredEquipment.every(equip =>
            pair.vehicle.equipment?.includes(equip)
          );

          return hasAllCapabilities && hasAllEquipment;
        });
        
        eligibilityMap.set(child, eligiblePairs);
      }

      return eligibilityMap;
    }
    ```

### ☐ **Step 5: Implement the `generateRoutes` Mutation (Placeholder)**

Now we'll create the resolver that uses our new service. For this module, it will only perform the eligibility check and log the results. The actual route creation will happen in the next modules.

1.  Create `src/graphql/resolvers/routeResolvers.ts` and add placeholder logic.
2.  Import and use the `filterEligibleTransports` service.

    ```typescript
    // src/graphql/resolvers/routeResolvers.ts
    import { AppDataSource } from '../../data-source';
    import { In } from 'typeorm';
    import { Child } from '../../entities/Child';
    import { Driver } from '../../entities/Driver';
    import { Vehicle } from '../../entities/Vehicle';
    import { Route } from '../../entities/Route';
    import { filterEligibleTransports, EligibilityMap } from '../../services/eligibilityService';
    import { GraphQLError } from 'graphql';

    const childRepo = AppDataSource.getRepository(Child);
    const driverRepo = AppDataSource.getRepository(Driver);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const routeRepo = AppDataSource.getRepository(Route);

    export const routeResolvers = {
      Query: {
        routes: async (_: any, { date }: { date: string }) => {
          return routeRepo.find({ where: { date }, relations: ['stops', 'driver', 'vehicle'] });
        },
        route: async (_: any, { id }: { id: string }) => {
          return routeRepo.findOne({ where: { id }, relations: ['stops', 'driver', 'vehicle'] });
        }
      },
      Mutation: {
        generateRoutes: async (_: any, { date, childrenIds }: { date: string; childrenIds: string[] }) => {
          if (!childrenIds || childrenIds.length === 0) {
            throw new GraphQLError('At least one child must be selected.');
          }
          
          // Step 1: Fetch all necessary data from the database
          const childrenToRoute = await childRepo.findBy({ id: In(childrenIds) });
          const allDrivers = await driverRepo.find();
          const allVehicles = await vehicleRepo.find();

          // Step 2: Run the Eligibility Filter
          const eligibilityMap: EligibilityMap = filterEligibleTransports(
            childrenToRoute,
            allDrivers,
            allVehicles
          );

          // --- FOR VALIDATION PURPOSES IN THIS MODULE ---
          console.log("--- Eligibility Check Results ---");
          eligibilityMap.forEach((options, child) => {
            console.log(`Child: ${child.name} (${child.category})`);
            if (options.length === 0) {
              console.log("  -> No eligible driver/vehicle pairs found!");
            } else {
              options.forEach(option => {
                console.log(`  -> Eligible: ${option.driver.name} with ${option.vehicle.name}`);
              });
            }
          });
          // ---------------------------------------------

          // TODO in next modules:
          // 3. Cluster children by category and geography.
          // 4. For each cluster, find the optimal stop order.
          // 5. Create and save Route and Stop entities.

          // For now, return an empty array as a placeholder
          return [];
        },
      },
    };
    ```
3.  **Merge Resolvers:** Add `routeResolvers` to `src/graphql/resolvers/index.ts`.

### ☐ **Step 6: Validate the Eligibility Logic**

1.  **Prepare Test Data:** Using your Admin Panel, ensure you have:
    -   An `INFANT` child.
    -   A `TODDLER` child.
    -   A `PRESCHOOL` child.
    -   A driver who is `INFANT_CERTIFIED`.
    -   A driver who is `TODDLER_TRAINED`.
    -   A driver with no special capabilities.
    -   A vehicle with an `INFANT_SEAT`.
    -   A vehicle with a `TODDLER_SEAT`.
    -   A vehicle with no special equipment.
2.  **Run the Mutation:** Go to the GraphQL Playground, get the IDs of your test children, and run the `generateRoutes` mutation.
    ```graphql
    mutation {
      generateRoutes(
        date: "2024-01-01", 
        childrenIds: ["id-of-infant", "id-of-toddler", "id-of-preschooler"]
      ) {
        id # This will be an empty array for now
      }
    }
    ```
3.  **Check Backend Console Logs:** Observe the console output from your running backend server. The logs should correctly identify which driver/vehicle pairs are eligible for each child based on the rules you defined. For example:
    -   The infant should only be matched with the infant-certified driver in the infant-seat-equipped vehicle.
    -   The preschooler (who has no special requirements) should be matched with many/all pairs.
    -   You might find a child for whom NO pairs are eligible, which is a critical piece of information for the admin.

## 4. Final Deliverables for this Module

-   `Route` and `Stop` TypeORM entities and a corresponding database migration.
-   An updated GraphQL schema including `Route`, `Stop`, and the `generateRoutes` mutation.
-   A new `eligibilityService.ts` that correctly filters driver/vehicle pairs based on child needs.
-   A placeholder `generateRoutes` resolver that successfully uses the eligibility service.
-   Successful validation of the eligibility logic via console logs after running the mutation with well-defined test data.