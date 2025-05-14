import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Button } from "react-native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter, Stack } from "expo-router";
import { db } from "@/firebaseConfig";

import globalStyles from "@/src/assets/styles";
import Header from "@/src/components/Header";


// datetimepicker
// import { DatePickerModal } from 'react-native-paper-dates';
// import DateTime from '@/src/components/DateTimePicker';

// handling multiple racks
import { Rack } from "@/src/components/types";
import RackStatus from "@/src/components/RackStatus";
import { useLocalSearchParams } from "expo-router";

export default function ReserveScreen() {
  const { rackID } = useLocalSearchParams(); //
  const [rackData, setRackData] = useState<Rack | null>(null);
  const router = useRouter();  
  
  useEffect(() => {
    const fetchRackInfo = async () => {
      if (!rackID || typeof rackID !== "string") return;

      try {
        // const rackID = "rack123"; // for a specific bike rack; hardcode first; get from docname
        const totalSlots = 5;

        // fetch bike rack info
        // details/address from db = racks, fields = rack_name, location
        const rackDoc = await getDoc(doc(db, "racks", rackID));
        if (!rackDoc.exists()) {
          console.error("[APP] Rack not found"); // modal/go back
          return;
        }

        const rackData = rackDoc.data();
        console.log("Rack Name:", rackData.location);

        // get rack slots info (based on bikes info)
        // taken from bike info (db = bikes) where the rack_id and bike status is stored
        const bikesQuery = query(
          collection(db, "bikes"),
          where("rack_id", "==", rackID)
        );
        const bikesSnapshot = await getDocs(bikesQuery); // get all bikes in that rack
        const bikes = bikesSnapshot.docs.map((doc) => doc.data());
        
        // # available means bikes where rack_id = rack specified and states = available
        // # reserved means bikes where rack_id = rack specified and states = reserved
        // # empty slots means 5 (number of slots) - number of bikes where rack_id = rack specified
        const availableCount = bikes.filter((b) => b.status === "available").length;
        const reservedCount = bikes.filter((b) => b.status === "reserved").length;
        const occupiedSlots = bikes.length; // # number of bikes in that rack
        const emptySlots = totalSlots - occupiedSlots - reservedCount;

        setRackData ({
          name: rackData.rack_name,
          location: rackData.location,
          available: availableCount,
          reserved: reservedCount,
          empty: emptySlots,
        });

        console.log("[APP] Rack:", rackData.rack_name);
        console.log("[APP] Available:", availableCount);
        console.log("[APP] Reserved:", reservedCount);
        console.log("[APP] Empty slots:", emptySlots);
      } catch (error) {
        console.error("[APP] Error fetching racks:", error);
      }
    };
  
    fetchRackInfo();
  }, [rackID]);

  
  // handle reserve function
  const handleReserve = async () => {
    
    try {
      const res = await fetch("http://localhost:3000/api/bikeActions/reserve", {
        method: "POST", // post to server to handle reservation request
        headers: {
          'Content-Type': 'application/json', // Important to send JSON data
        },
        body: JSON.stringify({
          rack: rackID,
          date: "2025-05-13", // replace with date from picker
          time: "11:30", // replace with time from picker
        }),
      });
  
      if (res.ok) {
        console.log("[APP] Bike reserved!");
        router.replace("/action");
      } else {
        const { error } = await res.json();
        console.log(error || "[APP] Error reserving bike");
      }
    } catch (err) {
      console.error("[APP] Error:", err);
    }
  };
  
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // or router.push('/'), depending on your UX
    }
  };

  // const handleDateConfirm = (date: Date) => {
  //   console.log('User picked date:', date);
  //   // send this date to your backend or store it in state
  // };

  // return 3 segments: rack photo, rack status, reserve a bike container
  // reserving a bike has dropdown fields date, start time of reservation, and then reserve button
  // reserve button goes to backend handleReserve fucntion that adds a new trip doc but with status as reserved, which will be timed
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Header 
        title="Reserve"
        subtitle="Reserve a bike from this rack!"
        hasBack={true}
        prevCallback={handleGoBack}
      />
      <ScrollView
        contentContainerStyle={reserveStyles.container}
        showsVerticalScrollIndicator={false}
      >
      <Text style={globalStyles.title}> {rackData && rackData.name} </Text>
      <View style={reserveStyles.reserveCard}>
        <Text style={globalStyles.detail}> Map Photo </Text>
      </View>
      
      <Text style={globalStyles.subtitle}> Rack Status </Text>
      {rackData && (
        <RackStatus
          location={rackData.location}
          available={rackData.available}
          reserved={rackData.reserved}
          empty={rackData.empty}
        />
      )}
      
      <View style={reserveStyles.reserveCard}>
        <Text style={globalStyles.subtitle}> Reserve a Bike </Text>
        <View style={globalStyles.row}>
          <View style={globalStyles.column}> 
            <Text style={globalStyles.detail}> Date </Text>
            <TouchableOpacity
              style={reserveStyles.placeholderPicker}
              onPress={() => {}}
              activeOpacity={0.8}
              >
              <Text style={reserveStyles.buttonText}>Select a Date</Text>
            </TouchableOpacity>
            {/* <DateTime onConfirm={handleDateConfirm} /> */}
          </View>

          <View style={globalStyles.column}> 
            <Text style={globalStyles.detail}> Start Time </Text>
            <TouchableOpacity
              style={reserveStyles.placeholderPicker}
              onPress={() => {}}
              activeOpacity={0.8}
              >
              <Text style={reserveStyles.buttonText}>Select a Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={reserveStyles.reserveButton}
          onPress={handleReserve}
          activeOpacity={0.8}
        >
        <Text style={reserveStyles.buttonText}>Reserve</Text>
        </TouchableOpacity>

        <Text style={globalStyles.note}>Note: Your reservation will only hold for 15 mins! Bike will automatically be reverted to Available if not claimed.  </Text>
      </View>


      </ScrollView>
      
    </SafeAreaView>
  );
}

const reserveStyles = StyleSheet.create({
  container: {
    flexGrow: 1, 
    backgroundColor: '#F2F2F2',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    padding: 20,
  },
  reserveCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    elevation: 5,
  },
  reserveButton: {
    backgroundColor: '#362C5F',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  placeholderPicker: {
    backgroundColor: '#A9A9A9',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    padding: 8,
  },
});