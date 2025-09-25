# CareSync Driver - Intelligent Childcare Transportation System

CareSync Driver is a comprehensive transportation management system designed for childcare centers to efficiently coordinate and track child pickup/dropoff routes.

## 🚀 Project Overview

This system consists of three main components:
- **Backend API**: GraphQL server with TypeORM and SQLite
- **Admin Web Portal**: React-based management interface 
- **Driver Mobile App**: React Native app for drivers

## 🏗️ Architecture

### Backend (`CareSync_Driver_Backend/`)
- **Technology**: Node.js, TypeScript, Apollo Server, TypeORM, SQLite
- **Features**: 
  - GraphQL API with authentication
  - Intelligent route planning with Google Maps integration
  - User management (Admins & Drivers)
  - Real-time route optimization using clustering algorithms

### Admin Portal (`CareSync_Driver_Admin_Frontend/`)
- **Technology**: React, TypeScript, Material-UI, Apollo Client
- **Features**:
  - Child, Driver, and Vehicle management
  - Interactive mapping with geocoding
  - Route planning and assignment
  - Real-time dashboard

### Driver App (`driver-app/`)
- **Technology**: React Native, Expo, Apollo Client
- **Features**:
  - Driver authentication
  - Daily route viewing
  - Turn-by-turn navigation integration
  - Stop completion tracking

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- For mobile development: Expo CLI
- Optional: Android Studio (Android) or Xcode (iOS)

### Backend Setup
```bash
cd CareSync_Driver_Backend
npm install
npm run typeorm migration:run
npm run dev
```

### Admin Portal Setup
```bash
cd CareSync_Driver_Admin_Frontend  
npm install
npm start
```

### Driver App Setup
```bash
cd driver-app
npm install
npm start
```

## 🗄️ Database Schema

### Core Entities
- **Child**: Personal info, address, coordinates, care category
- **Driver**: Authentication, capabilities, certifications
- **Vehicle**: Capacity, safety equipment, assignments
- **Route**: Daily routes with stops and assignments
- **Stop**: Individual pickup/dropoff points with sequencing

### Key Features
- **Smart Route Planning**: Automatically generates optimized routes using:
  - Geographic clustering (K-means algorithm)
  - Capability matching (infant certified, toddler trained, etc.)
  - Equipment requirements (car seats, wheelchair access)
  - Travel time optimization (Google Maps Distance Matrix API)

## 📱 API Documentation

### Authentication
- Admin login: `login(email, password)`
- Driver login: `driverLogin(email, password)`
- JWT token-based auth with 1-day expiration

### Key Mutations
- `createChild(input)`: Add new child
- `createDriver(input)`: Add new driver 
- `createVehicle(input)`: Add new vehicle
- `planAllDailyRoutes(date)`: Generate optimized routes
- `geocodeAddress(address)`: Get coordinates from address

### Key Queries
- `children`: List all children
- `routes(date)`: Get routes for specific date
- `getMyAssignedRoute(date)`: Driver's daily route

## 🌟 Advanced Features

### Intelligent Route Planning
The system uses sophisticated algorithms to generate optimal routes:

1. **Eligibility Filtering**: Matches children to appropriate drivers/vehicles based on:
   - Age categories (infant, toddler, preschool)
   - Required certifications and equipment

2. **Geographic Clustering**: Groups children by location using K-means clustering

3. **Route Optimization**: Solves Traveling Salesman Problem with multiple algorithms:
   - Nearest Neighbor heuristic for speed
   - Greedy approach for balance
   - Brute force for optimal small routes

4. **Real-World Integration**: 
   - Google Maps geocoding for address validation
   - Distance Matrix API for accurate travel times
   - Turn-by-turn navigation in mobile app

### Security & Authentication
- Bcrypt password hashing
- JWT token authentication
- Role-based access control (Admin vs Driver)
- Secure token storage on mobile devices

## 🚗 Usage Workflow

1. **Admin Setup**: Create children, drivers, vehicles in web portal
2. **Route Planning**: Use "Plan Routes" to automatically generate daily schedules
3. **Driver Assignment**: Routes automatically assign compatible drivers/vehicles
4. **Mobile Execution**: Drivers receive routes on mobile app with navigation
5. **Real-time Tracking**: Mark stops complete, track progress

## 🔧 Environment Configuration

### Backend Environment Variables
```env
JWT_SECRET=your-super-secret-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
PORT=4000
```

### Production Deployment
- Backend: Deployed to DigitalOcean server
- Database: SQLite for development, PostgreSQL recommended for production
- Mobile: Expo build service for app store deployment

## 📊 Current Status

✅ **Completed Features:**
- Complete CRUD operations for all entities
- Advanced route optimization algorithms  
- Google Maps integration
- Authentication system
- Mobile app with navigation
- Admin web portal with interactive maps

🔄 **In Development:**
- Real-time GPS tracking
- Push notifications for route updates
- Advanced reporting and analytics
- Multi-tenant support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or support, please open an issue or contact the development team.

---

**Built with ❤️ for safer, smarter childcare transportation**
