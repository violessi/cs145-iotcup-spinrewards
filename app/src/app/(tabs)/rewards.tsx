import React, { useState, useEffect } from "react";
import { Text, ScrollView, SafeAreaView } from "react-native";
import globalStyles from "@/src/assets/styles";

import { collection, getDocs , doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import Header from "@/src/components/Header";

// rewards
import { Reward } from "@/src/components/types";
import RewardsCard from "@/src/components/RewardsCard";

const currentUserId = "user123";

export default function RewardsScreen() {
  const [activeRewards, setActiveRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([]);

  const fetchUserClaimedRewards = async () => {
    try {
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.rewards || [];
        // setClaimedRewardIds(userData.rewards ); // get claimed array
      } else {
        console.warn("No user data found");
        // setClaimedRewardIds([]);
      }
    } catch (error) {
      console.error("Error fetching user claimed rewards:", error);
      return [];
    }
  };

  const fetchRewards = async () => {
    try {
      const claimedIds = await fetchUserClaimedRewards();

      const rewardsCollection = collection(db, "rewards");
      const rewardsSnapshot = await getDocs(rewardsCollection);
        
      const allRewards: Reward[] = rewardsSnapshot.docs.map((doc) => ({
        id: doc.id, // document ID
        ...(doc.data() as Omit<Reward, 'id'>), 
      }));

      // show active and unclaimed rewards
      const active = allRewards.filter(
        (reward) => reward.status === "active" && !claimedIds.includes(reward.id)
      );

      // show claimed rewards (even if expired) from user
      const claimed = allRewards.filter(
        (reward) => claimedIds.includes(reward.id)
      );

      setActiveRewards(active);
      setClaimedRewards(claimed);

      console.log("Active Rewards:", active);
      console.log("User's Claimed Rewards:", claimed);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Rewards" subtitle="Check your rewards!" />
      <ScrollView
        contentContainerStyle={globalStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={globalStyles.title}> Missions </Text>
        {activeRewards.map((reward, index) => (
          <RewardsCard
            key={reward.id}
            title={`Return to ${reward.end_rack}`}
            desc={reward.desc}
            prize={reward.prize}
            claimed={false}
            reqs={reward.reqs}
            onUpdate={fetchRewards}
            rewardId={reward.id}
            userId={currentUserId}
          />
        ))}
        <Text style={globalStyles.title}> Completed </Text>
        {claimedRewards.map((reward, index) => (
          <RewardsCard
            key={reward.id}
            title={`Return to ${reward.end_rack}`}
            desc={reward.desc}
            prize={reward.prize}
            claimed={true}
            reqs={reward.reqs}
            onUpdate={fetchRewards}
            rewardId={reward.id}
            userId={currentUserId}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}