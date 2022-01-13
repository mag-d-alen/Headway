import React from "react";
import { Text, View } from "react-native";
import AppText from "./text/AppText";
// import AppButton from "./Button";

function Timer({ timer }) {
  // console.log(timer);
  return (
    <View style={{ display: "flex", flexDirection: "row", color: "white", marginTop: 15, }}>
      {/* <AppText style={{ color: "white", fontSize: 20 }}>Duration:</AppText> */}
      <AppText style={{ color: "white", fontSize: 20 }}>
        {/* {" "} */}
        {("0" + Math.floor((timer / 60000) % 60)).slice(-2)}:
      </AppText>
      <AppText style={{ color: "white", fontSize: 20 }}>
        {" "}
        {("0" + Math.floor((timer / 1000) % 60)).slice(-2)}:
      </AppText>
      <AppText style={{ color: "white", fontSize: 20 }}>
        {" "}
        {("0" + Math.floor((timer / 10) % 100)).slice(-2)}
      </AppText>
      {/* <View>
        {!timerOn && (
          <AppButton onPress={() => setTimerOn(true)}>start</AppButton>
        )}
        {timerOn && (
          <>
            <AppButton onPress={() => setTimerOn(false)}>stop</AppButton>
            <AppButton onPress={() => setTimerOn(true)}>resume</AppButton>
          </>
        )}
        {timer > 0 && <AppButton onPress={() => setTimer(0)}>reset</AppButton>}
      </View> */}
    </View>
  );
}

export default Timer;
