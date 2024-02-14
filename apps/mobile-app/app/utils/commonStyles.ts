import { Platform, StyleSheet } from 'react-native';

/**
 * Common, utility styles,
 */
const commonStyles = StyleSheet.create({
  flex0: {
    flex: 0,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  flex3: {
    flex: 3,
  },
  flex4: {
    flex: 4,
  },
  flex5: {
    flex: 5,
  },
  flex6: {
    flex: 6,
  },
  flex7: {
    flex: 7,
  },
  flex8: {
    flex: 8,
  },
  flexGrow1: {
    flexGrow: 1,
  },
  w2: {
    width: 2,
  },
  w4: {
    width: 4,
  },
  w8: {
    width: 8,
  },
  w12: {
    width: 12,
  },
  w16: {
    width: 16,
  },
  mh0: {
    minHeight: 0,
  },
  mv2: {
    marginVertical: 2,
  },
  mv4: {
    marginVertical: 4,
  },
  mv8: {
    marginVertical: 8,
  },
  mv12: {
    marginVertical: 12,
  },
  mv16: {
    marginVertical: 16,
  },
  mv20: {
    marginVertical: 20,
  },
  mv40: {
    marginVertical: 40,
  },
  mv60: {
    marginVertical: 60,
  },
  mv80: {
    marginVertical: 80,
  },
  mh2: {
    marginHorizontal: 2,
  },
  mh4: {
    marginHorizontal: 4,
  },
  mh8: {
    marginHorizontal: 8,
  },
  mh16: {
    marginHorizontal: 16,
  },
  mh20: {
    marginHorizontal: 20,
  },
  ml1: {
    marginLeft: 1,
  },
  ml2: {
    marginLeft: 2,
  },
  ml4: {
    marginLeft: 4,
  },
  ml8: {
    marginLeft: 8,
  },
  ml12: {
    marginLeft: 12,
  },
  ml16: {
    marginLeft: 16,
  },
  ml20: {
    marginLeft: 20,
  },
  ml24: {
    marginLeft: 24,
  },
  ml28: {
    marginLeft: 28,
  },
  ml32: {
    marginLeft: 32,
  },

  mr1: {
    marginRight: 1,
  },
  mr2: {
    marginRight: 2,
  },
  mr4: {
    marginRight: 4,
  },
  mr8: {
    marginRight: 8,
  },
  mr12: {
    marginRight: 12,
  },
  mr16: {
    marginRight: 16,
  },
  mr20: {
    marginRight: 20,
  },
  mr24: {
    marginRight: 24,
  },
  mr28: {
    marginRight: 28,
  },
  mr32: {
    marginRight: 32,
  },
  mrm1: {
    marginRight: -1,
  },
  mrm2: {
    marginRight: -2,
  },
  mrm4: {
    marginRight: -4,
  },
  mrm8: {
    marginRight: -8,
  },
  mt0: {
    marginTop: 0,
  },
  mt1: {
    marginTop: 1,
  },
  mt2: {
    marginTop: 2,
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  mt20: {
    marginTop: 20,
  },
  mt24: {
    marginTop: 24,
  },
  mt28: {
    marginTop: 28,
  },
  mt32: {
    marginTop: 32,
  },
  mt36: {
    marginTop: 36,
  },
  mt64: {
    marginTop: 64,
  },
  mt128: {
    marginTop: 128,
  },
  mb0: {
    marginBottom: 0,
  },
  mb2: {
    marginBottom: 2,
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
  mb20: {
    marginBottom: 20,
  },
  mb24: {
    marginBottom: 24,
  },
  mb28: {
    marginBottom: 28,
  },
  mb32: {
    marginBottom: 32,
  },
  mbm2: {
    marginBottom: -2,
  },
  mbm3: {
    marginBottom: -3,
  },
  mbm4: {
    marginBottom: -4,
  },
  mbm5: {
    marginBottom: -5,
  },
  p4: {
    padding: 4,
  },
  p8: {
    padding: 8,
  },
  p12: {
    padding: 12,
  },
  p16: {
    padding: 16,
  },
  pt16: {
    paddingTop: 16,
  },
  ph8: {
    paddingHorizontal: 8,
  },
  ph16: {
    paddingHorizontal: 16,
  },
  pv24: {
    paddingVertical: 24,
  },
  pv36: {
    paddingVertical: 36,
  },
  pv40: {
    paddingVertical: 40,
  },
  br8: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  opacity08: {
    opacity: 0.8,
  },
  opacity05: {
    opacity: 0.5,
  },
  opacity04: {
    opacity: 0.4,
  },
  opacity02: {
    opacity: 0.2,
  },
  centerChildren: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  justifyContentFlexEnd: {
    justifyContent: 'flex-end',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  alignItemsFlexStart: {
    alignItems: 'flex-start',
  },
  alignSelfStretch: { alignSelf: 'stretch' },
  touchableSFSymbolContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fs20: {
    fontSize: 20,
  },
  fs18: {
    fontSize: 18,
  },
  fs16: {
    fontSize: 16,
  },
  fs14: {
    fontSize: 14,
  },
  fs12: {
    fontSize: 12,
  },
  fs10: {
    fontSize: 10,
  },
  fs8: {
    fontSize: 8,
  },
  fs4: {
    fontSize: 4,
  },
  tac: {
    textAlign: 'center',
  },
  tar: {
    textAlign: 'right',
  },
  fwBold: {
    fontWeight: 'bold',
  },
  monospaced: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.9,
  },
  fontMonospaced: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  devToolsMonospaced: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  devToolsMonospacedDetails: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
});

export default commonStyles;
