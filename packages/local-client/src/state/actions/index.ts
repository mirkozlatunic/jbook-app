import type { Cell, CellTypes } from '../cell';
import { ActionType } from '../action-types';

export type Direction = 'up' | 'down';
export interface MoveCellAction {
  type: typeof ActionType.MOVE_CELL;
  payload: {
    id: string;
    direction: Direction;
  };
}

export interface DeleteCellAction {
  type: typeof ActionType.DELETE_CELL;
  payload: string;
}

export interface InsertCellAfterAction {
  type: typeof ActionType.INSERT_CELL_AFTER;
  payload: {
    id: string | null;
    type: CellTypes;
  };
}

export interface UpdateCellAction {
  type: typeof ActionType.UPDATE_CELL;
  payload: {
    id: string;
    content: string;
  };
}

export interface BundleStartAction {
  type: typeof ActionType.BUNDLER_START;
  payload: {
    cellId: string;
  };
}

export interface BundleCompleteAction {
  type: typeof ActionType.BUNDLER_COMPLETE;
  payload: {
    cellId: string;
    bundle: {
      code: string;
      err: string;
    };
  };
}

export interface FetchCellsAction {
  type: typeof ActionType.FETCH_CELLS;
}

export interface FetchCellsCompleteAction {
  type: typeof ActionType.FETCH_CELLS_COMPLETE;
  payload: Cell[];
}

export interface FetchCellsErrorAction {
  type: typeof ActionType.FETCH_CELLS_ERROR;
  payload: string;
}

export interface SaveCellsErrorAction {
  type: typeof ActionType.SAVE_CELLS_ERROR;
  payload: string;
}

export type Action =
  | MoveCellAction
  | DeleteCellAction
  | InsertCellAfterAction
  | UpdateCellAction
  | BundleStartAction
  | BundleCompleteAction
  | FetchCellsAction
  | FetchCellsCompleteAction
  | FetchCellsErrorAction
  | SaveCellsErrorAction;
