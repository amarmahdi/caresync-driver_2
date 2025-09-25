Of course. Here is the detailed, step-by-step markdown file for **Module 6 of Phase 1**. This module is where the Admin Panel becomes truly useful. We will build the user interfaces for managing all the core data.

---

# Phase 1, Module 6: Building the Admin UI for CRUD

## 1. Objective

The goal of this module is to build the primary user interfaces for the Admin Panel. We will create pages for managing Children, Drivers, and Vehicles. Each page will feature a data table to display records and will include functionality to create, edit, and delete those records via forms and modals, leveraging the GraphQL API we've built.

## 2. Technical Stack

-   **Primary Tools:**
    -   **React:** For building UI components.
    -   **Material-UI (MUI):** Specifically using `@mui/material` for components like `Table`, `Button`, `Dialog` (for modals), `TextField`, and `@mui/x-data-grid` for a powerful data table.
    -   **Apollo Client:** Using `useQuery` and `useMutation` hooks for data fetching and updates.
    -   **React Router:** For navigation between management pages.

## 3. Pre-requisite Step: Install Data Grid

MUI's Data Grid is a powerful component for displaying tabular data with features like sorting, filtering, and pagination built-in. It's perfect for our needs.

1.  Stop your React development server if it's running.
2.  Install the Data Grid package:
    ```bash
    npm install @mui/x-data-grid
    ```

## 4. Step-by-Step Instructions

### ☐ **Step 1: Define All Necessary GraphQL Operations**

Before building the UI, define all the queries and mutations needed in one place.

1.  Create `src/graphql/queries.ts`.
    ```typescript
    // src/graphql/queries.ts
    import { gql } from '@apollo/client';

    export const GET_CHILDREN = gql`
      query GetChildren {
        children {
          id
          name
          addressStreet
          addressCity
          category
        }
      }
    `;
    // ... Define GET_DRIVERS and GET_VEHICLES similarly ...
    ```

2.  Update `src/graphql/mutations.ts` with all CRUD operations.
    ```typescript
    // src/graphql/mutations.ts
    import { gql } from '@apollo/client';
    
    // ... (keep LOGIN_MUTATION) ...
    
    export const CREATE_CHILD = gql`
      mutation CreateChild($input: CreateChildInput!) {
        createChild(input: $input) {
          id
          name
        }
      }
    `;

    export const UPDATE_CHILD = gql`
      mutation UpdateChild($id: ID!, $input: UpdateChildInput!) {
        updateChild(id: $id, input: $input) {
          id
          name
        }
      }
    `;
    
    export const DELETE_CHILD = gql`
      mutation DeleteChild($id: ID!) {
        deleteChild(id: $id)
      }
    `;
    // ... Define CREATE/UPDATE/DELETE mutations for Driver and Vehicle ...
    ```

### ☐ **Step 2: Create a Reusable Layout Component**

We need a consistent layout with a navigation sidebar for our admin pages.

1.  Create a new component `src/components/Layout.tsx`.
2.  This component will render a sidebar (Drawer), an app bar, and the main content area. It will also handle the "logout" functionality.

    ```tsx
    // src/components/Layout.tsx
    import React from 'react';
    import { useNavigate, Link as RouterLink } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext';
    import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, AppBar, Toolbar, Typography, Button } from '@mui/material';

    const drawerWidth = 240;

    export const Layout = ({ children }: { children: React.ReactNode }) => {
      const { logout } = useAuth();
      const navigate = useNavigate();

      const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to login page
      };

      const menuItems = [
        { text: 'Dashboard', path: '/dashboard' },
        { text: 'Children', path: '/children' },
        { text: 'Drivers', path: '/drivers' },
        { text: 'Vehicles', path: '/vehicles' },
      ];

      return (
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Daycare Admin
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton component={RouterLink} to={item.path}>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            {children}
          </Box>
        </Box>
      );
    };
    ```

### ☐ **Step 3: Build the Children Management Page**

This will be our template for the other management pages.

1.  Create a new page component `src/pages/ChildrenPage.tsx`.
2.  **Fetch and Display Data:**
    -   Use the `useQuery` hook with `GET_CHILDREN` to fetch the list of children.
    -   Use MUI's `<DataGrid />` to display the data. Define the `columns` for the grid.
    -   Handle loading and error states from the query.
