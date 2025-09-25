import { childResolvers } from './childResolvers';
import { driverResolvers } from './driverResolvers';
import { vehicleResolvers } from './vehicleResolvers';
import { adminResolvers } from './adminResolvers';
import { geocodingResolvers } from './geocodingResolvers';
import { routeResolvers } from './routeResolvers';

// In a real app, you'd use a library like lodash to deep merge.
// For now, a simple merge is fine as there are no overlapping keys.
export const resolvers = {
  Query: {
    ...childResolvers.Query,
    ...driverResolvers.Query,
    ...vehicleResolvers.Query,
    ...adminResolvers.Query,
    ...geocodingResolvers.Query,
    ...routeResolvers.Query,
  },
  Mutation: {
    ...childResolvers.Mutation,
    ...driverResolvers.Mutation,
    ...vehicleResolvers.Mutation,
    ...adminResolvers.Mutation,
    ...routeResolvers.Mutation,
  },
};
