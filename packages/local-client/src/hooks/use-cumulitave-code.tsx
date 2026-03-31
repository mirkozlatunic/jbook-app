import { useTypedSelector } from './use-type-selector';
import type { Cell } from '../state';

export const useCumulalitveCode = (cellId: string) => {
  return useTypedSelector((state) => {
    const { data, order } = state.cells ?? {
      data: {} as Record<string, Cell>,
      order: [],
    };
    const orderedCells = order.map((id: string) => data[id]);

    const showFunc = `
      import _React from 'react';
      import { createRoot as _createRoot } from 'react-dom/client';
      var __reactRoot = null;

      var show = (value) => {
        const root = document.querySelector('#root');
        if (typeof value === 'object') {
          if (value.$$typeof && value.props) {
            try {
              if (!__reactRoot) {
                __reactRoot = _createRoot(root);
              }
              __reactRoot.render(value);
            } catch(err) {
              root.innerHTML = '<div style="color:red">' + String(err) + '</div>';
            }
          } else {
            root.innerHTML = JSON.stringify(value);
          }
        } else {
          root.innerHTML = String(value);
        }
      };
    `;

    const showFuncNoop = 'var show = () => {}';

    const cumulativeCode = [];
    for (const c of orderedCells) {
      if (c.type === 'code') {
        if (c.id === cellId) {
          cumulativeCode.push(showFunc);
        } else {
          cumulativeCode.push(showFuncNoop);
        }
        cumulativeCode.push(c.content);
      }
      if (c.id === cellId) {
        break;
      }
    }
    return cumulativeCode;
  }).join('\n');
};
