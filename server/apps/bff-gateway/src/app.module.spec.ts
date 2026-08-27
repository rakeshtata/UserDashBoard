import 'reflect-metadata';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UserGatewayModule } from './user.module';

describe('AppModule', () => {
  it('should register the gateway module for GraphQL-to-REST routing', () => {
    const imports = Reflect.getMetadata('imports', AppModule) || [];
    expect(imports).toContain(UserGatewayModule);
  });

  it('should register the auth module so /auth routes are available', () => {
    const imports = Reflect.getMetadata('imports', AppModule) || [];
    expect(imports).toContain(AuthModule);
  });
});
