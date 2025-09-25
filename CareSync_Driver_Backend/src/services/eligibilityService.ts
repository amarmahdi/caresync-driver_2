import { Child, ChildCategory } from '../entities/Child';
import { Driver, DriverCapability } from '../entities/Driver';
import { Vehicle, VehicleEquipment } from '../entities/Vehicle';

// This interface defines a valid transport option for a child
export interface TransportOption {
  driver: Driver;
  vehicle: Vehicle;
}

// This is the main output: mapping each child to their valid options
export type EligibilityMap = Map<Child, TransportOption[]>;

// The main function for the service
export function filterEligibleTransports(
  children: Child[],
  drivers: Driver[],
  vehicles: Vehicle[]
): EligibilityMap {
  const eligibilityMap: EligibilityMap = new Map();

  // Pair up every available driver with a vehicle
  // In a real app, this pairing might be predefined (driver is assigned a vehicle)
  // For now, we assume any driver can use any vehicle
  const allPossiblePairs: TransportOption[] = [];
  for (const driver of drivers) {
    for (const vehicle of vehicles) {
      allPossiblePairs.push({ driver, vehicle });
    }
  }

  for (const child of children) {
    const requiredCapabilities: DriverCapability[] = [];
    const requiredEquipment: VehicleEquipment[] = [];

    // Rule 1: Determine needs based on child's category
    switch (child.category) {
      case ChildCategory.INFANT:
        requiredCapabilities.push(DriverCapability.INFANT_CERTIFIED);
        requiredEquipment.push(VehicleEquipment.INFANT_SEAT);
        break;
      case ChildCategory.TODDLER:
        requiredCapabilities.push(DriverCapability.TODDLER_TRAINED);
        requiredEquipment.push(VehicleEquipment.TODDLER_SEAT);
        break;
      // Preschool and OOSC children have no special requirements by default
      case ChildCategory.PRESCHOOL:
      case ChildCategory.OOSC:
        // No special requirements for these categories
        break;
    }

    // Filter the pairs to find who is eligible for THIS child
    const eligiblePairs = allPossiblePairs.filter(pair => {
      // Check if the driver has ALL required capabilities
      const hasAllCapabilities = requiredCapabilities.every(cap =>
        pair.driver.capabilities?.includes(cap)
      );

      // Check if the vehicle has ALL required equipment
      const hasAllEquipment = requiredEquipment.every(equip =>
        pair.vehicle.equipment?.includes(equip)
      );

      return hasAllCapabilities && hasAllEquipment;
    });
    
    eligibilityMap.set(child, eligiblePairs);
  }

  return eligibilityMap;
}
