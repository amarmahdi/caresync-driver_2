export const typeDefs = `#graphql
  # ENUMS (from previous module)
  enum ChildCategory { infant, toddler, preschool, out_of_school_care }
  enum DriverCapability { infant_certified, toddler_trained, special_needs }
  enum VehicleEquipment { infant_seat, toddler_seat, booster_seat, wheelchair_lift }

  # TYPES (from previous module)
  type Child { id: ID!, name: String!, addressStreet: String!, addressCity: String!, addressState: String, latitude: Float, longitude: Float, category: ChildCategory! }
  type Driver { id: ID!, name: String!, email: String!, capabilities: [DriverCapability!] }
  type Vehicle { id: ID!, name: String!, capacity: Int!, equipment: [VehicleEquipment!] }
  
  # ====== NEW: AUTH TYPES ======
  type Admin {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    admin: Admin
    driver: Driver
  }
  
  # ====== NEW: GEOCODING TYPES ======
  type Coordinates {
    latitude: Float!
    longitude: Float!
  }
  
  # ====== NEW: ROUTE & STOP ENUMS/TYPES ======
  enum StopType { pickup, dropoff }
  enum StopStatus { pending, completed }
  enum RouteStatus { planning, assigned, in_progress, completed }

  type Stop {
    id: ID!
    sequence: Int!
    type: StopType!
    status: StopStatus!
    child: Child!
  }

  type Route {
    id: ID!
    name: String!
    status: RouteStatus!
    date: String!
    stops: [Stop!]!
    driver: Driver
    vehicle: Vehicle
  }

  type UnroutableChild {
    child: Child!
    reason: String!
  }

  type PlanningResult {
    generatedRoutes: [Route!]!
    unroutableChildren: [UnroutableChild!]!
  }
  
  # ====== NEW: INPUT TYPES ======
  input CreateChildInput {
    name: String!
    addressStreet: String!
    addressCity: String!
    addressState: String
    category: ChildCategory!
  }
  
  input UpdateChildInput {
    name: String
    addressStreet: String
    addressCity: String
    addressState: String
    category: ChildCategory
    latitude: Float
    longitude: Float
  }
  
  input CreateDriverInput {
    name: String!
    email: String!
    password: String!
    capabilities: [DriverCapability!]
  }
  
  input UpdateDriverInput {
    name: String
    email: String
    capabilities: [DriverCapability!]
  }
  
  input CreateVehicleInput {
    name: String!
    capacity: Int!
    equipment: [VehicleEquipment!]
  }
  
  input UpdateVehicleInput {
    name: String
    capacity: Int
    equipment: [VehicleEquipment!]
  }

  type Query {
    # READ operations
    children: [Child!]!
    child(id: ID!): Child
    
    drivers: [Driver!]!
    driver(id: ID!): Driver
    
    vehicles: [Vehicle!]!
    vehicle(id: ID!): Vehicle
    
    # AUTH operations
    me: Admin
    
    # GEOCODING operations
    geocodeAddress(address: String!): Coordinates
    
    # ROUTE operations
    routes(date: String!): [Route!]!
    route(id: ID!): Route
    
    # For the logged-in driver to get their route for the day
    getMyAssignedRoute(date: String!): Route
  }

  # ====== NEW: MUTATION TYPES ======
  type Mutation {
    # CREATE operations
    createChild(input: CreateChildInput!): Child!
    createDriver(input: CreateDriverInput!): Driver!
    createVehicle(input: CreateVehicleInput!): Vehicle!
    
    # UPDATE operations
    updateChild(id: ID!, input: UpdateChildInput!): Child!
    updateDriver(id: ID!, input: UpdateDriverInput!): Driver!
    updateVehicle(id: ID!, input: UpdateVehicleInput!): Vehicle!
    
    # DELETE operations
    deleteChild(id: ID!): Boolean!
    deleteDriver(id: ID!): Boolean!
    deleteVehicle(id: ID!): Boolean!
    
    # ====== NEW: AUTH MUTATIONS ======
    # This is typically only run once or from a secure CLI
    registerAdmin(email: String!, password: String!): Admin!
    login(email: String!, password: String!): AuthPayload!
    driverLogin(email: String!, password: String!): AuthPayload!
    
    # ====== NEW: INTELLIGENT ROUTE PLANNING ======
    # The "Magic Button" - plans ALL routes for a day automatically
    planAllDailyRoutes(date: String!): PlanningResult!
    
    # ====== MANUAL ROUTE CONTROL MUTATIONS ======
    createManualRoute(name: String!, date: String!): Route!
    addStopToRoute(routeId: ID!, childId: ID!): Route!
    removeStopFromRoute(stopId: ID!): Route!
    reorderStops(routeId: ID!, stopIds: [ID!]!): Route!
    assignDriverAndVehicleToRoute(routeId: ID!, driverId: ID!, vehicleId: ID!): Route!
    deleteRoute(routeId: ID!): Boolean!
  }
`;
