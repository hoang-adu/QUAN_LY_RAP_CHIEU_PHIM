import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  employee_id: number;

  @Column({ length: 100, nullable: true })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  position: string;
}
