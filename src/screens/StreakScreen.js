import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import StreakRound from "../components/StreakRound";
import StreakIcon from "../components/StreakIcon";
import StreakShadow from "../components/StreakShadow";

import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";

export default function StreakScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Streak</Text>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* HERO SECTION */}
        <View style={styles.heroRow}>

          {/* LEFT */}
          <View style={styles.leftSection}>
            <View style={styles.flameContainer}>

              <StreakRound width={160} height={160} />

              <View style={styles.iconOverlay}>
                <StreakIcon width={90} height={90} />
              </View>

              <View style={styles.shadowOverlay}>
                <StreakShadow width={100} height={30} />
              </View>

            </View>
          </View>

          {/* RIGHT */}
          <View style={styles.rightSection}>

            {/* 10 */}
            <Svg width={90} height={72}>
              <Defs>
                <SvgGradient id="numGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#3EDCF0" />
                </SvgGradient>
              </Defs>

              <SvgText
                fill="url(#numGrad)"
                fontSize="64"
                fontWeight="bold"
                x="0"
                y="66"
              >
                10
              </SvgText>
            </Svg>

            {/* DAYS TEXT */}
            <Svg width={120} height={20}>
              <Defs>
                <SvgGradient id="daysGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#3EDCF0" />
                </SvgGradient>
              </Defs>

              <SvgText
                fill="url(#daysGrad)"
                fontSize="14"
                fontWeight="500"
                x="0"
                y="15"
              >
                days streak !
              </SvgText>
            </Svg>

            <View style={styles.textShadowContainer}>
              <Image source={require('../../assets/streak/text_bottom_blur.png')} style={styles.blurImage} />
            </View>

          </View>
        </View>

        {/* REFLECTION */}
        <View style={styles.reflectionWrapper}>

          <View
            style={[
              styles.heroRow,
              {
                transform: [{ scaleY: -1 }],
                opacity: 0.28,
              },
            ]}
          >

            {/* LEFT REFLECTION */}
            <View style={styles.leftSection}>
              <View style={styles.flameContainer}>

                <StreakRound width={160} height={160} />

                <View style={styles.iconOverlay}>
                  <StreakIcon width={90} height={90} />
                </View>

                <View style={styles.shadowOverlay}>
                  <StreakShadow width={100} height={30} />
                </View>

              </View>
            </View>

            {/* RIGHT REFLECTION */}
            <View style={styles.rightSection}>

              <Svg width={90} height={72}>
                <Defs>
                  <SvgGradient id="numGradRef" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF" />
                    <Stop offset="1" stopColor="#3EDCF0" />
                  </SvgGradient>
                </Defs>

                <SvgText
                  fill="url(#numGradRef)"
                  fontSize="64"
                  fontWeight="bold"
                  x="0"
                  y="66"
                >
                  10
                </SvgText>
              </Svg>

              <Svg width={120} height={20}>
                <Defs>
                  <SvgGradient id="daysGradRef" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FFFFFF" />
                    <Stop offset="1" stopColor="#3EDCF0" />
                  </SvgGradient>
                </Defs>

                <SvgText
                  fill="url(#daysGradRef)"
                  fontSize="14"
                  fontWeight="500"
                  x="0"
                  y="15"
                >
                  days streak !
                </SvgText>
              </Svg>

              <View style={styles.textShadowContainer}>
                <Image source={require('../../assets/streak/text_bottom_blur.png')} style={styles.blurImage} />
              </View>

            </View>
          </View>

          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "#000"]}
            style={styles.reflectionMask}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* CALENDAR TITLE */}
        <Text style={styles.sectionTitle}>Streak Calendar</Text>

        {/* CALENDAR */}
        <View style={styles.calendarContainer}>

          {/* HEADER */}
          <View style={styles.calendarHeader}>
            <Text style={styles.yearLeft}>May</Text>
            <Text style={styles.yearRight}>2026</Text>
          </View>

          {/* WEEK DAYS */}
          <View style={styles.weekDaysRow}>
            <Text style={styles.dayText}>Sun</Text>
            <Text style={styles.dayText}>Mon</Text>
            <Text style={styles.dayText}>Tue</Text>

            <Text style={styles.activeDayText}>Wed</Text>

            <Text style={styles.dayText}>Thu</Text>
            <Text style={styles.dayText}>Fri</Text>
            <Text style={styles.dayText}>Sat</Text>
          </View>

          {/* WEEK 1 */}
          <LinearGradient colors={["#FFFFFF", "#3EDCF0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.weekContainer}>
            <View style={styles.emptyDate} />
            <View style={styles.emptyDate} />
            <View style={styles.emptyDate} />
            <View style={styles.emptyDate} />
            <View style={styles.emptyDate} />

            <View style={styles.activeDateRect}>
              <Text style={styles.activeDateText}>1</Text>
            </View>

            <View style={styles.activeDateRect}>
              <Text style={styles.activeDateText}>2</Text>
            </View>
          </LinearGradient>

          {/* WEEK 2 */}
          <View style={styles.weekContainer}>
            {[3, 4, 5, 6, 7].map((d) => (
              <View key={d} style={styles.activeDate}>
                <Text style={styles.activeDateText}>{d}</Text>
              </View>
            ))}

            {[8, 9].map((d) => (
              <View key={d} style={styles.normalDate}>
                <Text style={styles.normalDateText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* WEEK 3 */}
          <View style={styles.weekContainer}>
            {[10, 11, 12, 13, 14, 15, 16].map((d) => (
              <View key={d} style={styles.normalDate}>
                <Text style={styles.normalDateText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* WEEK 4 */}
          <View style={styles.weekContainer}>
            {[17, 18, 19, 20, 21, 22, 23].map((d) => (
              <View key={d} style={styles.normalDate}>
                <Text style={styles.normalDateText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* WEEK 5 */}
          <View style={styles.weekContainer}>
            {[24, 25, 26, 27, 28, 29, 30].map((d) => (
              <View key={d} style={styles.normalDate}>
                <Text style={styles.normalDateText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* WEEK 6 */}
          <View style={styles.weekContainer}>
            <View style={styles.normalDate}>
              <Text style={styles.normalDateText}>31</Text>
            </View>
          </View>
        </View>
        {/* WEEK DAYS CONTAINER */}
        <View style={styles.weekDaysContainer}>
          {/* Day Names Row */}
          <View style={styles.daysTextRow}>
            {[
              { label: "Sun", active: false },
              { label: "Mon", active: false },
              { label: "Tue", active: false },
              { label: "Wed", active: true },
              { label: "Thu", active: false },
              { label: "Fri", active: false },
              { label: "Sat", active: false },
            ].map((item, index) => (
              <View key={index} style={styles.dayTextWrapper}>
                <Text
                  style={[
                    styles.dayRectText,
                    item.active && styles.dayRectTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Progress Track Row */}
          <View style={styles.trackContainer}>
            {/* Background Grey Track */}
            <View style={styles.bgTrack} />

            {/* Active Gradient Track (Sun to Wed) */}
            <LinearGradient
              colors={["#E0F7FA", "#3EDCF0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTrack}
            />

            {/* Icons Row */}
            <View style={styles.iconsRow}>
              {[
                { status: "completed" }, // Sun
                { status: "completed" }, // Mon
                { status: "completed" }, // Tue
                { status: "active" },    // Wed
                { status: "future" },    // Thu
                { status: "future" },    // Fri
                { status: "future" },    // Sat
              ].map((item, index) => (
                <View key={index} style={styles.iconWrapper}>
                  {item.status === "completed" && (
                    <LinearGradient
                      colors={["#FFFFFF", "#3EDCF0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.completedCircleGradient}
                    >
                      <Ionicons name="checkmark" size={14} color="#00838F" style={{ fontWeight: "900" }} />
                    </LinearGradient>
                  )}
                  {item.status === "active" && (
                    <View style={styles.activeOuterCircle}>
                      <LinearGradient
                        colors={["#00E5FF", "#00838F"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeInnerGradient}
                      >
                        <Ionicons name="checkmark" size={14} color="#FFF" style={{ fontWeight: "900" }} />
                      </LinearGradient>
                    </View>
                  )}
                  {item.status === "future" && (
                    <View style={styles.futureCircle}>
                      <Ionicons name="checkmark" size={14} color="rgba(62, 220, 240, 0.25)" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#000",
  },

  backButton: {
    padding: 4,
    marginRight: 8,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFF",
  },

  body: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20,
  },

  bodyContent: {
    alignItems: "center",
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  leftSection: {
    alignItems: "center",
    justifyContent: "center",
  },

  flameContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  iconOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  shadowOverlay: {
    position: "absolute",
    bottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  rightSection: {
    marginLeft: 18,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 20,
  },

    textShadowContainer: {
      marginTop: -5,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      zIndex: 1,
    },

    blurImage: {
        width: 80,
        height: 25,
        right: 25,
    },

    reflectionWrapper: {
        height: 100,
        overflow: "hidden",
        marginTop: -40,
        width: "100%",
        alignItems: "center",
    },


  reflectionMask: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  sectionTitle: {
    alignSelf: "flex-start",
    marginLeft: 24,
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 5,
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  calendarContainer: {
    width: "92%",
    backgroundColor: "#3C3C3C",
    borderRadius: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: "#616161ff",
    shadowColor: "#00BFFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  yearLeft: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },

  yearRight: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },

  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  dayText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  activeDayText: {
    color: "#00E5FF",
    fontSize: 15,
    fontWeight: "bold",
  },

  weekContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6a6a6aff",
    borderRadius: 40,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#ccc4c4ff",
    paddingHorizontal: 8,
    marginHorizontal: 14,
    marginTop: 12,
    height: 40,
  },

  activeDate: {
    width: 30,
    height: 30,
    borderRadius: 19,
    backgroundColor: "#8EF0FF",
    borderWidth: 2,
    borderColor: "#00D9FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00E5FF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  activeDateText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  normalDate: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  normalDateText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyDate: {
    width: 38,
    height: 38,
    opacity: 0,
  },

  weekDaysContainer: {
    width: "92%",
    backgroundColor: "#2E2E2E",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#4A4A4A",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#00BFFF",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    alignItems: "stretch",
  },

  daysTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  dayTextWrapper: {
    flex: 1,
    alignItems: "center",
  },

  dayRectText: {
    color: "#AAAAAA",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  dayRectTextActive: {
    color: "#3EDCF0",
    fontWeight: "bold",
  },

  trackContainer: {
    height: 36,
    justifyContent: "center",
    position: "relative",
  },

  bgTrack: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    position: "absolute",
    left: 0,
    right: 0,
  },

  activeTrack: {
    height: 30,
    borderRadius: 15,
    position: "absolute",
    left: 0,
    width: "53.5%",
  },

  iconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    left: 0,
    right: 0,
  },

  iconWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  completedCircleGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#3EDCF0",
    justifyContent: "center",
    alignItems: "center",
  },

  activeOuterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#3EDCF0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3EDCF0",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },

  activeInnerGradient: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  futureCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

});