import fetch from 'node-fetch';
import { Child } from '../entities/Child';

// IMPORTANT: Replace with your actual daycare coordinates (using Seattle for demo)
const DAYCARE_COORDS = { latitude: 47.6062, longitude: -122.3321 }; // Seattle downtown

// A location can be a child's home or the daycare
interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
}

/**
 * Fetches a time matrix for a set of locations using Google Maps Distance Matrix API.
 * @param locations An array of locations. The depot (daycare) MUST be the first element.
 * @returns A promise that resolves to a 2D array (matrix) of travel times in seconds.
 */
export async function getTimeMatrix(locations: Location[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('No Google Maps API key found, using mock time matrix');
    return generateMockTimeMatrix(locations);
  }

  try {
    // Format coordinates for Google Maps API
    const coordinates = locations.map(loc => `${loc.latitude},${loc.longitude}`);
    const origins = coordinates.join('|');
    const destinations = coordinates.join('|');
    
    // Google Maps Distance Matrix API call
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=driving&units=metric&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status);
      return generateMockTimeMatrix(locations);
    }

    // Parse the response into a 2D matrix
    const matrix: number[][] = [];
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        const element = data.rows[i].elements[j];
        if (element.status === 'OK') {
          matrix[i][j] = element.duration.value; // Duration in seconds
        } else {
          // Fallback to straight-line distance if API fails for this pair
          matrix[i][j] = calculateStraightLineTime(locations[i], locations[j]);
        }
      }
    }

    console.log('✅ Successfully fetched real driving times from Google Maps');
    return matrix;

  } catch (error) {
    console.error('Error fetching time matrix from Google Maps:', error);
    console.warn('Falling back to mock time matrix');
    return generateMockTimeMatrix(locations);
  }
}

/**
 * Generates a mock time matrix based on straight-line distance (for fallback).
 */
function generateMockTimeMatrix(locations: Location[]): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < locations.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateStraightLineTime(locations[i], locations[j]);
      }
    }
  }
  return matrix;
}

/**
 * Calculates approximate travel time based on straight-line distance.
 */
function calculateStraightLineTime(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  // Assume average speed of 40 km/h in urban areas
  const timeInHours = distance / 40;
  return Math.round(timeInHours * 3600); // Convert to seconds
}

/**
 * Solves the Traveling Salesperson Problem using a simple nearest neighbor heuristic.
 * For small route sizes (< 10 stops), this provides good results quickly.
 * @param timeMatrix A 2D array of travel times in seconds.
 * @returns An ordered array of indices representing the best route.
 */
export function solveTsp(timeMatrix: number[][]): number[] {
  const numLocations = timeMatrix.length;
  if (numLocations === 0) return [];
  if (numLocations === 1) return [0];
  if (numLocations === 2) return [0, 1, 0];

  // For small problems, try a few different approaches and pick the best
  const approaches = [
    nearestNeighborTsp(timeMatrix, 0), // Start from depot
    greedyTsp(timeMatrix),
  ];

  // If we have a small number of locations, try brute force for optimal solution
  if (numLocations <= 6) {
    approaches.push(bruteForceTsp(timeMatrix));
  }

  // Pick the solution with the lowest total time
  let bestSolution = approaches[0];
  let bestTime = calculateRouteTime(bestSolution, timeMatrix);

  for (const solution of approaches.slice(1)) {
    const solutionTime = calculateRouteTime(solution, timeMatrix);
    if (solutionTime < bestTime) {
      bestSolution = solution;
      bestTime = solutionTime;
    }
  }

  console.log(`🚐 TSP solved: ${numLocations} locations, total time: ${Math.round(bestTime / 60)}m`);
  return bestSolution;
}

/**
 * Nearest neighbor heuristic starting from a given node.
 */
function nearestNeighborTsp(timeMatrix: number[][], startNode: number): number[] {
  const n = timeMatrix.length;
  const visited = new Array(n).fill(false);
  const route = [startNode];
  visited[startNode] = true;

  let current = startNode;
  while (route.length < n) {
    let nearest = -1;
    let nearestTime = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited[i] && timeMatrix[current][i] < nearestTime) {
        nearest = i;
        nearestTime = timeMatrix[current][i];
      }
    }

    if (nearest !== -1) {
      route.push(nearest);
      visited[nearest] = true;
      current = nearest;
    }
  }

  route.push(startNode); // Return to start
  return route;
}

