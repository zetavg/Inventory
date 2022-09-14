import useIsDarkMode from './useIsDarkMode';

function useColors() {
  const isDarkMode = useIsDarkMode();
  const backgroundColor = isDarkMode ? '#000000' : '#F2F2F6';
  const groupTitleColor = isDarkMode ? '#8D8D93' : '#85858B';
  const contentBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const sheetBackgroundColor = isDarkMode ? '#1C1C1E' : '#F2F2F6';
  const contentTextColor = isDarkMode ? '#FFFFFF' : '#000000';
  const textOnDarkBackgroundColor = '#fff';
  const contentSecondaryTextColor = isDarkMode ? '#98989F' : '#8A8A8E';
  const contentDisabledTextColor = isDarkMode ? '#8F8F8F' : '#8F8F8F';
  const iosHeaderTintColor = isDarkMode ? '#3A82F7' : '#3478F6';
  const iosTintColor = isDarkMode ? '#3A82F7' : '#3478F6';
  const iosDestructiveColor = isDarkMode ? '#EB5545' : '#EB4D3D';
  const insetGroupSeperatorColor = isDarkMode ? '#3E3E40' : '#C7C7C9';

  const white = '#fff';

  const red = isDarkMode ? '#FF453A' : '#FF3B30';
  const orange = isDarkMode ? '#FF9F0A' : '#FF9500';
  const yellow = isDarkMode ? '#FFD60A' : '#FFCC00';
  const green = isDarkMode ? '#32D74B' : '#34C759';
  const teal = isDarkMode ? '#64D2FF' : '#5AC8FA';
  const blue = isDarkMode ? '#0A84FF' : '#007AFF';
  const indigo = isDarkMode ? '#5E5CE6' : '#5856D6';
  const purple = isDarkMode ? '#BF5AF2' : '#AF52DE';
  const pink = isDarkMode ? '#FF2D55' : '#FF2D55';

  const gray = isDarkMode ? '#8E8E93' : '#8E8E93';

  const iconBlue = isDarkMode ? '#3A82F7' : '#3478F6';
  const iconBrown = isDarkMode ? '#A78F6D' : '#9D8563';
  const iconGray = isDarkMode ? '#8E8E92' : '#8E8E92';
  const iconGreen = isDarkMode ? '#67CE67' : '#65C466';
  const iconIndigo = isDarkMode ? '#5D5CDE' : '#5756CE';
  const iconYellow = isDarkMode ? '#F1A33B' : '#F09A37';
  const iconRed = isDarkMode ? '#EB4B62' : '#EA4459';
  const iconPurple = isDarkMode ? '#B25FEA' : '#A357D7';
  const iconOrange = isDarkMode ? '#EB5545' : '#EB4D3D';
  const iconTeal = isDarkMode ? '#6AC5DD' : '#59ADC4';

  const red2 = isDarkMode ? '#FF6A61' : '#FF6259';
  const orange2 = isDarkMode ? '#FF6A61' : '#FFAA33';
  const yellow2 = isDarkMode ? '#FFDE3B' : '#FFD633';
  const green2 = isDarkMode ? '#5BDF6F' : '#53D767';
  const blue2 = isDarkMode ? '#3B9DFF' : '#3395FF';
  const purple2 = isDarkMode ? '#CB7BF5' : '#BF75E5';
  const grey2 = isDarkMode ? '#ADADB1' : '#A5A5A9';

  const redTag = isDarkMode ? '#FF736A' : '#F75B52';
  const orangeTag = isDarkMode ? '#FFBA44' : '#F7A234';
  const yellowTag = isDarkMode ? '#FFE643' : '#F7CE33';
  const greenTag = isDarkMode ? '#66FF78' : '#4ECF60';
  const blueTag = isDarkMode ? '#44A4FF' : '#348CF7';
  const purpleTag = isDarkMode ? '#D683FF' : '#B270D3';
  const greyTag = isDarkMode ? '#B4B4B8' : '#9C9CA0';

  const redTagBorder = isDarkMode ? '#FF5045' : '#F53227';
  const orangeTagBorder = isDarkMode ? '#FFA914' : '#F58B01';
  const yellowTagBorder = isDarkMode ? '#FFE013' : '#F5C201';
  const greenTagBorder = isDarkMode ? '#40FF56' : '#23C338';
  const blueTagBorder = isDarkMode ? '#148EFF' : '#0171F5';
  const purpleTagBorder = isDarkMode ? '#CB66FF' : '#9F4CC9';
  const greyTagBorder = isDarkMode ? '#A2A2A7' : '#848489';

  return {
    backgroundColor,
    groupTitleColor,
    contentBackgroundColor,
    sheetBackgroundColor,
    contentTextColor,
    contentSecondaryTextColor,
    contentDisabledTextColor,
    textOnDarkBackgroundColor,
    iosHeaderTintColor,
    iosTintColor,
    iosDestructiveColor,
    insetGroupSeperatorColor,
    white,
    red,
    orange,
    yellow,
    green,
    teal,
    blue,
    indigo,
    purple,
    pink,
    gray,
    iconBlue,
    iconBrown,
    iconGray,
    iconGreen,
    iconIndigo,
    iconYellow,
    iconRed,
    iconPurple,
    iconOrange,
    iconTeal,
    red2,
    orange2,
    yellow2,
    green2,
    blue2,
    purple2,
    grey2,
    redTag,
    orangeTag,
    yellowTag,
    greenTag,
    blueTag,
    purpleTag,
    greyTag,
    redTagBorder,
    orangeTagBorder,
    yellowTagBorder,
    greenTagBorder,
    blueTagBorder,
    purpleTagBorder,
    greyTagBorder,
  };
}

export default useColors;

// Android backgroundColor?
// Color(colors.background)
//   .desaturate(0.5)
//   .darken(0.02)
//   .hex();
