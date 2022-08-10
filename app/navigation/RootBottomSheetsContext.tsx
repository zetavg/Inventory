import React, { useContext } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const RootBottomSheetsContext = React.createContext<{
  rfidScanSheet: React.RefObject<BottomSheetModal>;
}>({
  rfidScanSheet: { current: null },
});

export function useRootBottomSheets() {
  return useContext(RootBottomSheetsContext);
}

export default RootBottomSheetsContext;
