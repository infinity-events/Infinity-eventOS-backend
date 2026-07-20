import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {

  const app = await NestFactory.create(AppModule);


  app.useGlobalPipes(
    new ValidationPipe()
  );


  const config = new DocumentBuilder()
    .setTitle('Infinity EventOS API')
    .setDescription('Festival management platform API')
    .setVersion('0.1')
    .build();


  const document = SwaggerModule.createDocument(
    app,
    config
  );


  SwaggerModule.setup(
    'api',
    app,
    document
  );

   app.enableCors({
    origin: true,
  });


  await app.listen(3000, '0.0.0.0');

}


bootstrap();