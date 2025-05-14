import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import globalStyles from "@/src/assets/styles";
import { useRouter } from "expo-router";

// props and style of rewards card 
// displayed in rewards page

type RewardsCardProps = {
  title: string;
  desc: string;
  prize: number;
  claimed: boolean;
  reqs: string[];
  rewardId: string;
  userId: string;
  onUpdate?: () => void;
};

export default function RewardsCard({
  title,
  desc,
  prize,
  claimed,
  reqs = [],
  rewardId,
  userId,
  onUpdate,
}: RewardsCardProps) {
  const router = useRouter();  

  const handleClaim = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/rewardActions/claim", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, rewardId })
      });

      if (res.ok) {
        console.log("Reward claimed");
        onUpdate?.();
      } else {
        const { error } = await res.json();
        console.error("[APP] Failed to claim:", error);
      }
    } catch (err) {
      console.error("[APP] Error claiming:", err);
    }
  };


  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.subtitle}>{title}</Text>

      <View style={globalStyles.row}>
        {/*Left*/}
        <View style={globalStyles.column}>
          <Text style={rewardStyles.label}> Requirements </Text>
          { (reqs.length > 0) && (
            reqs.map((req, index) => (
              <Text key={index} style={rewardStyles.detail}> • {req}</Text>
            ))
          )}
        </View>

        {/*Right*/}
        <View style={globalStyles.column}>
          <Text style={[rewardStyles.label, {color: '#721c24'}]}>Reward </Text>
          <Text style={[rewardStyles.detail, {color: '#721c24'}]}> Php {prize} </Text>
        </View>   
      </View>

      <View style={{ alignItems: 'flex-end' }}>     
      { (!claimed) && (
        <TouchableOpacity
          style={[globalStyles.statusBox, {backgroundColor: '#e2e3e5'}]}
          onPress={() => handleClaim()} // handle verifying
          activeOpacity={0.8}
          >
          <Text>Claim Reward</Text>
        </TouchableOpacity>
      )}
      </View>
    
    </View>
  );
}

const rewardStyles = StyleSheet.create({
  detail: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
});
