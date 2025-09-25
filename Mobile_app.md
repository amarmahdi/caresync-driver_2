Excellent choice. Using **Expo** is a fantastic decision for this project. It will dramatically simplify the development process, manage boilerplate configuration, and make building and deploying the app for both iOS and Android much faster.

Let's revise the entire plan for **Phase 4** to be Expo-centric. The core logic remains the same, but the tools and specific implementation details change for the better.

---

### **Phase 4 (Expo Edition): The Driver's App**

**Objective:** Build a clean, focused, and cross-platform mobile app using Expo that allows drivers to log in, view their assigned route, and update their progress in real-time.

---

### **Phase 4, Module 1: Expo Project Setup & Authentication**

**Goal:** Initialize a new Expo project. Implement the login screen and the logic to fetch and securely store the authentication token using Expo's libraries.

1.  **Initialize Expo Project:**
    -   In your main project folder, run the Expo CLI command.
    -   `npx create-expo-app driver-app --template`
    -   Choose the "Blank (TypeScript)" template when prompted.
    -   `cd driver-app`

2.  **Install Core Dependencies:** Expo manages many native dependencies for you, but we still need our core libraries.
    ```bash
    npx expo install @apollo/client graphql @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
    
    # For secure storage, Expo has a great alternative to react-native-keychain
    npx expo install expo-secure-store
    ```
    *Using `npx expo install` is crucial as it ensures you get versions of libraries that are compatible with your Expo SDK version.*

3.  **Set Up Apollo Client:**
    -   Create `src/lib/apolloClient.ts`.
    -   It will use `expo-secure-store` to get the token for the `authLink`.
        ```typescript
        // in driver-app/src/lib/apolloClient.ts
        import { setContext } from '@apollo/client/link/context';
        import * as SecureStore from 'expo-secure-store';

        const authLink = setContext(async (_, { headers }) => {
          const token = await SecureStore.getItemAsync('authToken');
          return {
            headers: {
              ...headers,
              authorization: token ? `Bearer ${token}` : '',
            },
          };
        });
        // ... rest of the client setup
        ```

4.  **Implement Authentication Context:**
    -   Create an `AuthContext` in `src/context/AuthContext.tsx`.
    -   The `login` function will call `await SecureStore.setItemAsync('authToken', token)`.
    -   The `logout` function will call `await SecureStore.deleteItemAsync('authToken')`.

5.  **Set Up App Navigation & Login Screen:**
    -   In your main `App.tsx`, set up a `NavigationContainer`.
    -   Use your `AuthContext` to conditionally render either a `LoginScreen` or the main `AppStack`. This is the standard Expo navigation flow.
    -   The `LoginScreen` will have the email/password fields and will call the `driverLogin` mutation.

6.  **Start Development:**
    -   Run `npx expo start`.
    -   This opens the Metro bundler in your browser. You can scan the QR code with the **Expo Go** app on your physical iOS or Android device to see your app running instantly. This is a major advantage of the Expo workflow.

**Outcome:** A developer can start the project and immediately see the login screen running on their own phone. A driver can log in, and their session token is securely stored on the device using `expo-secure-store`.

---

### **Phase 4, Module 2: The Route Screen - Viewing the Daily Mission**

**Goal:** Create the main screen of the app where the driver sees their assigned route for the day as a clear, ordered list of stops.

1.  **GraphQL Query:** Define the `getMyAssignedRoute` query in a `queries.ts` file.
2.  **Build the `RouteScreen.tsx`:**
    -   This screen is the main destination after a successful login.
    -   Use the `useQuery` hook to fetch the route data.
    -   **Handle States:**
        -   **Loading:** Use an `<ActivityIndicator />` component.
        -   **No Route:** Display a clear message: "No route assigned for today."
        -   **Route Found:** Render the main UI.
3.  **Design the Route UI (Expo Components):**
    -   Use core React Native components like `<View>`, `<Text>`, and `<ScrollView>` or `<FlatList>`. No special Expo components are needed here, but the development experience is much smoother.
    -   **Header:** Display the Route Name.
    -   **Stop List:** Use a `<FlatList>` to render the `route.stops` array, sorted by `sequence`.
    -   **`StopListItem.tsx` Component:** Create a list item component with:
        -   Sequence number, child's name, and full address.
        -   Status indicator (e.g., "Pending").
        -   Action Buttons: "Navigate" and "Mark as Completed." We can use Expo's vector icon library for nice icons on these buttons.

