import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { AppDataSource } from './data-source';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import * as jwt from 'jsonwebtoken';
import { Admin } from './entities/Admin';
import { Driver } from './entities/Driver';

// Same secret as in your resolvers
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

const main = async () => {
  // Initialize the database connection
  try {
    await AppDataSource.initialize();
    console.log('✅ Data Source has been initialized!');
  } catch (err) {
    console.error('❌ Error during Data Source initialization', err);
    return;
  }

  // Set up Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers, // Use the imported merged resolvers
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    // ====== NEW: CONTEXT FUNCTION ======
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
      
      if (token) {
        try {
          const payload = jwt.verify(token, JWT_SECRET) as any;
          
          // Check if this is an admin token (has adminId)
          if (payload.adminId) {
            const adminRepository = AppDataSource.getRepository(Admin);
            const admin = await adminRepository.findOneBy({ id: payload.adminId });
            return { admin };
          }
          
          // Check if this is a driver token (has driverId)
          if (payload.driverId) {
            const driverRepository = AppDataSource.getRepository(Driver);
            const driver = await driverRepository.findOneBy({ id: payload.driverId });
            return { driver };
          }
          
          return {};
        } catch (err) {
          // Token is invalid or expired
          return {};
        }
      }
      return {};
    },
  });
  
  console.log(`🚀 GraphQL server ready at ${url}`);
};

main().catch((err) => {
  console.error(err);
});
