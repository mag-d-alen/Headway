/** @format */

import React, { useState, useEffect, useContext } from "react";
import MapView, { Polyline, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Button,
  ImageBackground,
  Text,
} from "react-native";
import socket from "../config/socket";
import environment from "../config/environment/environment";
import useLocation from "../hooks/useLocation";
import axios from "axios";
import pick from "lodash/pick";
import * as Location from "expo-location";
import AuthContext from "../Context/AuthContext";
import Colors from "../config/Colors";
import Loader from "../components/Loader";
import Timer from "../components/Timer";
import haversine from "haversine";
import AppText from "../components/text/AppText";

Location.installWebGeolocationPolyfill();

export default function MyMap({ navigation }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const [firstCall, setFirstCall] = useState(true);
  const [route, setRoute] = useState([]);
  const [track, setTrack] = useState(false);
  const { location, fetching } = useLocation();
  const [timer, setTimer] = useState(0);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [prevLatLng, setPrevLatLng] = useState("");
  const [timerOn, setTimerOn] = useState(false);
  const { coords, setCoords, change, setChange, user } =
    useContext(AuthContext);

  const handleTrackOn = () => {
    setTrack(true);
    setTimerOn(true);
  };
  const handleTrackOff = () => {
    setTrack(false);
    setTimerOn(false);
    setTimer(0);
    setDistanceTravelled(0);
  };

  useEffect(() => {
    let interval;
    if (timerOn) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  });
  useEffect(() => {
    let watchID;
    if (track) {
      navigator.geolocation.getCurrentPosition(
        (position) => {},
        (error) => alert(error.message),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
      watchID = navigator.geolocation.watchPosition((position) => {
        const positionLatLngs = pick(position.coords, [
          "latitude",
          "longitude",
        ]);
        const newLatLngs = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setRoute((prev) => [...prev, positionLatLngs]);
        console.log(route);
        setDistanceTravelled(distanceTravelled + calcDistance(newLatLngs));
        setPrevLatLng(newLatLngs);
      });
    }
    return () => {
      navigator.geolocation.clearWatch(watchID);
      setRoute([]);
    };
  }, [track, distanceTravelled]);
  const calcDistance = (newLatLng) => {
    return haversine(prevLatLng, newLatLng) || 0;
  };
  const getFeedComplains = async () => {
    if (firstCall) {
      setLoading(true);
      setFirstCall(false);
    }
    try {
      let data = await axios.get(`${environment.baseUrl}/all-complains`);

      setFeed(data.data.complain.reverse());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
  const handleAddMarker = (e) => {
    const markerCoords = e.nativeEvent.coordinate;
    setCoords(markerCoords);
    navigation.navigate("PostComplainTab");
  };
  useEffect(() => {
    getFeedComplains();
    socket.on("complain", () => {
      setChange(!change);
    });

    return () => {
      socket.off("complain");
    };
  }, [change]);
  //todo
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {fetching && (
        <Loader style={styles.loader} source={require("../assets/giphy.gif")} />
      )}
      {!fetching && (
        <View style={styles.flexBetween}>
          {timerOn && (
            <View
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Timer timer={timer} />
              <AppText
                style={{
                  color: "white",
                  fontSize: 20,
                  paddingTop: 5,
                  marginBottom: 12,
                }}
              >
                {parseFloat(distanceTravelled).toFixed(2)}km
              </AppText>
            </View>
          )}
          {!track ? (
            <>
              <Text style={{ color: "white", fontSize: 20, letterSpacing: 2 }}>
                MAP
              </Text>
              <MaterialCommunityIcons
                name="play"
                color={"white"}
                size={50}
                style={styles.tracingButton}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                onPress={() => handleTrackOn()}
              />
            </>
          ) : (
            <>
              <React.Fragment>
                <MaterialCommunityIcons
                  name="stop"
                  color={"white"}
                  size={50}
                  style={styles.tracingButton}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                  onPress={() => handleTrackOff()}
                />

                <MaterialCommunityIcons
                  name="plus"
                  color={"white"}
                  size={50}
                  style={styles.saveButton}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                  onPress={(e) => handleAddMarker(e)}
                />
              </React.Fragment>
            </>
          )}
        </View>
      )}

      {location && !fetching && (
        <MapView
          userLocationAnnotationTitle={user.name}
          showsMyLocationButton={true}
          showsBuildings={true}
          showsCompass={true}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          followUserLocation={true}
          overlays={[
            {
              coordinates: route,
              strokeColor: "#19B5FE",
              lineWidth: 1000,
            },
          ]}
          onLongPress={(e) => handleAddMarker(e)}
        >
          {/* {console.log("route", route)} */}
          {track && (
            <Polyline
              coordinates={route}
              strokeWidth={5}
              // lineDashPattern={[1]}
            />
          )}
          {feed.map((mark) => {
            const { _id, latitude, issueName, remarks, longitude } = mark;
            let markerColor;
            switch (issueName) {
              case "Violent Animals":
                markerColor = "green";
                break;
              case "Street Light Outage":
                markerColor = "yellow";
              case "Pavement ":
                markerColor = "tomato";
                break;
              case "Illegal Parking":
                markerColor = "wheat";
                break;
              case "Sewage":
                markerColor = "orange";
                break;
              case "Pothole":
                markerColor = "indigo";
                break;
              case "Garbage":
                markerColor = "teal";
                break;
              default:
                markerColor = "purple";
                break;
            }

            return (
              <Marker
                key={_id}
                coordinate={{
                  latitude: latitude,
                  longitude: longitude,
                }}
                title={issueName}
                description={remarks}
                pinColor={markerColor}
              />
            );
          })}
        </MapView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
  card: {
    backgroundColor: Colors.purple,
    width: "100%",
    height: 110,
  },
  flexBetween: {
    backgroundColor: Colors.purple,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 30,
    paddingLeft: 30,
    paddingTop: 20,
    height: 100,
  },
  loader: {
    position: "absolute",
    right: 0,
    height: 60,
    width: 60,
    textAlign: "center",
  },
  tracingButton: {
    paddingTop: Platform.OS === "ios" ? 2 : 2,

    paddingLeft: Platform.OS === "ios" ? 2 : 4,

    borderWidth: 2,
    borderColor: "white",
    borderRadius: Platform.OS === "ios" ? 28 : 30,
    position: "absolute",
    bottom: 10,
    right: 30,
  },
  saveButton: {
    paddingTop: Platform.OS === "ios" ? 2 : 2,
    paddingLeft: Platform.OS === "ios" ? 2 : 4,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: Platform.OS === "ios" ? 28 : 30,
    position: "absolute",
    right: 110,
    bottom: 10,
  },
  map: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  iconGo: {},
  iconStop: {},
  iconSave: {},

  button: {
    backgroundColor: "#DDDDDD",
    marginTop: 200,
    padding: 30,
  },
});

function regionFrom(lat, lon, distance) {
  distance = distance / 2;
  const circumference = 40075;
  const oneDegreeOfLatitudeInMeters = 111.32 * 1000;
  const angularDistance = distance / circumference;

  const latitudeDelta = distance / oneDegreeOfLatitudeInMeters;
  const longitudeDelta = Math.abs(
    Math.atan2(
      Math.sin(angularDistance) * Math.cos(lat),
      Math.cos(angularDistance) - Math.sin(lat) * Math.sin(lat)
    )
  );

  return (result = {
    latitude: lat,
    longitude: lon,
    latitudeDelta,
    longitudeDelta,
  });
}
