import { AppDataSource } from '../../data-source';
import { Driver } from '../../entities/Driver';
import { Route } from '../../entities/Route';
import { GraphQLError } from 'graphql';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// It's critical to store your JWT secret in environment variables in a real app
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

const driverRepository = AppDataSource.getRepository(Driver);

export const driverResolvers = {
  Query: {
    // Get all drivers
    drivers: async (_: any, __: any, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await driverRepository.find();
    },
    // Get a single driver by ID
    driver: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const driver = await driverRepository.findOneBy({ id });
      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return driver;
    },
    // Get the logged-in driver's assigned route for today
    getMyAssignedRoute: async (_: any, __: any, context: any) => {
      if (!context.driver) {
        throw new GraphQLError('Not authenticated as driver', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const routeRepository = AppDataSource.getRepository(Route);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const route = await routeRepository.findOne({
        where: { 
          driver: { id: context.driver.id },
          date: today 
        },
        relations: ['stops', 'stops.child', 'driver', 'vehicle']
      });
      
      return route;
    },
  },
  Mutation: {
    // Create a new driver
    createDriver: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const newDriver = driverRepository.create(input);
      return await driverRepository.save(newDriver);
    },
    // Update an existing driver
    updateDriver: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const driver = await driverRepository.findOneBy({ id });
      if (!driver) {
        throw new GraphQLError('Driver not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      // Merge the input into the found driver entity
      Object.assign(driver, input);
      return await driverRepository.save(driver);
    },
    // Delete a driver
    deleteDriver: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const deleteResult = await driverRepository.delete(id);
      if (deleteResult.affected === 0) {
        return false; // Or throw an error if you prefer
      }
      return true;
    },
    // Driver login mutation
    driverLogin: async (_: any, { email, password }: any) => {
      const driver = await driverRepository.findOneBy({ email });
      if (!driver) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const isValidPassword = await bcrypt.compare(password, driver.password);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const token = jwt.sign(
        { driverId: driver.id, email: driver.email },
        JWT_SECRET,
        { expiresIn: '1d' } // Token expires in 1 day
      );

      return {
        token,
        driver,
      };
    },
  },
};
