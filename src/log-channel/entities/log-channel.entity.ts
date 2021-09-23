import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LogChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  guildId: string;

  @Column({ unique: true })
  logChannelId: string;

  @Column({ default: false })
  isLogActive: boolean;
}
