import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './users.schema'
import { Model } from 'mongoose'
import { GetUserDto } from './dtos/get-user.dto'
import { USER_NOT_FOUND } from './users.constants'
import { CreateUserDto } from './dtos/create-user.dto'

@Injectable()
export class UsersService {
	constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

	async getOne({ id, email, options }: GetUserDto) {
		if (id) {
			const user = await this.userModel.findById(id)

			if (user && !options?.returnPassword) {
				delete user.hashedPassword
			}

			return user
		}

		if (email) {
			const user = await this.userModel.findOne({ email })

			if (user && !options?.returnPassword) {
				delete user.hashedPassword
			}

			return user
		}
	}

	async getOneOrThrow(dto: GetUserDto) {
		const user = await this.getOne(dto)

		if (!user) {
			throw new NotFoundException(USER_NOT_FOUND)
		}

		return user
	}

	async createOne({ email, hashedPassword }: CreateUserDto) {
		const user = await this.getOne({ email })

		if (user) {
			throw new ConflictException('User with this email already exists')
		}

		const createdUser = await this.userModel.create({
			email,
			hashedPassword
		})

		const savedUser = await createdUser.save()

		return savedUser._id
	}

	async updateOne(id: string, dto: any) {
		const user = await this.getOneOrThrow({ id })

		try {
			await this.userModel.updateOne({ _id: id }, { $set: dto })

			return user._id
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}

	async deleteOne(id: string) {
		const user = await this.getOneOrThrow({ id })

		try {
			await this.userModel.deleteOne({ _id: id })

			return user._id
		} catch (error) {
			throw new InternalServerErrorException(error)
		}
	}
}
