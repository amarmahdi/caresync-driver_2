Of course. Here is the detailed, step-by-step markdown file for **Module 5 of Phase 1**. This module marks a major milestone as we shift focus to the frontend and build the foundation for the admin's user interface.

---

# Phase 1, Module 5: Frontend - Admin Panel Setup & API Integration

## 1. Objective

The goal of this module is to set up a modern React web application for our Admin Panel. We will establish the core structure, install necessary libraries, and configure Apollo Client to communicate with our now-secure GraphQL backend. By the end of this module, we will have a functional, multi-page application where an admin can log in and out, with their authentication state managed securely.

## 2. Technical Stack

-   **Framework:** React (using Create React App with a TypeScript template)
-   **GraphQL Client:** Apollo Client
-   **Routing:** React Router
-   **UI Library:** Material-UI (MUI) - for professional, pre-built components.
-   **Language:** TypeScript

## 3. Step-by-Step Instructions

### ☐ **Step 1: Initialize the React Project**

1.  Navigate to the **root of your overall project directory** (outside the backend API folder).
2.  Use Create React App (CRA) to bootstrap a new React project with a TypeScript template.
    ```bash
    npx create-react-app admin-panel --template typescript
    ```
3.  Navigate into the new project directory: `cd admin-panel`.
4.  Start the development server to ensure everything is working correctly.
    ```bash
    npm start
    ```
    Your browser should open to `http://localhost:3000` and display the default React landing page.

### ☐ **Step 2: Install Frontend Dependencies**

1.  Stop the development server (Ctrl+C).
2.  Install all the key libraries we will need for the application.
    ```bash
    # Apollo Client for connecting to our GraphQL API
    npm install @apollo/client graphql

    # React Router for page navigation
    npm install react-router-dom
    npm install --save-dev @types/react-router-dom

    # Material-UI for UI components
    npm install @mui/material @emotion/react @emotion/styled
    npm install @mui/icons-material # For icons
    ```

### ☐ **Step 3: Set Up Project Structure and Global Styles**

1.  Inside the `src` folder, create a new folder structure to keep our application organized:
    -   `src/components`: For reusable UI components (e.g., `Layout`, `ProtectedRoute`).
    -   `src/pages`: For top-level page components (e.g., `LoginPage`, `DashboardPage`).
    -   `src/graphql`: For all GraphQL-related files (queries, mutations).
    -   `src/lib`: For client configurations, like Apollo Client.
    -   `src/context`: For React Context to manage global state like authentication.
2.  **Set up MUI:** In `src/index.tsx`, wrap the `<App />` component with MUI's `ThemeProvider` and `CssBaseline` to ensure consistent styling.
    ```tsx
    // src/index.tsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import { ThemeProvider, createTheme } from '@mui/material/styles';
    import CssBaseline from '@mui/material/CssBaseline';

    const theme = createTheme(); // Using the default MUI theme for now

    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
    ```

### ☐ **Step 4: Configure Apollo Client**

This is the critical step for connecting the frontend to the backend. Apollo Client needs to know where our API is and how to include the auth token in requests.

1.  Create a new file `src/lib/apolloClient.ts`.
2.  Populate it with the following configuration:
    ```typescript
    // src/lib/apolloClient.ts
    import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
    import { setContext } from '@apollo/client/link/context';

    // Link to your GraphQL API endpoint
    const httpLink = createHttpLink({
      uri: 'http://localhost:4000/graphql', // Your backend URL
    });

    // This middleware will add the token to the headers of each request
    const authLink: ApolloLink = setContext((_, { headers }) => {
      // Get the authentication token from local storage if it exists
      const token = localStorage.getItem('authToken');
      // Return the headers to the context so httpLink can read them
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        }
      }
    });

    const client = new ApolloClient({
      // The `authLink` is chained before the `httpLink`
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });

    export default client;
    ```
3.  Now, provide this client to your entire React application. Open `src/App.tsx` and wrap the content with `ApolloProvider`.
    ```tsx
    // src/App.tsx
    import React from 'react';
    import { ApolloProvider } from '@apollo/client';
    import client from './lib/apolloClient';

    function App() {
      return (
        <ApolloProvider client={client}>
          {/* The rest of our application will go here */}
          <h1>Welcome to the Admin Panel</h1>
        </ApolloProvider>
      );
    }

    export default App;
    ```

### ☐ **Step 5: Implement Authentication Context**

