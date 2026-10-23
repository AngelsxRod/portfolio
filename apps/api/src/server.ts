import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Module,
  Param,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseService } from "./database.js";
import {
  AdminController,
  AdminGuard,
  AuthController,
  Public,
} from "./auth/auth.js";
import { AdminSessionService } from "./auth/session.js";
import { DraftsController, DraftsService } from "./projects/drafts.js";
import {
  AdminMediaController,
  FeaturedMediaController,
  MediaService,
  PublicMediaController,
} from "./projects/media.js";
import {
  PublicationController,
  PublicationService,
  PublicProjectsController,
} from "./projects/publication.js";
import {
  AdminSkillsController,
  PublicSkillsController,
  SkillsService,
} from "./skills/skills.js";

@Controller()
class StatusController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  @Get("status")
  @Public()
  status() {
    return { ok: true };
  }

  @Get("status/db")
  @Public()
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
  @Public()
  message(@Param("name") name: string) {
    return { message: `hello ${name}` };
  }
}

@Module({
  controllers: [
    StatusController,
    MessageController,
    AuthController,
    AdminController,
    DraftsController,
    AdminMediaController,
    FeaturedMediaController,
    PublicMediaController,
    PublicationController,
    PublicProjectsController,
    AdminSkillsController,
    PublicSkillsController,
  ],
  providers: [
    DatabaseService,
    AdminSessionService,
    DraftsService,
    MediaService,
    PublicationService,
    SkillsService,
    { provide: APP_GUARD, useClass: AdminGuard },
  ],
})
export class AppModule {}
