import { Child } from '../entities/Child';
import { EligibilityMap } from './eligibilityService';
const kmeans = require('node-kmeans'); // Using require for better compatibility

// A "workload" is a group of children that can be serviced by the same set of drivers/vehicles.
export interface Workload {
  // A unique key representing the set of eligible drivers/vehicles (e.g., "infant_certified_drivers")
  // For simplicity, we can serialize the list of eligible driver IDs.
  key: string; 
  children: Child[];
  // Optional human-readable label describing the compatibility requirements
  compatibilityLabel?: string;
}

// A "Cluster" is a geographically grouped subset of a Workload. This is what becomes a Route.
export type Cluster = Child[];

const AVERAGE_VEHICLE_CAPACITY = 10; // This should be a configurable value

/**
 * Groups children based on their eligible transport options. All children in a group
 * must share at least one common driver/vehicle pair that can service them all.
 * @param children The list of children to group.
 * @param eligibilityMap The map generated from the eligibilityService.
 * @returns An array of Workloads, where each workload contains children with compatible needs.
 */
export function groupChildrenByEligibility(
  children: Child[],
  eligibilityMap: EligibilityMap
): Workload[] {
  const workloadsMap = new Map<string, Child[]>();
  const assignedChildren = new Set<string>(); // Track assigned children to prevent duplicates

  for (const child of children) {
    // Skip if child is already assigned to a workload
    if (assignedChildren.has(child.id)) {
      continue;
    }

    const eligibleOptions = eligibilityMap.get(child);
    if (!eligibleOptions || eligibleOptions.length === 0) {
      console.warn(`Child ${child.name} has no eligible transport options and will be skipped.`);
      continue;
    }

    // Create a unique, sorted key from the IDs of eligible drivers.
    // This ensures that children who can be picked up by the same set of drivers
    // are grouped together.
    const key = eligibleOptions
      .map(option => option.driver.id)
      .sort()
      .join(',');

    if (!workloadsMap.has(key)) {
      workloadsMap.set(key, []);
    }
    workloadsMap.get(key)!.push(child);
    assignedChildren.add(child.id); // Mark child as assigned
  }

  // Convert the map to the Workload array structure
  const workloads: Workload[] = [];
  workloadsMap.forEach((children, key) => {
    // Generate a human-readable compatibility label based on the children's categories
    const categories = [...new Set(children.map(child => child.category))];
    let compatibilityLabel = '';
    
    if (categories.length === 1) {
      compatibilityLabel = categories[0].charAt(0).toUpperCase() + categories[0].slice(1);
    } else {
      compatibilityLabel = 'Mixed Categories';
    }
    
    workloads.push({ key, children, compatibilityLabel });
  });

  return workloads;
}

/**
 * Takes a workload and subdivides it into geographic clusters using k-means.
 * @param workload The workload to cluster.
 * @returns A promise that resolves to an array of clusters (arrays of children).
 */
export function clusterWorkloadGeographically(workload: Workload): Promise<Cluster[]> {
  return new Promise((resolve, reject) => {
    if (workload.children.length === 0) {
      return resolve([]);
    }

    // Filter out children without coordinates
    const childrenWithCoords = workload.children.filter(child => 
      child.latitude !== null && child.longitude !== null
    );

    if (childrenWithCoords.length === 0) {
      console.warn(`No children in workload have coordinates. Skipping geographic clustering.`);
      return resolve([workload.children]);
    }

    if (childrenWithCoords.length !== workload.children.length) {
      console.warn(`${workload.children.length - childrenWithCoords.length} children without coordinates will be grouped separately.`);
    }

    // Prepare the data for k-means: an array of [lat, lon] vectors.
    const vectors = childrenWithCoords.map(child => [child.latitude!, child.longitude!]);
    
    // Estimate the number of clusters (k) needed.
    // At least 1 cluster, and at most the number of children with coordinates.
    const k = Math.max(
      1,
      Math.min(
        Math.ceil(childrenWithCoords.length / AVERAGE_VEHICLE_CAPACITY),
        childrenWithCoords.length
      )
    );

    if (k === 1) {
      // If only one cluster is needed, no need to run k-means.
      return resolve([workload.children]);
    }

    kmeans.clusterize(vectors, { k }, (err: any, res: any) => {
      if (err) {
        console.error("K-means clustering error:", err);
        return reject(err);
      }
      
      // Map the k-means result back to our Child objects.
      const clusters: Cluster[] = res.map((cluster: any) => 
        cluster.clusterInd.map((vectorIndex: number) => childrenWithCoords[vectorIndex])
      );

      // Add children without coordinates to the first cluster
      const childrenWithoutCoords = workload.children.filter(child => 
        child.latitude === null || child.longitude === null
      );
      
      if (childrenWithoutCoords.length > 0 && clusters.length > 0) {
        clusters[0].push(...childrenWithoutCoords);
      } else if (childrenWithoutCoords.length > 0) {
        clusters.push(childrenWithoutCoords);
      }
      
      resolve(clusters);
    });
  });
}
