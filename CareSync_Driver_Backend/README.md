# CareSync Driver Backend

This is the backend API for the CareSync Driver application, built following the Phase 1, Module 1 specifications.

## Technology Stack

- **Runtime:** Node.js (LTS version)
- **Language:** TypeScript
- **GraphQL Server:** Apollo Server v5 (Standalone)
- **Database:** SQLite
- **ORM:** TypeORM
- **Node Driver for SQLite:** `better-sqlite3`

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── data-source.ts        # TypeORM database configuration
├── entities/            # TypeORM entity definitions
│   ├── Child.ts         # Child entity with categories
│   ├── Driver.ts        # Driver entity with capabilities
│   └── Vehicle.ts       # Vehicle entity with equipment
├── graphql/             # GraphQL schema definitions
│   └── schema.ts        # GraphQL type definitions and queries
└── migrations/          # Database migration files
    └── *-InitialSchema.ts # Initial database schema
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Access the GraphQL Playground:**
   Open your browser and navigate to `http://localhost:4000/`

## Development

The server runs with live reloading enabled via `ts-node-dev`. Any changes to the source files will automatically restart the server.

## Database

- **Database file:** `database.sqlite` (created automatically in the root directory)
- **ORM:** TypeORM with synchronization enabled for development
- **Logging:** SQL queries are logged to the console

### Note on Geospatial Data

SQLite does not have native support for PostGIS. For Phase 1, we will store `latitude` and `longitude` as simple `float` columns. Advanced geospatial queries will be implemented in a later phase when we migrate to PostgreSQL.

## GraphQL Schema

The API includes the following types and queries:

### Types
- **Child** - Represents a child with address, location, and category (infant, toddler, preschool, out-of-school care)
- **Driver** - Represents a driver with capabilities (infant certified, toddler trained, special needs)
- **Vehicle** - Represents a vehicle with capacity and equipment (infant seats, booster seats, wheelchair lift, etc.)
- **Admin** - Represents an authenticated administrator with email and hashed password
- **AuthPayload** - Contains JWT token and admin information returned after successful login

### Queries (READ Operations) - 🔒 Requires Authentication
- `Query.children` - Returns list of all children
- `Query.child(id: ID!)` - Returns a single child by ID
- `Query.drivers` - Returns list of all drivers
- `Query.driver(id: ID!)` - Returns a single driver by ID
- `Query.vehicles` - Returns list of all vehicles
- `Query.vehicle(id: ID!)` - Returns a single vehicle by ID
- `Query.me` - Returns currently authenticated admin information

### Mutations (CREATE, UPDATE, DELETE Operations)
**Create Operations:**
- `Mutation.createChild(input: CreateChildInput!)` - Creates a new child
- `Mutation.createDriver(input: CreateDriverInput!)` - Creates a new driver
- `Mutation.createVehicle(input: CreateVehicleInput!)` - Creates a new vehicle

**Update Operations:**
- `Mutation.updateChild(id: ID!, input: UpdateChildInput!)` - Updates an existing child
- `Mutation.updateDriver(id: ID!, input: UpdateDriverInput!)` - Updates an existing driver
- `Mutation.updateVehicle(id: ID!, input: UpdateVehicleInput!)` - Updates an existing vehicle

**Delete Operations:** 🔒 Requires Authentication
- `Mutation.deleteChild(id: ID!)` - Deletes a child (returns Boolean)
- `Mutation.deleteDriver(id: ID!)` - Deletes a driver (returns Boolean)
- `Mutation.deleteVehicle(id: ID!)` - Deletes a vehicle (returns Boolean)

**Authentication Operations:**
- `Mutation.registerAdmin(email: String!, password: String!)` - Registers a new admin (typically run once)
- `Mutation.login(email: String!, password: String!)` - Authenticates admin and returns JWT token

### Database Tables
The following tables have been created via migration:
- `child` - Child records with address and geolocation fields
- `driver` - Driver records with capabilities stored as comma-separated values
- `vehicle` - Vehicle records with equipment stored as comma-separated values
- `admin` - Admin user records with hashed passwords
- `migrations` - TypeORM migration tracking table

## API Testing

You can test the GraphQL CRUD API by using the browser preview above or navigating to `http://localhost:4000/`. 

**⚠️ Important:** All data operations require authentication. You must first register an admin and login to receive a JWT token.

### Step 1: Register an Admin
```graphql
mutation {
  registerAdmin(email: "admin@daycare.com", password: "securepassword123") {
    id
    email
  }
}
```

### Step 2: Login to Get JWT Token
```graphql
mutation {
  login(email: "admin@daycare.com", password: "securepassword123") {
    token
    admin {
      id
      email
    }
  }
}
```

### Step 3: Set Authorization Header
Copy the token from Step 2 and add it to your request headers:
```json
{
  "Authorization": "Bearer your-jwt-token-here"
}
```

### Step 4: Test Authenticated Operations

#### Create a Child
```graphql
mutation {
  createChild(input: {
    name: "Jane Doe",
    addressStreet: "123 Main St",
    addressCity: "Anytown",
    category: PRESCHOOL
  }) {
    id
    name
    category
  }
}
```

### Query All Children
```graphql
query {
  children {
    id
    name
    addressStreet
    addressCity
    category
    latitude
    longitude
  }
}
```

### Update a Child
```graphql
mutation {
  updateChild(id: "your-child-id-here", input: {
    name: "Jane Smith",
    latitude: 40.7128,
    longitude: -74.0060
  }) {
    id
    name
    latitude
    longitude
  }
}
```

### Delete a Child
```graphql
mutation {
  deleteChild(id: "your-child-id-here")
}
```

Similar operations are available for `Driver` and `Vehicle` entities with their respective input types and fields.

### Development Commands

- `npm run dev` - Start development server with live reload
- `npm run typeorm migration:generate src/migrations/MigrationName` - Generate a new migration
- `npm run typeorm migration:run` - Run pending migrations
