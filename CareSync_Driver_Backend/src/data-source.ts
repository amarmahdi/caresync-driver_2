import { DataSource } from 'typeorm';
import { Child } from './entities/Child';
import { Driver } from './entities/Driver';
import { Vehicle } from './entities/Vehicle';
import { Admin } from './entities/Admin';
import { Route } from './entities/Route';
import { Stop } from './entities/Stop';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'database.sqlite',
  synchronize: false, // IMPORTANT: Set to false now that we will use migrations
  logging: true,
  entities: [Child, Driver, Vehicle, Admin, Route, Stop], // Add your entities here
  migrations: ['./src/migrations/*.ts'], // Point to the migrations folder
  subscribers: [],
});