/**
 * Greedy TSP: Always pick the shortest edge that doesn't create a cycle (until the end).
 */
function greedyTsp(timeMatrix: number[][]): number[] {
  const n = timeMatrix.length;
  const edges: Array<{from: number, to: number, time: number}> = [];

  // Create all edges
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        edges.push({from: i, to: j, time: timeMatrix[i][j]});
      }
    }
  }

  // Sort edges by time
  edges.sort((a, b) => a.time - b.time);

  // Build route greedily
  const route = [0]; // Start at depot
  const visited = new Set([0]);

  while (visited.size < n) {
    const current = route[route.length - 1];
    let nextNode = -1;
    let bestTime = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && timeMatrix[current][i] < bestTime) {
        nextNode = i;
        bestTime = timeMatrix[current][i];
      }
    }

    if (nextNode !== -1) {
      route.push(nextNode);
      visited.add(nextNode);
    }
  }

  route.push(0); // Return to depot
  return route;
}

/**
 * Brute force TSP for very small instances (n <= 6).
 */
function bruteForceTsp(timeMatrix: number[][]): number[] {
  const n = timeMatrix.length;
  if (n > 6) return nearestNeighborTsp(timeMatrix, 0); // Fallback for larger instances

  const nodes = Array.from({length: n - 1}, (_, i) => i + 1); // All nodes except depot (0)
  const permutations = getPermutations(nodes);
  
  let bestRoute = [0, ...nodes, 0];
  let bestTime = calculateRouteTime(bestRoute, timeMatrix);

  for (const perm of permutations) {
    const route = [0, ...perm, 0];
    const time = calculateRouteTime(route, timeMatrix);
    if (time < bestTime) {
      bestRoute = route;
      bestTime = time;
    }
  }

  return bestRoute;
}

/**
 * Generate all permutations of an array.
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    const perms = getPermutations(rest);
    for (const perm of perms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * Calculate total travel time for a given route.
 */
function calculateRouteTime(route: number[], timeMatrix: number[][]): number {
  let totalTime = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalTime += timeMatrix[route[i]][route[i + 1]];
  }
  return totalTime;
}

/**
 * High-level TSP solver that works with Child objects.
 * Converts children to locations, gets time matrix, solves TSP, and returns ordered children.
 * @param children Array of Child objects to create a route for.
 * @returns A promise that resolves to an ordered array of children representing the optimal route.
 */
export async function solveChildrenRoute(children: Child[]): Promise<Child[]> {
  if (children.length === 0) return [];
  if (children.length === 1) return children;

  // Convert children to locations, including the daycare as the first location
  const locations: Location[] = [
    {
      id: 'daycare',
      latitude: DAYCARE_COORDS.latitude,
      longitude: DAYCARE_COORDS.longitude,
      name: 'Daycare Center'
    }
  ];

  // Add children locations (filter out those without coordinates)
  const childrenWithCoords = children.filter(child => 
    child.latitude !== null && child.longitude !== null
  );

  childrenWithCoords.forEach(child => {
    locations.push({
      id: child.id,
      latitude: child.latitude!,
      longitude: child.longitude!,
      name: child.name
    });
  });

  // If no children have coordinates, return them in original order
  if (childrenWithCoords.length === 0) {
    console.warn('No children have coordinates, returning original order');
    return children;
  }

  // Get time matrix
  const timeMatrix = await getTimeMatrix(locations);

  // Solve TSP (returns indices)
  const routeIndices = solveTsp(timeMatrix);

  // Convert indices back to children (skip index 0 which is daycare, and the final return to daycare)
  const orderedChildren: Child[] = [];
  for (let i = 1; i < routeIndices.length - 1; i++) { // Skip first (daycare) and last (return to daycare)
    const locationIndex = routeIndices[i];
    if (locationIndex > 0) { // Make sure it's not the daycare
      const childIndex = locationIndex - 1; // Adjust for daycare being first
      if (childIndex < childrenWithCoords.length) {
        orderedChildren.push(childrenWithCoords[childIndex]);
      }
    }
  }

  // Add any children without coordinates to the end
  const childrenWithoutCoords = children.filter(child => 
    child.latitude === null || child.longitude === null
  );
  orderedChildren.push(...childrenWithoutCoords);

  return orderedChildren;
}

// Export the daycare coordinates for use in other modules
export { DAYCARE_COORDS };
