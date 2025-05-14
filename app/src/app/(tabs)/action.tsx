import { Text, View, Alert, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

// styling
import globalStyles from "@/src/assets/styles";
import Header from "@/src/components/Header";
import Option from "@/src/components/HomeOptions";

// trips
import React, { useState, useEffect } from "react";
import { Trip } from "@/src/components/types";
import TripCard from "@/src/components/TripCard";

export default function ActionPage() {
  const router = useRouter();
  const handleAvail = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/bikeActions/avail", {
        method: "POST", // post to server to handle avail request
      });
  
      if (res.ok) {
        Alert.alert("Bike availed!");
        router.replace("/trips"); // redirect to updated trips page
      } else {
        Alert.alert("Error availing bike");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };
  
  const handleReturn = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/bikeActions/return", {
        method: "POST", // post to server to handle return request
      });
  
      if (res.ok) {
        Alert.alert("Bike returned!");
        router.replace("/trips");
      } else {
        const { error } = await res.json();
        Alert.alert(error || "Error returning bike");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };  

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);

  const fetchTrips = async () => {
      try {
        const tripsCollection = collection(db, "trips");
        const tripSnapshot = await getDocs(tripsCollection);
          
        const allTrips: Trip[] = tripSnapshot.docs.map((doc) => ({
          id: doc.id, // document ID
          ...(doc.data() as Omit<Trip, 'id'>), 
        }));
  
        const active = allTrips.filter(trip =>
          trip.status === "reserved"
        );
  
        setActiveTrips(active);
  
        console.log("Active Trips:", active);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };
  
    useEffect(() => {
      fetchTrips();
    }, []);



  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Welcome, user!"
        subtitle="What do you want to do today?"
        hasBack={false}
        isHomepage={true}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
      <View className="flex-1 justify-start gap-1 p-5">
        <Option
          title="Rent"
          description="Rent a bike"
          icon="bike"
          onPress={handleAvail}
        />
        <Option
          title="Return"
          description="Return a bike"
          icon="arrow-left"
          onPress={handleReturn}
        />
        <Option
          title="Reserve"
          description="Reserve a bike"
          icon="calendar"
          onPress={() => router.replace('/')} 
        />

      </View>
      <Header
        title="Your Reservations"
        subtitle="Please use the Rent page to finish your reservation."
        hasBack={false}
        isHomepage={true}
      />
      <View style={{marginHorizontal: 20}}>      
        {activeTrips.map((trip, index) => (
          <TripCard
            key={index}
            title={`Trip using ${trip.bike_id}`}
            bikeID={`${trip.bike_id}`}
            tripStart={`${trip.start_time.toDate().toLocaleString()}`}
            tripEnd=""
            remarks={`${trip.status}`}
            tripID={trip.id}
            onUpdate={fetchTrips}
          />
        ))}
      </View>
      
      </ScrollView>

    </SafeAreaView>
  );
}
