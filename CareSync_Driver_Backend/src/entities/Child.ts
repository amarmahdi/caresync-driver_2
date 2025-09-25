import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum ChildCategory {
  INFANT = 'infant',
  TODDLER = 'toddler',
  PRESCHOOL = 'preschool',
  OOSC = 'out_of_school_care', // Out of School Care
}

@Entity()
export class Child {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  addressStreet!: string;

  @Column()
  addressCity!: string;

  @Column({ nullable: true })
  addressState!: string;

  // As noted, we use simple floats for SQLite.
  // This will be a PostGIS point in a later phase.
  @Column('float', { nullable: true })
  latitude!: number;

  @Column('float', { nullable: true })
  longitude!: number;

  @Column({
    type: 'simple-enum',
    enum: ChildCategory,
  })
  category!: ChildCategory;
}
