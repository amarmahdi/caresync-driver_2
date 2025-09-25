import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Stop } from './Stop';
import { Driver } from './Driver';
import { Vehicle } from './Vehicle';

export enum RouteStatus {
  PLANNING = 'planning',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity()
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // e.g., "North Zone Toddlers AM"

  @Column({
    type: 'simple-enum',
    enum: RouteStatus,
    default: RouteStatus.PLANNING,
  })
  status!: RouteStatus;

  @Column('date')
  date!: string; // The date for which this route is planned

  // A route has many stops, and we want them to cascade on delete
  @OneToMany(() => Stop, (stop) => stop.route, { cascade: true })
  stops!: Stop[];

  // A route can be assigned to one driver (optional at first)
  @ManyToOne(() => Driver, { nullable: true })
  driver?: Driver;

  // A route uses one vehicle (optional at first)
  @ManyToOne(() => Vehicle, { nullable: true })
  vehicle?: Vehicle;
}
