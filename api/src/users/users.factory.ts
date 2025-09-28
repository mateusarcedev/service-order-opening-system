import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PublicUser, UserEntity } from './entitites/users.entity';


type CreateUserProps = {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role
};

@Injectable()
export class UsersFactory {
  create(props: CreateUserProps): UserEntity {
    const name = props.name?.trim();
    const email = props.email?.toLowerCase().trim();
    if (!name || !email) throw new BadRequestException('Invalid user data');
    return { name, email, passwordHash: props.passwordHash, role: props.role };
  }

  toPublic(u: UserEntity): PublicUser {
    return { id: u.id as string, name: u.name, email: u.email, role: u.role };
  }
}
