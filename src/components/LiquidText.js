import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';

const LiquidText = ({ text, percentage, baseColor, fillColor, textStyle }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  // The wave SVG has a cycle of 200px. We translate exactly 200px to make it seamless.
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  // Calculate height based on font size or line height. We default to 48 (the giantPercentage size).
  const height = textStyle?.lineHeight || textStyle?.fontSize || 48;
  const width = '100%';
  
  // If completed, fill it completely. If 0, don't show water.
  const fillHeight = (percentage / 100) * height;

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
                left: 0,
                bottom: fillHeight - 1, // Subtracted 1 to avoid subpixel gaps between wave and solid block
                width: 600, // 3 wave cycles
                height: 12,
                transform: [{ translateX }],
              }}
            >
              <Svg width="600" height="12" viewBox="0 0 600 12">
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
              height: fillHeight,
              backgroundColor: fillColor,
            }}
          />
        </View>
      )}
    </MaskedView>
  );
};

export default LiquidText;
