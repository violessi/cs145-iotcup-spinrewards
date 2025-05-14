import React, { useState, useEffect } from "react";
import { Text, ScrollView, SafeAreaView } from "react-native";
import globalStyles from "@/src/assets/styles";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import Header from "@/src/components/Header";

// trips
import { Trip } from "@/src/components/types";
import TripCard from "@/src/components/TripCard";


export default function TripScreen() {
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
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
        trip.status === "active"
      );

      const completed = allTrips.filter(trip =>
        trip.status === "completed" || trip.status === "cancelled"
      );

      setActiveTrips(active);
      setCompletedTrips(completed);

      console.log("Active Trips:", active);
      console.log("Completed Trips:", completed);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Trips" subtitle="Check your trips!" />
      <ScrollView
        contentContainerStyle={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={globalStyles.title}> Active </Text>
        {activeTrips.map((trip, index) => (
          <TripCard
            key={index}
            title={`Trip using ${trip.bike_id}`}
            bikeID={`${trip.bike_id}`}
            tripStart={`${trip.start_time.toDate().toLocaleString()}`}
            tripEnd=""
            remarks={`${trip.status}`}
            addtl_charge={trip.addtl_charge}
            tripID={trip.id}
            onUpdate={fetchTrips}
          />
        ))}
        <Text style={globalStyles.title}> Completed </Text>
        {completedTrips.map((trip, index) => (
          <TripCard
            key={index}
            title={`Trip using ${trip.bike_id}`}
            bikeID={`${trip.bike_id}`}
            tripStart={`${trip.start_time.toDate().toLocaleString()}`}
            tripEnd={`${trip.end_time.toDate().toLocaleString()}`}
            remarks={`${trip.status}`}
            addtl_charge={trip.addtl_charge}
            tripID={trip.id}
            onUpdate={fetchTrips}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}