We need a global way to know if a user is logged in. React Context is perfect for this.

1.  Create `src/context/AuthContext.tsx`.
    ```tsx
    // src/context/AuthContext.tsx
    import React, { createContext, useState, useContext, ReactNode } from 'react';

    interface AuthContextType {
      isAuthenticated: boolean;
      login: (token: string) => void;
      logout: () => void;
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    export const AuthProvider = ({ children }: { children: ReactNode }) => {
      const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));

      const login = (token: string) => {
        localStorage.setItem('authToken', token);
        setIsAuthenticated(true);
      };

      const logout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      };

      return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
          {children}
        </AuthContext.Provider>
      );
    };

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };
    ```
2.  Wrap your application with this new provider in `src/App.tsx`.
    ```tsx
    // src/App.tsx (updated)
    // ... imports
    import { AuthProvider } from './context/AuthContext';

    function App() {
      return (
        <ApolloProvider client={client}>
          <AuthProvider>
            {/* The rest of our application will go here */}
            <h1>Welcome to the Admin Panel</h1>
          </AuthProvider>
        </ApolloProvider>
      );
    }
    ```

### ☐ **Step 6: Implement Routing and the Login Page**

1.  **Define GraphQL Mutation:** Create `src/graphql/mutations.ts`.
    ```typescript
    // src/graphql/mutations.ts
    import { gql } from '@apollo/client';

    export const LOGIN_MUTATION = gql`
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
        }
      }
    `;
    ```
2.  **Create Login Page:** Create `src/pages/LoginPage.tsx`.
    ```tsx
    // src/pages/LoginPage.tsx
    import React, { useState } from 'react';
    import { useMutation } from '@apollo/client';
    import { LOGIN_MUTATION } from '../graphql/mutations';
    import { useAuth } from '../context/AuthContext';
    import { useNavigate } from 'react-router-dom';
    import { TextField, Button, Container, Typography, Box } from '@mui/material';

    export const LoginPage = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const { login } = useAuth();
      const navigate = useNavigate();
      const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          const { data } = await loginMutation({ variables: { email, password } });
          if (data?.login.token) {
            login(data.login.token);
            navigate('/dashboard'); // Redirect to dashboard on success
          }
        } catch (err) {
          console.error('Login failed:', err);
        }
      };

      return (
        <Container maxWidth="xs">
          <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Sign In</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField margin="normal" required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <Typography color="error">{error.message}</Typography>}
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Container>
      );
    };
    ```
3.  **Set Up App Routing:** Update `src/App.tsx` to handle routing.
    ```tsx
    // src/App.tsx (final for this module)
    import React from 'react';
    import { ApolloProvider } from '@apollo/client';
    import client from './lib/apolloClient';
    import { AuthProvider } from './context/AuthContext';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { LoginPage } from './pages/LoginPage';

    // A placeholder for our protected dashboard page
    const DashboardPage = () => <h1>Dashboard - You are logged in!</h1>;
    // A component to protect routes
    const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
      // For this module, we'll just navigate to a placeholder.
      // In a real app, this would use the useAuth() hook to check isAuthenticated.
      const token = localStorage.getItem('authToken');
      return token ? children : <Navigate to="/" />;
    };

    function App() {
      return (
        <ApolloProvider client={client}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              </Routes>
            </Router>
          </AuthProvider>
        </ApolloProvider>
      );
    }

    export default App;
    ```

### ☐ **Step 7: Validate the Flow**

1.  Make sure your backend API server is running (`npm run dev`).
2.  Start the React app: `npm start`.
3.  You should be directed to the `LoginPage`.
4.  Try to navigate to `/dashboard`. You should be redirected back to the login page.
5.  Enter the admin credentials you created in Module 4.
6.  Upon successful login, you should be redirected to the `/dashboard` page, which displays the "Dashboard - You are logged in!" message.
7.  Check your browser's Local Storage (in Developer Tools). You should see an `authToken` key with a JWT value.
8.  Refresh the `/dashboard` page. You should remain logged in.

## 4. Final Deliverables for this Module

-   A fully initialized React project with all necessary dependencies.
-   A configured Apollo Client capable of sending authenticated requests to the backend.
-   A global `AuthContext` for managing login/logout state.
-   A functional `LoginPage` that can successfully authenticate against the backend API.
-   A basic routing setup with a protected `/dashboard` route.
-   Successful validation of the entire login and redirection flow.