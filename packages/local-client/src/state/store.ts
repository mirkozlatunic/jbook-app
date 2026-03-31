import { configureStore } from '@reduxjs/toolkit';
import reducers from './reducers';
import { persistMiddleware } from './middlewares/persist-middleware';

export const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});
