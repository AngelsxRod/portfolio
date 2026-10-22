import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Module,
  Param,
} from "@nestjs/common";
import { DatabaseService } from "./database.js";

@Controller()
class StatusController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  @Get("status")
  status() {
    return { ok: true };
  }

  @Get("status/db")
  async databaseStatus() {
    try {
      await this.database.check();
      return { ok: true };
    } catch {
      throw new HttpException({ ok: false }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}

@Controller("message")
class MessageController {
  @Get(":name")
  message(@Param("name") name: string) {
    return { message: `hello ${name}` };
  }
}

@Module({
  controllers: [StatusController, MessageController],
  providers: [DatabaseService],
})
export class AppModule {}
