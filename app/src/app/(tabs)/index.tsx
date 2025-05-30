import { useRouter } from "expo-router";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

import globalStyles from "@/src/assets/styles";
import Header from "@/src/components/Header";
import Button from "@/src/components/Button";
import { RackOption } from "@/src/components/RackOptions";

export default function Index() {
  const router = useRouter();

  const handleSelectRack = (rackID: string) => {
    router.push({
      pathname: "/reserve",
      params: { rackID }, // dynamically pass the rackID
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <Header title="Racks" subtitle="Check the bike racks near you!" />

      {/* add rack buttons/map here, send rackID (mathces db doc name) to handleSelectRack*/}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-col gap-2 p-5 ">
          <RackOption
            rackId="rack123"
            department="Department of Computer Science"
            onSelect={handleSelectRack}
            image="dcs"
          />
          <RackOption
            rackId="rack456"
            department="Institute of Mathematics"
            onSelect={handleSelectRack}
            image="im"
          />
          <RackOption
            rackId="rack789"
            department="College of Arts and Letters"
            onSelect={handleSelectRack}
            image="cal"
          />
          <RackOption
            rackId="rackABC"
            department="Vinzons Hall"
            onSelect={handleSelectRack}
            image="vh"
          />
        </View>
      </ScrollView>

      {/* <Button label="KAT BUTTON" onPress={() => hwToServer()} /> */}
    </SafeAreaView>
  );
}
