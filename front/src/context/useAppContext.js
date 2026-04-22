import { useContext } from 'react';
import { AppContext } from './AppContextObject';

export function useAppContext() {
  return useContext(AppContext);
}
