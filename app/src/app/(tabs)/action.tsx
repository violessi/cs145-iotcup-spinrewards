import { Text, View, Alert, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

// styling
import Header from "@/src/components/Header";
import Option from "@/src/components/HomeOptions";

// trips
import React, { useState, useEffect } from "react";
import TripCard from "@/src/components/TripCard";
import { Trip } from "@/src/types/types";

export default function ActionPage() {
  const router = useRouter();

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const tripsCollection = collection(db, "trips");
        const tripSnapshot = await getDocs(tripsCollection);

        const allTrips: Trip[] = tripSnapshot.docs.map(
          (doc) => doc.data() as Trip
        );

        const active = allTrips.filter((trip) => trip.status === "reserved");

        setActiveTrips(active);

        console.log("Active Trips:", active);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

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
            onPress={() => router.navigate("/rent")}
          />
          <Option
            title="Return"
            description="Return a bike"
            icon="arrow-left"
            onPress={() => router.navigate("/return")}
          />
          <Option
            title="Reserve"
            description="Reserve a bike"
            icon="calendar"
            onPress={() => router.navigate("/")}
          />
        </View>
        <Header
          title="Your Reservations"
          subtitle="Please use the Rent page to finish your reservation."
          hasBack={false}
          isHomepage={true}
        />
        <View style={{ marginHorizontal: 20 }}>
          {activeTrips.map((trip, index) => (
            <TripCard
              key={index}
              title={`Trip using ${trip.bike_id}`}
              bikeID={`${trip.bike_id}`}
              tripStart={`${trip.start_time?.toDate().toLocaleString()}`}
              tripEnd=""
              remarks={`${trip.status}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
