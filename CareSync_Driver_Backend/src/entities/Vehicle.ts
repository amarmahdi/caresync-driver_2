import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum VehicleEquipment {
  INFANT_SEAT = 'infant_seat',
  TODDLER_SEAT = 'toddler_seat',
  BOOSTER_SEAT = 'booster_seat',
  WHEELCHAIR_LIFT = 'wheelchair_lift',
}

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // e.g., "Van 1", "Bus A"

  @Column()
  capacity!: number;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  equipment!: VehicleEquipment[];
}
