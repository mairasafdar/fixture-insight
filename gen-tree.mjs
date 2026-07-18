import { generator } from '@tanstack/router-generator';
import { resolve } from 'path';
try {
  const config = {
    routesDirectory: resolve('src/routes'),
    generatedRouteTree: resolve('src/routeTree.gen.ts'),
    quoteStyle: 'single',
    semicolons: false,
    disableLogging: false,
  };
  const result = await generator(config);
  console.log('OK');
} catch (e) {
  console.error('FAIL', e);
}
