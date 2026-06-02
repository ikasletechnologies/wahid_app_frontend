import React from "react";
import { View, Image } from "react-native";

const StreakRound = ({ width, height }) => {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={require("../../assets/streak/streak_circle.png")}
        style={{ width: width - 20, height: height - 20, resizeMode: "contain" }}
      />
    </View>
  );
};

export default StreakRound;
