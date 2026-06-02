import React from "react";
import { View, Image } from "react-native";

const StreakIcon = ({ width, height }) => {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={require("../../assets/streak/big_streak.png")}
        style={{ width, height, resizeMode: "contain" }}
      />
    </View>
  );
};

export default StreakIcon;