3.  **Add Action Buttons:** Add a "Create Child" button. In the `DataGrid`, add an "actions" column with "Edit" and "Delete" buttons for each row.
4.  **Implement Delete:** The "Delete" button will call a `deleteChild` mutation from Apollo Client. **Crucially, you must refetch the `GET_CHILDREN` query after a successful deletion** to update the UI.

    ```tsx
    // src/pages/ChildrenPage.tsx (Simplified structure)
    import React from 'react';
    import { useQuery, useMutation } from '@apollo/client';
    import { GET_CHILDREN, DELETE_CHILD } from '../graphql'; // Assuming a barrel export from graphql folder
    import { Box, Button, Typography, CircularProgress } from '@mui/material';
    import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
    import DeleteIcon from '@mui/icons-material/Delete';
    import EditIcon from '@mui/icons-material/Edit';

    export const ChildrenPage = () => {
      const { data, loading, error } = useQuery(GET_CHILDREN);
      const [deleteChild] = useMutation(DELETE_CHILD, {
        // Refetch the list of children after a deletion
        refetchQueries: [{ query: GET_CHILDREN }],
      });

      const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this child?')) {
          deleteChild({ variables: { id } });
        }
      };
      
      const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'category', headerName: 'Category', flex: 1 },
        { field: 'addressStreet', headerName: 'Address', flex: 2 },
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Actions',
          width: 100,
          getActions: (params) => [
            <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => {/* TODO */}} />,
            <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => handleDelete(params.id as string)} />,
          ],
        },
      ];

      if (loading) return <CircularProgress />;
      if (error) return <Typography color="error">Error: {error.message}</Typography>;

      return (
        <Box>
          <Typography variant="h4" gutterBottom>Manage Children</Typography>
          <Button variant="contained" sx={{ mb: 2 }}>Create Child</Button>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={data?.children || []}
              columns={columns}
              getRowId={(row) => row.id}
            />
          </Box>
        </Box>
      );
    };
    ```

### ☐ **Step 4: Create a Reusable Form/Modal for Create/Edit**

We will create a single form component that can handle both creating a new child and editing an existing one.

1.  Create a new component `src/components/ChildFormModal.tsx`.
2.  The component will accept props: `open` (to control visibility), `onClose`, and `child` (an optional object; if provided, the form is in "edit" mode).
3.  Use MUI's `<Dialog>`, `<DialogTitle>`, `<DialogContent>`, and `<DialogActions>` for the modal structure.
4.  Use `<TextField>`, `<Select>`, etc., for the form fields.
5.  Use the `useMutation` hook for both `CREATE_CHILD` and `UPDATE_CHILD`. The `handleSubmit` function will decide which mutation to call based on whether the `child` prop exists.
6.  On successful mutation, call the `onClose` prop and **refetch the `GET_CHILDREN` query**.

### ☐ **Step 5: Integrate the Form Modal into the Page**

1.  Go back to `src/pages/ChildrenPage.tsx`.
2.  Use `useState` to manage the modal's visibility and the currently selected child for editing.
3.  The "Create Child" button will open the modal with no `child` prop.
4.  The "Edit" button in the Data Grid will open the modal and pass the data for that row as the `child` prop.

### ☐ **Step 6: Update Application Routing**

1.  Open `src/App.tsx`.
2.  Import the new pages and the `Layout` component.
3.  Wrap all protected routes within the `Layout`.

    ```tsx
    // src/App.tsx (updated)
    // ... imports
    import { Layout } from './components/Layout';
    import { ChildrenPage } from './pages/ChildrenPage';
    // Import Driver and Vehicle pages once created
    
    // ...
    const DashboardPage = () => <h1>Welcome to the Dashboard!</h1>;
    // ...
    
    function App() {
      return (
        <ApolloProvider client={client}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
                <Route path="/children" element={<ProtectedRoute><Layout><ChildrenPage /></Layout></ProtectedRoute>} />
                {/* TODO: Add routes for /drivers and /vehicles */}
              </Routes>
            </Router>
          </AuthProvider>
        </ApolloProvider>
      );
    }
    ```

### ☐ **Step 7: Replicate for Drivers and Vehicles**

Now, apply the pattern established in steps 3, 4, and 5 to create the management pages for Drivers and Vehicles.

1.  **Create `src/pages/DriversPage.tsx` and `src/pages/VehiclesPage.tsx`**. They will follow the same structure as `ChildrenPage.tsx`.
2.  **Create `src/components/DriverFormModal.tsx` and `src/components/VehicleFormModal.tsx`**.
3.  Add the new routes (`/drivers`, `/vehicles`) to `src/App.tsx`.

### ☐ **Step 8: Validate the Full UI**

1.  Run the application (`npm start`).
2.  Log in as the admin.
3.  Navigate to the "Children" page using the sidebar.
4.  **Test Create:** Click "Create Child", fill out the form, and save. The new child should appear in the data grid without needing a page refresh.
5.  **Test Edit:** Click the "Edit" icon on the child you just created. Change their name and save. The name should update in the grid.
6.  **Test Delete:** Click the "Delete" icon. Confirm the action. The child should be removed from the grid.
7.  **Repeat** the entire validation process for the "Drivers" and "Vehicles" pages.

## 4. Final Deliverables for this Module

-   A complete set of GraphQL query and mutation definitions in the frontend.
-   A reusable `Layout` component with sidebar navigation and a logout button.
-   Fully functional management pages (`ChildrenPage`, `DriversPage`, `VehiclesPage`) that display data in a Data Grid.
-   Reusable form modals for creating and editing each type of data.
-   All CRUD operations are functional from the UI and update the view correctly by refetching data.
-   The application's routing is updated to include all new management pages, protected by the authentication layer.