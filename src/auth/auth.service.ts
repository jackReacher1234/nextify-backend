import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signUp(dto: AuthDto) {
    // generate the password hash
    try {
      const passwordHash = await argon2.hash(dto.password);
      // save the new user to the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
        },
      });

      delete user.password;

      return user;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }

      throw e;
    }
  }

  signIn() {
    return 'signin';
  }
}
