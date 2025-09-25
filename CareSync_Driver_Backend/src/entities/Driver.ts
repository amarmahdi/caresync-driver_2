import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export enum DriverCapability {
  INFANT_CERTIFIED = 'infant_certified',
  TODDLER_TRAINED = 'toddler_trained',
  SPECIAL_NEEDS = 'special_needs',
}

@Entity()
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'simple-array', // Stores as a comma-separated string
    nullable: true,
  })
  capabilities!: DriverCapability[];
  
  // A TypeORM hook to hash the password before it's saved to the database.
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
}
