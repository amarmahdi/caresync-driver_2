Of course. We've reached the most algorithmically intense and crucial part of the project. Now that we have small, manageable clusters of children, we need to solve the "Traveling Salesperson Problem" (TSP) for each one to find the most efficient sequence of stops.

Here is the detailed, step-by-step markdown file for **Module 3 of Phase 2**.

---

# Phase 2, Module 3: Route Optimization with an External Solver

## 1. Objective

The goal of this module is to implement the core route optimization logic. For each geographic cluster of children, we will calculate the travel time between every pair of stops (including the daycare), and then feed this data into a professional-grade optimization solver. The solver will return the single best sequence of stops to minimize total travel time. Finally, we will use this sequence to create and save the actual `Route` and `Stop` entities in our database.

## 2. Technical Stack & Key Concepts

-   **Backend:** TypeScript, Node.js
-   **Optimization Solver:** **Google OR-Tools**. This is a powerful, open-source library designed for complex routing and logistics problems. We will use its official Node.js package.
-   **Mapping Service:** A **Distance Matrix API** (from Google Maps, Mapbox, or PositionStack) to get real-world travel times between all points.
-   **Key Concept:** **Time Matrix**. This is a 2D array where `matrix[i][j]` holds the travel time (in seconds) from location `i` to location `j`. This matrix is the primary input for the OR-Tools solver.

## 3. Step-by-Step Instructions

### ☐ **Step 1: Install Google OR-Tools**

1.  In your backend project directory, install the official Node.js package for OR-Tools.
    ```bash
    npm install ortools-node
    ```
    *Note: This package is a wrapper around a powerful C++ library. The installation might take a few minutes.*

### ☐ **Step 2: Create the Routing Service**

We will encapsulate all the complex logic of preparing data, calling the solver, and parsing the results in a dedicated service.

1.  Create a new file in your services folder: `src/services/routingService.ts`.
2.  This service will have two main functions: one to get the time matrix from an external API, and one to solve the TSP for a given matrix.

### ☐ **Step 3: Implement the Time Matrix Fetcher**

This function will take a list of locations and build the time matrix.

