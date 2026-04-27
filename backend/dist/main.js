"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const publicDir = (0, node_path_1.resolve)(__dirname, '../public');
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.use('/assets', (0, express_1.static)((0, node_path_1.resolve)(publicDir, 'assets')));
    app.use('/uploads', (0, express_1.static)((0, node_path_1.resolve)(publicDir, 'uploads')));
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('育英星宠 API')
        .setDescription('YuYingPets backend API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, swaggerDocument);
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map