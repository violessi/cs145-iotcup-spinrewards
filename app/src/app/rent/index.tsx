import { useState } from "react";
import { SafeAreaView, View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/Header";
import Button from "@/components/Button";
import RackInput from "@/components/RackInput";
import { useBike } from "@/context/BikeContext";
import LoadingModal from "@/components/LoadingModal";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";

export default function Rent() {
  const router = useRouter();
  const {
    rackId,
    showSuccessModal,
    showErrorModal,
    setShowErrorModal,
    setShowSuccessModal,
    showLoadingModal,
    updateRackId,
    rentABike,
  } = useBike();

  const [assignedBike, setAssignedBike] = useState<Bike | null>(null);

  const handleButtonPress = async () => {
    try {
      const res = await rentABike();
      setAssignedBike(res);
    } catch (err: any) {
      Alert.alert("Error!", err.message); // temporary; replace with modal
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.dismissTo("/(tabs)/action");
  };

  const handleBack = () => {
    updateRackId("");
    router.replace("/(tabs)/action");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Rent a bike" subtitle="Select a bike to rent" hasBack />
      <View className="flex-1 justify-start gap-4 p-5">
        <Text className="text-secondary text-3xl font-semibold">
          Easily rent a bike by entering the bike rack code.
        </Text>
        <RackInput rackCode={rackId} updateRackCode={updateRackId} />
        <Button
          label="Check Availability"
          onPress={() => handleButtonPress()}
          disabled={!rackId}
        />
      </View>
      <LoadingModal showLoadingModal={showLoadingModal} />
      <SuccessModal
        title="Bike rented successfully!"
        description1={`Your bike is ready for use. Please get your bike in slot ${assignedBike?.rackSlot}.`}
        description2="This modal will close automatically once you have removed your bike."
        showSuccessModal={showSuccessModal}
      />
      <ErrorModal
        title="Error"
        description="An error occurred while processing your request. Please try again."
        showErrorModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}
