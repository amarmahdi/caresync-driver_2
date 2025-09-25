import { AppDataSource } from '../../data-source';
import { Child } from '../../entities/Child';
import { GraphQLError } from 'graphql';

const childRepository = AppDataSource.getRepository(Child);

export const childResolvers = {
  Query: {
    // Get all children
    children: async (_: any, __: any, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await childRepository.find();
    },
    // Get a single child by ID
    child: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
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
    createChild: async (_: any, { input }: { input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const newChild = childRepository.create(input);
      return await childRepository.save(newChild);
    },
    // Update an existing child
    updateChild: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
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
    deleteChild: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const deleteResult = await childRepository.delete(id);
      if (deleteResult.affected === 0) {
        return false; // Or throw an error if you prefer
      }
      return true;
    },
  },
};
