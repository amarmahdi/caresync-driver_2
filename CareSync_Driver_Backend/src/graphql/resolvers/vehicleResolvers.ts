import { AppDataSource } from '../../data-source';
import { Vehicle } from '../../entities/Vehicle';
import { GraphQLError } from 'graphql';

const vehicleRepository = AppDataSource.getRepository(Vehicle);

export const vehicleResolvers = {
  Query: {
    // Get all vehicles
    vehicles: async (_: any, __: any, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await vehicleRepository.find();
    },
    // Get a single vehicle by ID
    vehicle: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const vehicle = await vehicleRepository.findOneBy({ id });
      if (!vehicle) {
        throw new GraphQLError('Vehicle not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return vehicle;
    },
  },
  Mutation: {
    // Create a new vehicle
    createVehicle: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const newVehicle = vehicleRepository.create(input);
      return await vehicleRepository.save(newVehicle);
    },
    // Update an existing vehicle
    updateVehicle: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const vehicle = await vehicleRepository.findOneBy({ id });
      if (!vehicle) {
        throw new GraphQLError('Vehicle not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      // Merge the input into the found vehicle entity
      Object.assign(vehicle, input);
      return await vehicleRepository.save(vehicle);
    },
    // Delete a vehicle
    deleteVehicle: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const deleteResult = await vehicleRepository.delete(id);
      if (deleteResult.affected === 0) {
        return false; // Or throw an error if you prefer
      }
      return true;
    },
  },
};
