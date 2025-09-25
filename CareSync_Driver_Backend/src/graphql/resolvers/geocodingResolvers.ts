import fetch from 'node-fetch';
import { GraphQLError } from 'graphql';

export const geocodingResolvers = {
  Query: {
    geocodeAddress: async (_: any, { address }: { address: string }, context: any) => {
      // Check if user is authenticated
      if (!context.admin) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn('No Google Maps API key found, using demo coordinates');
          // Return demo coordinates for development
          return {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area with slight randomization
            longitude: -74.006 + (Math.random() - 0.5) * 0.1
          };
        }

        // Use Google Maps Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`Google Maps API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
          throw new GraphQLError('Address not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };

      } catch (error) {
        console.error('Geocoding error:', error);
        throw new GraphQLError('Failed to geocode address');
      }
    },
  },
};
