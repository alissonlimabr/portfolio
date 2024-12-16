import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import Clarity from '@microsoft/clarity';

//id do projeto do Microsoft Clarity
Clarity.init('pexxkhasj2');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
