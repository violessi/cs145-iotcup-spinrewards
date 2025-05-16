import React, { createContext, useState, useContext, ReactNode } from "react";
import { createATrip, getRack, getAvailableBikes } from "@/service/tripService";
import { listenToBikeStatus } from "@/service/listeners";

type BikeContextType = {
  rackId: string;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSuccessModal: React.Dispatch<React.SetStateAction<boolean>>;
  updateRackId: (newRackId: string) => void;
  rentABike: () => Promise<Bike | null>;
  showLoadingModal: boolean;
};

export const BikeContext = createContext<BikeContextType | null>(null);

// Provider component
export const BikeProvider = ({ children }: { children: ReactNode }) => {
  const [rackId, setRackId] = useState("");
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  function updateRackId(newRackId: string) {
    setRackId(newRackId);
  }

  async function checkRackId() {
    try {
      const res = await getRack(rackId);
      return res;
    } catch (err) {
      return err;
    }
  }

  async function checkAvailableBikes(): Promise<Bike[]> {
    try {
      const res = await getAvailableBikes(rackId);
      return res;
    } catch (err: any) {
      return err;
    }
  }

  async function initializeTrip(payload: CreateTrip) {
    try {
      const res = await createATrip(payload);
      return res;
    } catch (err) {
      console.error("Error:", err);
    }
  }

  // ============ FULL RENT A BIKE FUNCTION ============
  async function rentABike() {
    setShowLoadingModal(true);
    try {
      // Check if rackId is valid
      const validRackId = await checkRackId();
      if (Boolean(validRackId.message) === false) {
        throw new Error("Invalid rack ID");
      }

      // Check if there are available bikes
      const availableBikes = await checkAvailableBikes();
      if (!availableBikes || availableBikes.length === 0) {
        throw new Error("No available bikes found");
      }

      // Randomly assign a bike to user
      const randomIndex = Math.floor(Math.random() * availableBikes.length);
      const bike = availableBikes[randomIndex];

      const payload: CreateTrip = {
        bikeId: bike.id,
        userId: "user123", // Replace with actual user ID
        status: "active",
        baseRate: 10,
      };

      await initializeTrip(payload);

      setShowLoadingModal(false);
      setShowSuccessModal(true);
      updateRackId("");

      // listen for changes in bike status.
      // while bike status is not "rented", keep showing the success modal
      // if bike status is "rented", close the modal and navigate to the action page
      const unsub = listenToBikeStatus(bike.id, (status) => {
        if (status.toLowerCase() === "rented") {
          unsub(); // stop listening when status is "rented"
          setShowSuccessModal(false);
        }
      });

      return bike;
    } catch (err: any) {
      setShowLoadingModal(false);
      setShowErrorModal(true);
      return null;
    }
  }

  return (
    <BikeContext.Provider
      value={{
        rackId,
        showSuccessModal,
        showErrorModal,
        setShowErrorModal,
        setShowSuccessModal,
        updateRackId,
        rentABike,
        showLoadingModal,
      }}
    >
      {children}
    </BikeContext.Provider>
  );
};

export const useBike = () => {
  const context = useContext(BikeContext);
  if (!context) {
    throw new Error("useBikeContext must be used within an AppProvider");
  }
  return context;
};
