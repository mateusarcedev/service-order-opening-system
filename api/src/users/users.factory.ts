// src/users/users.factory.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PublicUser, UserEntity } from './entitites/users.entity';


type CreateUserProps = {
  name: string;
  email: string;
  passwordHash: string;
  role?: string | null;
};

@Injectable()
export class UsersFactory {
  create(props: CreateUserProps): UserEntity {
    const name = props.name?.trim();
    const email = props.email?.toLowerCase().trim();
    if (!name || !email) throw new BadRequestException('Invalid user data');
    return { name, email, passwordHash: props.passwordHash, role: props.role ?? 'USER' };
  }

  toPublic(u: UserEntity): PublicUser {
    return { id: u.id as string, name: u.name, email: u.email, role: u.role ?? 'USER' };
  }
}
