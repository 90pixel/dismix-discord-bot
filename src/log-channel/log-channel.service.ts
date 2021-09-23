import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogChannel } from './entities/log-channel.entity';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

@Injectable()
export class LogChannelService extends TypeOrmCrudService<LogChannel> {
  constructor(@InjectRepository(LogChannel) repo) {
    super(repo);
  }
  async update(guildId, data) {
    const toUpdate = await this.repo.findOne({ guildId: guildId });

    const updated = Object.assign(toUpdate, data);

    return await this.repo.save(updated);
  }

  async create(obj) {
    return await this.repo.save(obj);
  }
}
