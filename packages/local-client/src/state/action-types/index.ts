export const ActionType = {
  MOVE_CELL: 'move_cell',
  DELETE_CELL: 'delete_cell',
  INSERT_CELL_AFTER: 'insert_cell_after',
  UPDATE_CELL: 'update_cell',
  BUNDLER_START: 'bundler_start',
  BUNDLER_COMPLETE: 'bundler_complete',
  FETCH_CELLS: 'fetch_cells',
  FETCH_CELLS_COMPLETE: 'fetch_cells_complete',
  FETCH_CELLS_ERROR: 'fetch_cells_error',
  SAVE_CELLS_ERROR: 'save_cells_error'
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];
