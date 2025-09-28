import { Injectable } from '@nestjs/common'
import { Role } from '@prisma/client'
import { PrismaService } from '../infra/prisma/prisma.service'
import { UserEntity } from './entitites/users.entity'
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY')

export interface UsersRepository {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
  create(data: UserEntity): Promise<UserEntity>
}

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({ where: { email } })
    return u ? this.map(u) : null
  }

  async findById(id: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({ where: { id } })
    return u ? this.map(u) : null
  }

  async create(data: UserEntity): Promise<UserEntity> {
    const u = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: (data.role as Role | undefined) ?? Role.VIEWER,
      },
    })
    return this.map(u)
  }

  private map(u: any): UserEntity {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
    }
  }
}
