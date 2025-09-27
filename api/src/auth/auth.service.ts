import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from 'src/users/entitites/users.entity';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) { }

  async validateUser(email: string, password: string) {
    const user: UserEntity | null = await this.users.findByEmailWithSecret(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');


    return { id: user.id!, name: user.name, email: user.email, role: user.role ?? 'USER' };
  }

  async login(user: { id: string; role?: string }) {
    const payload = { sub: user.id, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
