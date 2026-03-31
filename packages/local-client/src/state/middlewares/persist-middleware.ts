import type { Middleware } from 'redux';
import { ActionType } from '../action-types';
import { saveCells } from '../action-creators';
import type { RootState } from '../reducers';

export const persistMiddleware: Middleware<{}, RootState> =
  ({ dispatch, getState }) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return (next) => {
      return (action) => {
        next(action);

        const actionType = (action as { type: string }).type;
        if (
          (
            [
              ActionType.MOVE_CELL,
              ActionType.UPDATE_CELL,
              ActionType.INSERT_CELL_AFTER,
              ActionType.DELETE_CELL,
            ] as string[]
          ).includes(actionType)
        ) {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            saveCells()(dispatch as any, getState);
          }, 250);
        }
      };
    };
  };