**Outcome:** A logged-in driver sees their complete, ordered mission for the day. The UI is clean, performant, and easy to understand.

---

### **Phase 4, Module 3: Interaction & Real-Time Updates**

**Goal:** Make the app interactive by enabling navigation and allowing drivers to update stop statuses.

1.  **Implement Navigation (Expo Linking):**
    -   Expo simplifies the `Linking` API slightly, but the concept is the same.
        ```typescript
        import * as Linking from 'expo-linking';

        const handleNavigate = (address: string) => {
          // Expo's Linking API handles platform differences for geo URIs
          const url = `geo:?q=${encodeURIComponent(address)}`;
          Linking.openURL(url);
        };
        ```
    -   The "Navigate" button in `StopListItem.tsx` calls this function. This will open the default maps app on the driver's phone.

2.  **Backend Status Update Mutation:**
    -   This is the same backend work as in the previous plan:
    -   Add a `status` field to the `Stop` entity (with an enum `PENDING`, `COMPLETED`, `SKIPPED`) and run a migration.
    -   Create the `updateStopStatus(stopId: ID!, status: StopStatus!)` mutation and resolver.

3.  **Implement Frontend Status Updates:**
    -   The "Mark as Completed" button in `StopListItem.tsx` calls the `updateStopStatus` mutation.
    -   Use the `onCompleted` or `update` function in `useMutation` to update the local Apollo cache. This will make the UI change instantly without needing a full refetch.
        ```typescript
        const [updateStatus, { loading }] = useMutation(UPDATE_STOP_STATUS, {
          // This updates the Apollo cache directly for an instant UI change
          update(cache, { data: { updateStopStatus } }) {
            cache.modify({
              id: cache.identify({ __typename: 'Stop', id: updateStopStatus.id }),
              fields: {
                status() {
                  return updateStopStatus.status;
                },
              },
            });
          },
        });
        ```
    -   The `StopListItem`'s style (e.g., background color, icon) should be conditional on the `stop.status` prop, so it changes visually when the status is updated.

**Outcome:** The app becomes an interactive tool. The driver can navigate to stops and update their status with the tap of a button. The changes are sent to the server and reflected instantly in the app's UI.

---

### **Phase 4, Module 4: Polish and Expo-Specific Features**

**Goal:** Add features that improve the user experience and leverage the Expo ecosystem.

1.  **Pull-to-Refresh:** Use the `refreshing` and `onRefresh` props of the `<FlatList>` component to allow drivers to manually refetch their route.
2.  **Child Details & Calling:**
    -   When a driver taps a stop item, navigate to a "Child Detail" screen.
    -   This screen can show parent contact info.
    -   Add a "Call Parent" button. Use Expo's Linking API for this as well:
        ```typescript
        Linking.openURL(`tel:${parentPhoneNumber}`);
        ```
3.  **Push Notifications (Expo EAS):**
    -   This is a key area where Expo shines.
    -   **Backend:** When the admin assigns a new route or makes a critical change, the backend resolver can send a push notification token to a service like Firebase Cloud Messaging (FCM).
    -   **Frontend:** Use `expo-notifications` to get the user's push token after they log in and save it to their driver profile in the database. Set up a listener to handle incoming notifications.
    -   The admin can now send an alert like "Route Updated: A new stop has been added" directly to the driver's phone.
4.  **Building & Deployment (Expo EAS Build):**
    -   When you're ready to test a real build or deploy to the app stores, Expo Application Services (EAS) is a game-changer.
    -   Run `eas build --profile development` (or `preview`/`production`).
    -   Expo's cloud servers will build the native `.ipa` (iOS) and `.apk`/`.aab` (Android) files for you, without you needing a Mac for iOS builds. This simplifies the most complex part of mobile development.

**Outcome:** The driver app is now a polished, professional tool complete with real-time alerts and easy-to-use communication features. The entire build and deployment process is managed through Expo, making it incredibly efficient.