import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Text from './AppText';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';

const LiquidText = ({ text, percentage, baseColor, fillColor, textStyle }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  // The path repeats every 100 viewBox units. The container renders at 1200px against a
  // 600-unit viewBox (2x scale), so one repeat = 200px on screen. Translating by an exact
  // multiple of that keeps the loop seamless — no jump/reset when it restarts.
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200], // positive value moves it left-to-right
  });

  // Calculate height based on font size or line height. We default to 48 (the giantPercentage size).
  // We multiply by 1.3 to ensure the text container is tall enough so the text isn't vertically clipped.
  const baseHeight = textStyle?.lineHeight || textStyle?.fontSize || 48;
  const height = baseHeight * 1.3;
  const width = '100%';
  
  // Calculate the vertical bounds of the actual text
  const textBottomOffset = (height - baseHeight) / 2;
  
  // Map percentage strictly to the text's bounding box
  const targetWaterLevel = textBottomOffset + (percentage / 100) * baseHeight;
  
  // Make the wave height 40% so the ripple actually reads at small text sizes
  const waveHeight = baseHeight * 0.40;
  const waveAverageOffset = waveHeight / 2;
  
  // Position the wave so its average height hits the target level
  const waveBottom = targetWaterLevel - waveAverageOffset;
  
  // Solid block fills up to the bottom of the wave
  const solidBlockHeight = Math.max(0, waveBottom);

  return (
    <MaskedView
      style={{ height, width, justifyContent: 'center' }}
      maskElement={
        <Text style={[textStyle, { color: '#000000', backgroundColor: 'transparent', textAlign: 'right' }]}>
          {text}
        </Text>
      }
    >
      {/* Background empty text colour */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

      {/* Water Fill Layer */}
      {percentage > 0 && (
        <View style={StyleSheet.absoluteFill}>
          {percentage < 100 && (
            <Animated.View
              style={{
                position: 'absolute',
                left: -800, // Start far left to accommodate the stretched width
                bottom: waveBottom,
                width: 1200, // Stretched horizontally by 2x to make the wave wider and smoother
                height: Math.max(0.1, waveHeight),
                transform: [{ translateX }],
              }}
            >
              <Svg width="100%" height="100%" viewBox="0 0 600 12" preserveAspectRatio="none">
                <Path
                  d="M0,6 Q50,0 100,6 T200,6 T300,6 T400,6 T500,6 T600,6 V12 H0 Z"
                  fill={fillColor}
                />
              </Svg>
            </Animated.View>
          )}

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: solidBlockHeight,
              backgroundColor: fillColor,
            }}
          />
        </View>
      )}
    </MaskedView>
  );
};

export default LiquidText;
