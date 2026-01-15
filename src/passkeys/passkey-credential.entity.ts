import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { AuthenticatorTransportFuture } from '@simplewebauthn/server';

@Entity('passkey_credentials')
export class PasskeyCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Index({ unique: true })
  @Column({ type: 'bytea' })
  credentialId: Uint8Array<ArrayBuffer>;

  @Column({ type: 'bytea' })
  publicKey: Uint8Array<ArrayBuffer>;

  @Column({ type: 'bigint' })
  counter: number;

  @Column({ type: 'text', array: true, nullable: true })
  transports?: AuthenticatorTransportFuture[];

  @Column({ type: 'text', nullable: true })
  deviceName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;
}
