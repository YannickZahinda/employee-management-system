import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration, validationSchema } from "./configuration";


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema,
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
        }),
    ],
    exports: [ConfigModule],
})

export class CustomConfigModule {}

