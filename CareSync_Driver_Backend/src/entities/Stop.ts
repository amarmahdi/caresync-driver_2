import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Route } from './Route';
import { Child } from './Child';

export enum StopType {
  PICKUP = 'pickup',
  DROPOFF = 'dropoff',
}

export enum StopStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity()
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sequence!: number; // The order of this stop in the route (1, 2, 3, etc.)

  @Column({
    type: 'simple-enum',
    enum: StopType,
  })
  type!: StopType;

  @Column({
    type: 'simple-enum',
    enum: StopStatus,
    default: StopStatus.PENDING,
  })
  status!: StopStatus;

  // A stop is associated with one specific child
  @ManyToOne(() => Child, { eager: true }) // eager loads the child data automatically
  child!: Child;

  // A stop belongs to one route
  @ManyToOne(() => Route, (route: Route) => route.stops)
  route!: Route;
}
