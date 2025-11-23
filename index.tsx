// MUST be first - polyfills for Node.js modules
import './polyfills';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