1.  **Get Daycare/Depot Coordinates:** For a real application, the daycare's coordinates should be stored in the database or a configuration file. For now, we can hardcode them.
2.  Open `src/services/routingService.ts` and add the logic to call the external Distance Matrix API.

    ```typescript
    // src/services/routingService.ts
    import fetch from 'node-fetch';
    import { Child } from '../entities/Child';

    // IMPORTANT: Replace with your actual daycare coordinates
    const DAYCARE_COORDS = { latitude: 34.0522, longitude: -118.2437 }; // Example: Los Angeles City Hall

    // A location can be a child's home or the daycare
    interface Location {
      id: string;
      latitude: number;
      longitude: number;
    }

    /**
     * Fetches a time matrix for a set of locations using an external API.
     * @param locations An array of locations. The depot (daycare) MUST be the first element.
     * @returns A promise that resolves to a 2D array (matrix) of travel times in seconds.
     */
    export async function getTimeMatrix(locations: Location[]): Promise<number[][]> {
      const apiKey = process.env.GEOCODING_API_KEY; // Re-using the key from the geocoding module
      if (!apiKey) throw new Error("API key not configured.");

      // Format coordinates for the API call (e.g., 'lon,lat;lon,lat;...')
      const coordinates = locations.map(loc => `${loc.longitude},${loc.latitude}`).join(';');
      
      // Using PositionStack's Matrix API as an example. The URL will vary for other providers.
      // NOTE: Most free tiers for Matrix APIs are very limited.
      // A paid service like Google Maps Distance Matrix API is recommended for production.
      // For this example, we will simulate a matrix if the API is not available.
      const url = `http://api.positionstack.com/v1/matrix?access_key=${apiKey}&origins=${coordinates}&destinations=${coordinates}`;

      try {
        // --- THIS IS A MOCK FOR DEVELOPMENT ---
        // Real Matrix APIs are often paid. We will simulate the result.
        // In production, you would replace this block with a real API call.
        console.warn("Using MOCKED time matrix for development.");
        const matrix: number[][] = [];
        for (let i = 0; i < locations.length; i++) {
          matrix[i] = [];
          for (let j = 0; j < locations.length; j++) {
            if (i === j) {
              matrix[i][j] = 0;
            } else {
              // Simulate travel time based on distance (highly inaccurate but works for testing)
              const dist = Math.sqrt(
                Math.pow(locations[i].latitude - locations[j].latitude, 2) +
                Math.pow(locations[i].longitude - locations[j].longitude, 2)
              );
              matrix[i][j] = Math.round(dist * 30000); // Rough conversion to seconds
            }
          }
        }
        return matrix;
        // --- END OF MOCK ---

        /*
        // --- REAL API CALL (for production) ---
        const response = await fetch(url);
        const data: any = await response.json();
        // You would need to parse the 'data' object into a 2D matrix here.
        // The structure depends on your chosen API provider.
        return parsedMatrix;
        */

      } catch (error) {
        console.error("Time Matrix API error:", error);
        throw new Error("Failed to fetch time matrix.");
      }
    }
    ```

### ☐ **Step 4: Implement the TSP Solver**

This is where we interface with Google OR-Tools.

1.  **Add the solver logic** to `src/services/routingService.ts`. The code is complex but follows the standard pattern for setting up a routing problem in OR-Tools.

    ```typescript
    // Add to src/services/routingService.ts
    import { newRoutingModel, RoutingDimension, FirstSolutionStrategy } from 'ortools-node';

    /**
     * Solves the Traveling Salesperson Problem for a given time matrix.
     * @param timeMatrix A 2D array of travel times.
     * @returns A promise that resolves to an ordered array of indices representing the best route.
     */
    export function solveTsp(timeMatrix: number[][]): Promise<number[]> {
      return new Promise((resolve, reject) => {
        const numLocations = timeMatrix.length;
        if (numLocations === 0) return resolve([]);
        
        // Create the routing model
        const routing = newRoutingModel({
          numVehicles: 1, // We are solving for one route at a time
          numNodes: numLocations,
          depotNode: 0, // The first location in our list is always the depot
        });

        // Define the cost of travel between nodes
        routing.setArcCostEvaluatorOfAllVehicles((fromNode, toNode) => {
          return timeMatrix[fromNode][toNode] || 0;
        });

        // Set a search strategy
        const searchParameters = routing.defaultSearchParameters();
        searchParameters.firstSolutionStrategy = FirstSolutionStrategy.PATH_CHEAPEST_ARC;

        // Solve the problem
        routing.solveWithParameters(searchParameters, (err, solution) => {
          if (err) return reject(err);
          if (!solution) return reject(new Error('No solution found for the route.'));

          // Extract the path from the solution
          const route: number[] = [];
          let currentNode = routing.start(0); // Start at the depot
          while (!routing.isEnd(currentNode)) {
            route.push(currentNode);
            currentNode = solution.value(routing.nextVar(currentNode));
          }
          route.push(currentNode); // Add the end node (depot)

          resolve(route);
        });
      });
    }
    ```

### ☐ **Step 5: Integrate the Routing Service into the `generateRoutes` Mutation**

Finally, let's tie everything together in our main resolver.

1.  Open `src/graphql/resolvers/routeResolvers.ts`.
2.  Import the new routing functions.
3.  For each cluster, call the `getTimeMatrix` and `solveTsp` functions.
4.  Use the result to create and save `Route` and `Stop` entities.

    ```typescript
    // src/graphql/resolvers/routeResolvers.ts
    // ... other imports
    import { Stop, StopType } from '../../entities/Stop';
    import { Route, RouteStatus } from '../../entities/Route';
    import { getTimeMatrix, solveTsp } from '../../services/routingService';

    const DAYCARE_COORDS = { latitude: 34.0522, longitude: -118.2437 }; // Same as in routingService

    // ... inside the generateRoutes mutation ...
    export const routeResolvers = {
      // ... Query ...
      Mutation: {
        generateRoutes: async (/*...*/) => {
          // ... (Steps 1-4 from previous modules: Fetch, Eligibility, Clustering) ...

          // --- NEW: Step 5: Optimize and Save Each Cluster as a Route ---
          const savedRoutes: Route[] = [];

          for (const cluster of allClusters) {
            if (cluster.length === 0) continue;

            // 5a. Prepare locations for the time matrix (Depot is always first)
            const locations = [
              { id: 'depot', ...DAYCARE_COORDS },
              ...cluster.map((child: Child) => ({ id: child.id, latitude: child.latitude, longitude: child.longitude }))
            ];
            
            // 5b. Get the time matrix
            const timeMatrix = await getTimeMatrix(locations);

            // 5c. Solve for the optimal path
            const routeIndices = await solveTsp(timeMatrix); // e.g., [0, 3, 1, 2, 0]

            // 5d. Create and save the Route and Stop entities
            const newRoute = routeRepo.create({
              name: `Generated Route for ${cluster[0].category}`,
              date: date,
              status: RouteStatus.PLANNING,
              stops: [],
            });

            // The solver's result includes the depot at the start and end. We only need the stops in between.
            const stopIndices = routeIndices.slice(1, -1);
            
            for (let i = 0; i < stopIndices.length; i++) {
              const locationIndex = stopIndices[i];
              const childForStop = locations[locationIndex];

              const newStop = new Stop();
              newStop.sequence = i + 1;
              newStop.type = StopType.PICKUP; // Assuming AM pickup for now
              newStop.child = await childRepo.findOneBy({ id: childForStop.id });
              newStop.route = newRoute;
              
              await AppDataSource.manager.save(newStop); // Save the stop
              newRoute.stops.push(newStop);
            }
            
            const savedRoute = await routeRepo.save(newRoute);
            savedRoutes.push(savedRoute);
          }

          console.log(`\n--- Successfully generated and saved ${savedRoutes.length} routes! ---`);

          return savedRoutes;
        },
      },
    };
    ```

### ☐ **Step 6: Validate the Full Optimization Flow**

1.  **Prepare Test Data:** Ensure you have several geocoded children in your database.
2.  **Run the Mutation:** Go to the GraphQL Playground and run the `generateRoutes` mutation, providing the IDs for your test children. This time, request the data for the generated routes in the response.
    ```graphql
    mutation {
      generateRoutes(date: "2024-01-01", childrenIds: ["...child ids..."]) {
        id
        name
        stops {
          sequence
          child {
            name
          }
        }
      }
    }
    ```
3.  **Check Backend Console Logs:** The logs should show:
    -   The MOCKED time matrix being used.
    -   Messages from the clustering service.
    -   A final message indicating that routes have been saved.
4.  **Check the GraphQL Response:** The mutation should now return an array of the newly created routes. The `stops` for each route should be in a logical, optimized order.
5.  **Check the Database:** Use a tool like DB Browser for SQLite to inspect your `route` and `stop` tables. They should be populated with the new data, and the foreign key relationships should be correctly established. The `sequence` numbers in the `stop` table should reflect the optimized order.

## 4. Final Deliverables for this Module

-   The `ortools-node` library added as a dependency.
-   A new `routingService.ts` containing logic to generate a (mocked) time matrix and solve the TSP using Google OR-Tools.
-   The `generateRoutes` resolver is now fully implemented. It orchestrates the entire process from data fetching to clustering to optimization and finally saves the results to the database.
-   Successful validation of the end-to-end flow, confirmed by a valid GraphQL response containing optimized routes and by inspecting the newly created records in the database.