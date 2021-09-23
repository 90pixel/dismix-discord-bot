import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LogChannelModule } from './log-channel/log-channel.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.${ENV}.env`,
    }),
    BotModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: process.env.NODE_ENV !== 'prod',
      keepConnectionAlive: true,
      autoLoadEntities: true,
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
      migrations: ['src/migration/*{.ts}'],
      cli: {},
    }),
    LogChannelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
