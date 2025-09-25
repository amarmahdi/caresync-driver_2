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
