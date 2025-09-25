import { AppDataSource } from '../../data-source';
import { Not } from 'typeorm';
import { Child, ChildCategory } from '../../entities/Child';
import { Driver, DriverCapability } from '../../entities/Driver';
import { Vehicle, VehicleEquipment } from '../../entities/Vehicle';
import { Route, RouteStatus } from '../../entities/Route';
import { Stop, StopType } from '../../entities/Stop';
import { filterEligibleTransports } from '../../services/eligibilityService';
import { groupChildrenByEligibility, clusterWorkloadGeographically } from '../../services/clusteringService';
import { solveChildrenRoute } from '../../services/routingService';
import { GraphQLError } from 'graphql';

interface AuthContext {
  admin?: {
    id: string;
    email: string;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
    capabilities: string[];
  };
}

const childRepo = AppDataSource.getRepository(Child);
const driverRepo = AppDataSource.getRepository(Driver);
const vehicleRepo = AppDataSource.getRepository(Vehicle);
const routeRepo = AppDataSource.getRepository(Route);
const stopRepo = AppDataSource.getRepository(Stop);

export const routeResolvers = {
  Query: {
    routes: async (_: unknown, { date }: { date: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return routeRepo.find({ 
        where: { date }, 
        relations: ['stops', 'stops.child', 'driver', 'vehicle'],
        order: { stops: { sequence: 'ASC' } }
      });
    },

    route: async (_: unknown, { id }: { id: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOne({
        where: { id },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });

      if (!route) {
        throw new GraphQLError('Route not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      return route;
    },

    getMyAssignedRoute: async (_: unknown, { date }: { date: string }, context: AuthContext) => {
      if (!context.driver) {
        throw new GraphQLError('Not authenticated as driver', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOne({
        where: { 
          date,
          driver: { id: context.driver.id },
          status: Not(RouteStatus.PLANNING) // Only return assigned, in_progress, or completed routes
        },
        relations: ['stops', 'stops.child', 'driver', 'vehicle'],
        order: { stops: { sequence: 'ASC' } }
      });

      return route; // Can be null if no route is assigned
    }
  },
  
  Mutation: {
    // THE INTELLIGENT "MAGIC BUTTON" MUTATION
    planAllDailyRoutes: async (_: unknown, { date }: { date: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Step 1: Clear existing routes for this date to prevent duplicates
      const existingRoutes = await routeRepo.find({ where: { date } });
      for (const route of existingRoutes) {
        // Delete associated stops first
        await stopRepo.delete({ route: { id: route.id } });
      }
      // Delete the routes
      await routeRepo.delete({ date });
      
      // Step 2: Fetch the ENTIRE problem space
      const allChildren = await childRepo.find();
      const allDrivers = await driverRepo.find();
      const allVehicles = await vehicleRepo.find();
      
      if (allChildren.length === 0) {
        return {
          generatedRoutes: [],
          unroutableChildren: []
        };
      }
      
      // Step 2: Run eligibility filtering
      const eligibilityMap = filterEligibleTransports(allChildren, allDrivers, allVehicles);
      
      // Separate routable from unroutable children
      const routableChildren: Child[] = [];
      const unroutableChildren: Array<{ child: Child; reason: string }> = [];
      
      for (const child of allChildren) {
        const eligibleTransports = eligibilityMap.get(child) || [];
        const hasEligibleTransport = eligibleTransports.length > 0;
        
        if (hasEligibleTransport) {
          routableChildren.push(child);
        } else {
          let reason = 'No compatible transport available';
          if (child.category === ChildCategory.INFANT) {
            const hasInfantDriver = allDrivers.some(d => d.capabilities.includes(DriverCapability.INFANT_CERTIFIED));
            const hasInfantVehicle = allVehicles.some(v => v.equipment?.includes(VehicleEquipment.INFANT_SEAT));
            if (!hasInfantDriver) reason = 'No infant-certified driver available';
            else if (!hasInfantVehicle) reason = 'No vehicle with infant seat available';
          } else if (child.category === ChildCategory.TODDLER) {
            const hasToddlerVehicle = allVehicles.some(v => v.equipment?.includes(VehicleEquipment.TODDLER_SEAT));
            if (!hasToddlerVehicle) reason = 'No vehicle with toddler seat available';
          }
          
          unroutableChildren.push({ child, reason });
        }
      }
      
      if (routableChildren.length === 0) {
        return {
          generatedRoutes: [],
          unroutableChildren
        };
      }
      
      // Step 3: Group and cluster routable children
      const workloads = groupChildrenByEligibility(routableChildren, eligibilityMap);
      const generatedRoutes: Route[] = [];
      let routeCounter = 1;
      
      for (const workload of workloads) {
        const clusters = await clusterWorkloadGeographically(workload);
        
        for (const cluster of clusters) {
          const optimizedSequence = await solveChildrenRoute(cluster);
          
          const route = new Route();
          route.name = `Route ${routeCounter++} - ${workload.compatibilityLabel || 'Mixed'}`;
          route.status = RouteStatus.PLANNING;
          route.date = date;
          
          const savedRoute = await routeRepo.save(route);
          
          for (let i = 0; i < optimizedSequence.length; i++) {
            const child = optimizedSequence[i];

            // Create only a PICKUP stop during planning. Dropoffs can be generated in a separate pass.
            const pickupStop = new Stop();
            pickupStop.route = savedRoute;
            pickupStop.child = child;
            pickupStop.type = StopType.PICKUP;
            pickupStop.sequence = i + 1; // simple incremental sequence: 1..N
            await stopRepo.save(pickupStop);
          }
          
          generatedRoutes.push(savedRoute);
        }
      }
      
      // Load complete route data
      const fullRoutes: Route[] = [];
      for (const route of generatedRoutes) {
        const fullRoute = await routeRepo.findOne({
          where: { id: route.id },
          relations: ['stops', 'stops.child', 'driver', 'vehicle']
        });
        if (fullRoute) {
          fullRoutes.push(fullRoute);
        }
      }
      
      return {
        generatedRoutes: fullRoutes,
        unroutableChildren
      };
    },

    // Manual Route Control Mutations (keep existing ones)
    createManualRoute: async (_: unknown, { name, date }: { name: string; date: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const newRoute = routeRepo.create({
        name,
        date,
        status: RouteStatus.PLANNING,
        stops: []
      });

      return await routeRepo.save(newRoute);
    },

    addStopToRoute: async (_: unknown, { routeId, childId }: { routeId: string; childId: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops']
      });

      if (!route) {
        throw new GraphQLError('Route not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const child = await childRepo.findOneBy({ id: childId });
      if (!child) {
        throw new GraphQLError('Child not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const nextSequence = route.stops.length + 1;

      const newStop = new Stop();
      newStop.route = route;
      newStop.child = child;
      newStop.type = StopType.PICKUP;
      newStop.sequence = nextSequence;

      await stopRepo.save(newStop);

      return await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });
    },

    removeStopFromRoute: async (_: unknown, { stopId }: { stopId: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const stop = await stopRepo.findOne({
        where: { id: stopId },
        relations: ['route', 'route.stops']
      });

      if (!stop) {
        throw new GraphQLError('Stop not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const routeId = stop.route.id;
      await stopRepo.delete(stopId);

      const remainingStops = await stopRepo.find({
        where: { route: { id: routeId } },
        order: { sequence: 'ASC' }
      });

      for (let i = 0; i < remainingStops.length; i++) {
        remainingStops[i].sequence = i + 1;
        await stopRepo.save(remainingStops[i]);
      }

      return await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });
    },

    reorderStops: async (_: unknown, { routeId, stopIds }: { routeId: string; stopIds: string[] }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOneBy({ id: routeId });
      if (!route) {
        throw new GraphQLError('Route not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      for (let i = 0; i < stopIds.length; i++) {
        const stop = await stopRepo.findOneBy({ id: stopIds[i] });
        if (stop) {
          stop.sequence = i + 1;
          await stopRepo.save(stop);
        }
      }

      return await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });
    },

    assignDriverAndVehicleToRoute: async (_: unknown, { routeId, driverId, vehicleId }: { routeId: string; driverId: string; vehicleId: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOneBy({ id: routeId });
      if (!route) {
        throw new GraphQLError('Route not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const driver = await driverRepo.findOneBy({ id: driverId });
      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const vehicle = await vehicleRepo.findOneBy({ id: vehicleId });
      if (!vehicle) {
        throw new GraphQLError('Vehicle not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check conflicts
      const existingDriverRoute = await routeRepo.findOne({
        where: { 
          date: route.date, 
          driver: { id: driverId },
          id: Not(routeId)
        },
        relations: ['driver']
      });

      if (existingDriverRoute) {
        throw new GraphQLError(`Driver ${driver.name} is already assigned to route "${existingDriverRoute.name}" on ${route.date}`, {
          extensions: { code: 'DRIVER_ALREADY_ASSIGNED' },
        });
      }

      const existingVehicleRoute = await routeRepo.findOne({
        where: { 
          date: route.date, 
          vehicle: { id: vehicleId },
          id: Not(routeId)
        },
        relations: ['vehicle']
      });

      if (existingVehicleRoute) {
        throw new GraphQLError(`Vehicle ${vehicle.name} is already assigned to route "${existingVehicleRoute.name}" on ${route.date}`, {
          extensions: { code: 'VEHICLE_ALREADY_ASSIGNED' },
        });
      }

      route.driver = driver;
      route.vehicle = vehicle;
      route.status = RouteStatus.ASSIGNED;

      await routeRepo.save(route);

      return await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });
    },

    deleteRoute: async (_: unknown, { routeId }: { routeId: string }, context: AuthContext) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const route = await routeRepo.findOne({
        where: { id: routeId },
        relations: ['stops']
      });

      if (!route) {
        throw new GraphQLError('Route not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      for (const stop of route.stops) {
        await stopRepo.delete(stop.id);
      }

      await routeRepo.delete(routeId);

      return true;
    },
  },
};