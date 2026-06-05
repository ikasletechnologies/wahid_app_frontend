import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
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

import { useNames } from "../context/NamesContext";

const getCalendarData = (activeDates) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 1 = Feb, ..., 11 = Dec

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[month];

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Number of days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create grid arrays
  const daysArray = [];

  // Add empty slots for the days before the 1st of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push({ type: 'empty', day: null, key: `empty-${i}` });
  }

  // Add all days of the month
  for (let d = 1; d <= totalDays; d++) {
    // Format date as YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isActive = activeDates && activeDates.includes(dateStr);
    daysArray.push({
      type: isActive ? 'active' : 'normal',
      day: d,
      key: `day-${d}`,
      dateStr
    });
  }

  // Pad the end of the array with empty slots to complete the last week
  while (daysArray.length % 7 !== 0) {
    daysArray.push({ type: 'empty', day: null, key: `empty-end-${daysArray.length}` });
  }

  // Chunk daysArray into weeks of 7 days
  const weeks = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
  }

  return {
    monthName: currentMonthName,
    year,
    weeks
  };
};

export default function StreakScreen({ navigation }) {
  const { streak, streakDetails, refreshing, refresh } = useNames();
  const streakCount = streak || 0;

  const calendarData = getCalendarData(streakDetails?.activeDates || []);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const activeTrackWidth = `${(todayIndex / 6) * 100}%`;

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
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#3EDCF0"
            colors={["#3EDCF0"]}
          />
        }
      >

        {/* HERO SECTION */}
        <View style={styles.heroRow}>
          {/* LEFT */}
          <View style={styles.leftSection}>
            <View style={styles.flameContainer}>
              <StreakRound width={160} height={160} />
              <View style={styles.iconOverlay}>
                <StreakIcon width={80} height={80} />
              </View>
              <View style={styles.shadowOverlay}>
                <StreakShadow width={120} height={35} />
              </View>
            </View>
          </View>

          {/* RIGHT */}
          <View style={styles.rightSection}>
            {/* STREAK NUMBER */}
            <Svg width={120} height={90}>
              <Defs>
                <SvgGradient id="numGrad" x1="1" y1="1" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#3EDCF0" />
                </SvgGradient>
              </Defs>
              <SvgText fill="url(#numGrad)" fontSize="84" fontWeight="bold" x="0" y="80">
                {streakCount}
              </SvgText>
            </Svg>

            {/* DAYS TEXT */}
            <Svg width={110} height={30} style={styles.daysTextSvg}>
              <Defs>
                <SvgGradient id="daysGrad" x1="1" y1="1" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#3EDCF0" />
                </SvgGradient>
              </Defs>
              <SvgText fill="url(#daysGrad)" fontSize="16" fontWeight="500" x="0" y="24">
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
                <StreakRound width={130} height={130} />
                <View style={styles.iconOverlay}>
                  <StreakIcon width={80} height={80} />
                </View>
                <View style={styles.shadowOverlay}>
                  <StreakShadow width={120} height={35} />
                </View>
              </View>
            </View>

            {/* RIGHT REFLECTION */}
            <View style={styles.rightSection}>
              <Svg width={120} height={80} style={{ paddingRight: 105 }}>
                <Defs>
                  <SvgGradient id="numGradRef" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="1" stopColor="#FFFFFF" />
                    <Stop offset="0" stopColor="#3EDCF0" />
                  </SvgGradient>
                </Defs>
                <SvgText fill="url(#numGradRef)" fontSize="84" fontWeight="bold" x="0" y="80">
                  {streakCount}
                </SvgText>
              </Svg>

              <Svg width={100} height={40} style={{ paddingRight: 105 }}>
                <Defs>
                  <SvgGradient id="daysGradRef" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FFFFFF" />
                    <Stop offset="1" stopColor="#3EDCF0" />
                  </SvgGradient>
                </Defs>
                <SvgText fill="url(#daysGradRef)" fontSize="16" fontWeight="300" x="0" y="34">
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
            <Text style={styles.yearLeft}>{calendarData.monthName}</Text>
            <Text style={styles.yearRight}>{calendarData.year}</Text>
          </View>

          {/* WEEK DAYS */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, idx) => (
              <Text
                key={day}
                style={idx === todayIndex ? styles.activeDayText : styles.dayText}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* WEEKS */}
          {calendarData.weeks.map((week, weekIdx) => {
            const hasActiveDay = week.some(day => day.type === 'active');

            if (hasActiveDay) {
              return (
                <LinearGradient
                  key={`week-${weekIdx}`}
                  colors={["#FFFFFF", "#3EDCF0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.2, y: 0 }}
                  style={[styles.weekContainer, { borderColor: "#3EDCF0" }]}
                >
                  {week.map((dayObj) => {
                    if (dayObj.type === 'empty') {
                      return <View key={dayObj.key} style={styles.emptyDate} />;
                    }
                    if (dayObj.type === 'active') {
                      return (
                        <View key={dayObj.key} style={styles.activeDate}>
                          <Text style={styles.activeDateText}>{dayObj.day}</Text>
                        </View>
                      );
                    }
                    return (
                      <View key={dayObj.key} style={styles.normalDate}>
                        <Text style={styles.normalDateText}>{dayObj.day}</Text>
                      </View>
                    );
                  })}
                </LinearGradient>
              );
            }

            return (
              <View key={`week-${weekIdx}`} style={styles.weekContainer}>
                {week.map((dayObj) => {
                  if (dayObj.type === 'empty') {
                    return <View key={dayObj.key} style={styles.emptyDate} />;
                  }
                  if (dayObj.type === 'active') {
                    return (
                      <View key={dayObj.key} style={styles.activeDate}>
                        <Text style={styles.activeDateText}>{dayObj.day}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={dayObj.key} style={styles.normalDate}>
                      <Text style={styles.normalDateText}>{dayObj.day}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* WEEK DAYS CONTAINER */}
        <View style={styles.weekDaysContainer}>
          {/* Day Names Row */}
          <View style={styles.daysTextRow}>
            {weekDays.map((dayName, index) => {
              const isActive = index === todayIndex;
              return (
                <View key={index} style={styles.dayTextWrapper}>
                  <Text
                    style={[
                      styles.dayRectText,
                      isActive && styles.dayRectTextActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress Track Row */}
          <View style={styles.trackContainer}>
            {/* Background Grey Track */}
            <View style={styles.bgTrack} />

            {/* Active Gradient Track (Sun to today) */}
            <LinearGradient
              colors={["#E0F7FA", "#3EDCF0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.activeTrack, { width: activeTrackWidth }]}
            />

            {/* Icons Row */}
            <View style={styles.iconsRow}>
              {weekDays.map((dayName, index) => {
                const isCompleted = streakDetails?.weeklyProgress?.[dayName] === true;
                let status = "future";
                if (isCompleted) {
                  status = "completed";
                } else if (index === todayIndex) {
                  status = "active";
                }

                return (
                  <View key={index} style={styles.iconWrapper}>
                    {status === "completed" && (
                      <LinearGradient
                        colors={["#FFFFFF", "#3EDCF0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.completedCircleGradient}
                      >
                        <Ionicons name="checkmark" size={14} color="#00838F" style={{ fontWeight: "900" }} />
                      </LinearGradient>
                    )}
                    {status === "active" && (
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
                    {status === "future" && (
                      <View style={styles.futureCircle}>
                        <Ionicons name="checkmark" size={14} color="rgba(62, 220, 240, 0.25)" />
                      </View>
                    )}
                  </View>
                );
              })}
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
    width: 160,
    height: 160,
  },

  iconOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  shadowOverlay: {
    position: "absolute",
    bottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  rightSection: {
    marginLeft: -1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingBottom: -20,
  },

  daysTextSvg: {
    marginLeft: 4,
    marginBottom: 6,
  },

  textShadowContainer: {
    position: "absolute",
    bottom: -20,
    width: 250,
    height: 35,
    left: 0,
    zIndex: -1,
  },

  blurImage: {
    width: 200,
    height: 25,
  },

  reflectionWrapper: {
    height: 100,
    overflow: "hidden",
    marginTop: -60,
    width: "100%",
    alignItems: "center",
    zIndex: -1,
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
    borderColor: "#c4cbccff",
    paddingHorizontal: 8,
    marginHorizontal: 14,
    marginTop: 12,
    height: 40,
  },

  activeDateRect: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
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
    borderColor: "#4a4a4aff",
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

  daysStreakText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
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