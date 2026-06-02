import React from "react";
import { View, Image } from "react-native";

const StreakShadow = ({ width, height }) => {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={require("../../assets/streak/streak_bottom_blur.png")}
        style={{ width: width, height: height, resizeMode: "contain" }}
      />
    </View>
  );
};

export default StreakShadow;
